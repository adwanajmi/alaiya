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
	deleteDoc,
	orderBy,
	limit
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
	const [growthLogs, setGrowthLogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pendingFamilyId, setPendingFamilyId] = useState(null);
	const [modal, setModal] = useState({ isOpen: false, type: null, payload: null });
	const [encouragement, setEncouragement] = useState(null);

	const openModal = (type, payload = null) => setModal({ isOpen: true, type, payload });
	const closeModal = () => setModal({ isOpen: false, type: null, payload: null });
	
	const showEncouragement = (msg) => setEncouragement(msg);

	useEffect(() => {
		return auth.onAuthStateChanged(async (u) => {
			if (u) {
				const userDoc = await getDoc(doc(db, "users", u.uid));
				if (!userDoc.exists()) {
					await setDoc(doc(db, "users", u.uid), {
						uid: u.uid,
						email: u.email,
						displayName: u.displayName,
						photoURL: u.photoURL,
						currentFamilyId: null,
					});
					setUser({
						uid: u.uid,
						email: u.email,
						displayName: u.displayName,
						photoURL: u.photoURL,
						currentFamilyId: null,
					});
				} else {
					setUser({ ...userDoc.data(), photoURL: u.photoURL });
				}
			} else {
				setUser(null);
				setFamily(null);
				setFamilyMembers([]);
				setBabies([]);
				setActiveBaby(null);
				setLogs([]);
				setGrowthLogs([]);
			}
			setLoading(false);
		});
	}, []);

	useEffect(() => {
		if (!user?.currentFamilyId) return;

		const unsubFamily = onSnapshot(
			doc(db, "families", user.currentFamilyId),
			(d) => {
				if (d.exists()) setFamily({ id: d.id, ...d.data() });
			}
		);

		const unsubMembers = onSnapshot(
			query(
				collection(db, "family_members"),
				where("familyId", "==", user.currentFamilyId)
			),
			(s) => {
				setFamilyMembers(s.docs.map((d) => ({ id: d.id, ...d.data() })));
			}
		);

		const unsubBabies = onSnapshot(
			query(
				collection(db, "babies"),
				where("familyId", "==", user.currentFamilyId)
			),
			(s) => {
				const b = s.docs.map((d) => ({ id: d.id, ...d.data() }));
				setBabies(b);
				if (b.length > 0 && (!activeBaby || !b.find(x => x.id === activeBaby.id))) {
					setActiveBaby(b[0]);
				}
			}
		);

		return () => {
			unsubFamily();
			unsubMembers();
			unsubBabies();
		};
	}, [user?.currentFamilyId]);

	useEffect(() => {
		if (!user?.currentFamilyId || !activeBaby?.id) return;
		
		const unsubLogs = onSnapshot(
			query(
				collection(db, "logs"),
				where("familyId", "==", user.currentFamilyId),
				where("babyId", "==", activeBaby.id),
				orderBy("timestamp", "desc"),
				limit(50)
			),
			(s) => {
				setLogs(
					s.docs
						.map((d) => ({ id: d.id, ...d.data() }))
						.sort(
							(a, b) =>
								(b.timestamp || b.time || 0) - (a.timestamp || a.time || 0)
						)
				);
			}
		);

		const unsubGrowth = onSnapshot(
			query(
				collection(db, "growth"),
				where("familyId", "==", user.currentFamilyId),
				where("babyId", "==", activeBaby.id)
			),
			(s) => {
				setGrowthLogs(
					s.docs
						.map((d) => ({ id: d.id, ...d.data() }))
						.sort((a, b) => b.timestamp - a.timestamp)
				);
			}
		);

		return () => {
			unsubLogs();
			unsubGrowth();
		};
	}, [user?.currentFamilyId, activeBaby?.id]);

	const login = () => signInWithPopup(auth, googleProvider);
	const logout = () => signOut(auth);

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
			displayName: user.displayName,
			photoURL: user.photoURL || null,
			role: "parent",
			status: "active",
			joinedAt: Date.now(),
		});

		await updateDoc(doc(db, "users", user.uid), {
			currentFamilyId: familyRef.id,
		});
		setUser((prev) => ({ ...prev, currentFamilyId: familyRef.id }));
	};

	const joinFamily = async (code) => {
		const q = query(
			collection(db, "families"),
			where("joinCode", "==", code.trim().toUpperCase())
		);
		const snap = await getDocs(q);
		if (snap.empty) return "Family not found. Check the code and try again.";

		setPendingFamilyId(snap.docs[0].id);
		return null;
	};

	const confirmRole = async (role) => {
		if (!pendingFamilyId) return;

		const memberId = `${pendingFamilyId}_${user.uid}`;
		await setDoc(doc(db, "family_members", memberId), {
			familyId: pendingFamilyId,
			userId: user.uid,
			email: user.email,
			displayName: user.displayName,
			photoURL: user.photoURL || null,
			role,
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

	const removeMember = async (memberDocId, memberUserId) => {
		try {
			await deleteDoc(doc(db, "family_members", memberDocId));
			await updateDoc(doc(db, "users", memberUserId), { currentFamilyId: null });
			if (memberUserId === user.uid) {
				setUser((prev) => ({ ...prev, currentFamilyId: null }));
				setFamily(null);
				setBabies([]);
				setLogs([]);
			}
		} catch (error) {
			console.error("Error removing member:", error);
			alert("Failed to remove member. You might not have permission.");
		}
	};

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

	const updateBaby = async (babyId, babyData) => {
		await updateDoc(doc(db, "babies", babyId), babyData);
	};

	const deleteBaby = async (babyId) => {
		await deleteDoc(doc(db, "babies", babyId));
	};

	const switchBaby = (babyId) => {
		const b = babies.find((x) => x.id === babyId);
		if (b) setActiveBaby(b);
	};

	const addLog = async (logData) => {
		const logTimestamp = logData.timestamp || Date.now();
		const dataToSave = { ...logData };
		delete dataToSave.timestamp;

		await addDoc(collection(db, "logs"), {
			...dataToSave,
			familyId: user.currentFamilyId,
			babyId: activeBaby.id,
			userId: user.uid,
			timestamp: logTimestamp,
		});
	};

	const updateLog = async (logId, updatedData) => {
		const logTimestamp = updatedData.timestamp || Date.now();
		const dataToSave = { ...updatedData };
		delete dataToSave.timestamp;
		await updateDoc(doc(db, "logs", logId), {
			...dataToSave,
			timestamp: logTimestamp,
		});
	};

	const deleteLog = async (logId) => {
		await deleteDoc(doc(db, "logs", logId));
	};

	const addGrowthLog = async (data) => {
		await addDoc(collection(db, "growth"), {
			...data,
			familyId: user.currentFamilyId,
			babyId: activeBaby.id,
			timestamp: data.timestamp || Date.now(),
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
				growthLogs,
				loading,
				pendingFamilyId,
				encouragement,
				login,
				logout,
				createFamily,
				joinFamily,
				confirmRole,
				cancelRoleSelection,
				removeMember,
				addBaby,
				updateBaby,
				deleteBaby,
				switchBaby,
				addLog,
				updateLog,
				deleteLog,
				addGrowthLog,
				modal,
				openModal,
				closeModal,
				showEncouragement
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => useContext(AppContext);