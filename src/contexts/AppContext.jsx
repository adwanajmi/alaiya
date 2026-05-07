import { signInWithPopup, signOut } from "firebase/auth";
import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	onSnapshot,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../services/firebase";

const AppContext = createContext();

const generateJoinCode = () =>
	Math.random().toString(36).substring(2, 10).toUpperCase();

export const AppProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [family, setFamily] = useState(null);
	const [familyMembers, setFamilyMembers] = useState([]);
	const [babies, setBabies] = useState([]);
	const [activeBaby, setActiveBaby] = useState(null);
	const [logs, setLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pendingFamilyId, setPendingFamilyId] = useState(null); // waiting for role selection

	const [modal, setModal] = useState({ isOpen: false, type: null });
	const openModal = (type) => setModal({ isOpen: true, type });
	const closeModal = () => setModal({ isOpen: false, type: null });

	useEffect(() => {
		return auth.onAuthStateChanged(async (u) => {
			if (u) {
				const userDoc = await getDoc(doc(db, "users", u.uid));
				if (!userDoc.exists()) {
					await setDoc(doc(db, "users", u.uid), {
						uid: u.uid,
						email: u.email,
						displayName: u.displayName,
						photoURL: u.photoURL ?? null,
						currentFamilyId: null,
						joinedAt: Date.now(),
					});
					setUser({
						uid: u.uid,
						email: u.email,
						displayName: u.displayName,
						photoURL: u.photoURL ?? null,
						currentFamilyId: null,
						joinedAt: Date.now(),
					});
				} else {
					setUser(userDoc.data());
				}
			} else {
				setUser(null);
				setFamily(null);
				setFamilyMembers([]);
				setBabies([]);
				setActiveBaby(null);
				setLogs([]);
				setPendingFamilyId(null);
			}
			setLoading(false);
		});
	}, []);

	// ── Real-time family + babies + members listener ──────────────────────────
	useEffect(() => {
		if (!user?.currentFamilyId) return;

		const unsubFamily = onSnapshot(
			doc(db, "families", user.currentFamilyId),
			(d) => {
				if (d.exists()) setFamily({ id: d.id, ...d.data() });
			},
		);

		const unsubBabies = onSnapshot(
			query(
				collection(db, "babies"),
				where("familyId", "==", user.currentFamilyId),
			),
			(s) => {
				const b = s.docs.map((d) => ({ id: d.id, ...d.data() }));
				setBabies(b);
				if (b.length > 0 && !activeBaby) setActiveBaby(b[0]);
			},
		);

		// Real-time family members with user profile enrichment
		const unsubMembers = onSnapshot(
			query(
				collection(db, "family_members"),
				where("familyId", "==", user.currentFamilyId),
				where("status", "==", "active"),
			),
			async (s) => {
				const members = s.docs.map((d) => ({ id: d.id, ...d.data() }));
				// Enrich each member with their user profile (displayName, photoURL)
				const enriched = await Promise.all(
					members.map(async (m) => {
						try {
							const userSnap = await getDoc(doc(db, "users", m.userId));
							if (userSnap.exists()) {
								const u = userSnap.data();
								return {
									...m,
									displayName: u.displayName ?? m.email,
									photoURL: u.photoURL ?? null,
								};
							}
						} catch (_) {}
						return { ...m, displayName: m.email, photoURL: null };
					}),
				);
				setFamilyMembers(enriched);
			},
		);

		return () => {
			unsubFamily();
			unsubBabies();
			unsubMembers();
		};
	}, [user?.currentFamilyId]);

	// ── Logs listener ─────────────────────────────────────────────────────────
	useEffect(() => {
		if (!user?.currentFamilyId || !activeBaby?.id) return;
		return onSnapshot(
			query(
				collection(db, "logs"),
				where("familyId", "==", user.currentFamilyId),
				where("babyId", "==", activeBaby.id),
			),
			(s) => {
				setLogs(
					s.docs
						.map((d) => ({ id: d.id, ...d.data() }))
						.sort(
							(a, b) =>
								(b.timestamp || b.time || 0) - (a.timestamp || a.time || 0),
						),
				);
			},
		);
	}, [user?.currentFamilyId, activeBaby?.id]);

	const login = () => signInWithPopup(auth, googleProvider);
	const logout = () => signOut(auth);

	// ── Create family (creator is always admin) ───────────────────────────────
	const createFamily = async (familyName) => {
		const joinCode = generateJoinCode();
		const familyRef = await addDoc(collection(db, "families"), {
			name: familyName,
			joinCode,
			createdAt: Date.now(),
		});
		const memberId = `${familyRef.id}_${user.uid}`;
		await setDoc(doc(db, "family_members", memberId), {
			familyId: familyRef.id,
			userId: user.uid,
			email: user.email,
			role: "admin",
			status: "active",
			joinedAt: Date.now(),
		});
		await updateDoc(doc(db, "users", user.uid), {
			currentFamilyId: familyRef.id,
		});
		setUser((prev) => ({ ...prev, currentFamilyId: familyRef.id }));
	};

	// ── Join family — returns error string or null, sets pendingFamilyId ──────
	const joinFamily = async (code) => {
		const q = query(
			collection(db, "families"),
			where("joinCode", "==", code.trim().toUpperCase()),
		);
		const snap = await getDocs(q);
		if (snap.empty) return "Family not found. Check the code and try again.";

		const familyId = snap.docs[0].id;

		// Check if already a member
		const existingMember = await getDoc(
			doc(db, "family_members", `${familyId}_${user.uid}`),
		);
		if (existingMember.exists()) {
			// Already a member — just switch into the family
			await updateDoc(doc(db, "users", user.uid), {
				currentFamilyId: familyId,
			});
			setUser((prev) => ({ ...prev, currentFamilyId: familyId }));
			return null;
		}

		// New member — pause and ask for role
		setPendingFamilyId(familyId);
		return null;
	};

	// ── Confirm role after joining ────────────────────────────────────────────
	const confirmRole = async (role) => {
		if (!pendingFamilyId) return;
		const memberId = `${pendingFamilyId}_${user.uid}`;
		await setDoc(doc(db, "family_members", memberId), {
			familyId: pendingFamilyId,
			userId: user.uid,
			email: user.email,
			role, // "parent" | "caregiver"
			status: "active",
			joinedAt: Date.now(),
		});
		await updateDoc(doc(db, "users", user.uid), {
			currentFamilyId: pendingFamilyId,
		});
		setUser((prev) => ({ ...prev, currentFamilyId: pendingFamilyId }));
		setPendingFamilyId(null);
	};

	const cancelRoleSelection = () => setPendingFamilyId(null);

	const addBaby = async (babyData) => {
		const docRef = await addDoc(collection(db, "babies"), {
			...babyData,
			familyId: user.currentFamilyId,
		});
		setActiveBaby({
			id: docRef.id,
			...babyData,
			familyId: user.currentFamilyId,
		});
	};

	const switchBaby = (babyId) => {
		const b = babies.find((x) => x.id === babyId);
		if (b) setActiveBaby(b);
	};

	const addLog = async (logData) => {
		await addDoc(collection(db, "logs"), {
			...logData,
			familyId: user.currentFamilyId,
			babyId: activeBaby.id,
			userId: user.uid,
			timestamp: Date.now(),
		});
	};

	return (
		<AppContext.Provider
			value={{
				user,
				family,
				familyMembers,
				babies,
				activeBaby,
				logs,
				loading,
				pendingFamilyId,
				login,
				logout,
				createFamily,
				joinFamily,
				confirmRole,
				cancelRoleSelection,
				addBaby,
				switchBaby,
				addLog,
				modal,
				openModal,
				closeModal,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => useContext(AppContext);
