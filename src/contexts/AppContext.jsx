import { signInWithPopup, signOut } from "firebase/auth";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	limit,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../services/firebase";
import {
	getDefaultUserRoleFields,
	getDisplayRole,
	isSuperAdminUser,
} from "../utils/roles";

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
	const [familyDataLoading, setFamilyDataLoading] = useState(false);
	const [pendingFamilyId, setPendingFamilyId] = useState(null);
	const [modal, setModal] = useState({
		isOpen: false,
		type: null,
		payload: null,
	});
	const [encouragement, setEncouragement] = useState(null);
	const [userRole, setUserRole] = useState("caregiver");
	const [userParentType, setUserParentType] = useState(null);

	const openModal = (type, payload = null) =>
		setModal({ isOpen: true, type, payload });
	const closeModal = () =>
		setModal({ isOpen: false, type: null, payload: null });
	const showEncouragement = (msg) => setEncouragement(msg);

	useEffect(() => {
		let unsubscribeUserDoc = null;

		const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
			if (unsubscribeUserDoc) {
				unsubscribeUserDoc();
				unsubscribeUserDoc = null;
			}

			if (u) {
				const userRef = doc(db, "users", u.uid);
				const userDoc = await getDoc(userRef);
				const authProfile = {
					uid: u.uid,
					email: u.email,
					displayName: u.displayName,
					googlePhotoURL: u.photoURL,
				};
				const existingUserData = userDoc.exists() ? userDoc.data() : {};
				const roleFields = getDefaultUserRoleFields(authProfile, existingUserData);

				if (!userDoc.exists()) {
					try {
						await setDoc(userRef, {
							...authProfile,
							...roleFields,
							photoURL: u.photoURL,
							currentFamilyId: null,
							createdAt: Date.now(),
							lastLoginAt: Date.now(),
						});
					} catch (error) {
						console.warn("User role initialization deferred", error);
						await setDoc(userRef, {
							...authProfile,
							photoURL: u.photoURL,
							currentFamilyId: null,
							createdAt: Date.now(),
							lastLoginAt: Date.now(),
						});
					}
				} else {
					try {
						await setDoc(
							userRef,
							{
								email: u.email,
								displayName: u.displayName,
								googlePhotoURL: u.photoURL,
								...roleFields,
								lastLoginAt: Date.now(),
							},
							{ merge: true },
						);
					} catch (error) {
						console.warn("User role migration deferred", error);
						await updateDoc(userRef, {
							email: u.email,
							displayName: u.displayName,
							googlePhotoURL: u.photoURL,
							lastLoginAt: Date.now(),
						});
					}
				}

				const initialDocData = { ...existingUserData, ...roleFields };
				setUser({
					...authProfile,
					...initialDocData,
					currentFamilyId: initialDocData.currentFamilyId || null,
					uid: u.uid,
					email: u.email,
					displayName: u.displayName || initialDocData.displayName,
					photoURL: initialDocData.photoURL || u.photoURL,
					googlePhotoURL: u.photoURL,
				});

				unsubscribeUserDoc = onSnapshot(
					userRef,
					(snapshot) => {
						const docData = snapshot.exists() ? snapshot.data() : {};
						setUser({
							...authProfile,
							...docData,
							uid: u.uid,
							email: u.email,
							displayName: u.displayName || docData.displayName,
							photoURL: docData.photoURL || u.photoURL,
							googlePhotoURL: u.photoURL,
						});
					},
					(error) => {
						console.error("User listener error", error);
						setUser({ ...authProfile, currentFamilyId: null });
					},
				);
			} else {
				setUser(null);
				setFamily(null);
				setFamilyMembers([]);
				setBabies([]);
				setActiveBaby(null);
				setLogs([]);
				setGrowthLogs([]);
				setPendingFamilyId(null);
				setUserRole("caregiver");
				setUserParentType(null);
				setFamilyDataLoading(false);
			}
			setLoading(false);
		});

		return () => {
			unsubscribeAuth();
			if (unsubscribeUserDoc) unsubscribeUserDoc();
		};
	}, []);

	useEffect(() => {
		if (!user?.currentFamilyId) {
			return;
		}

		setFamilyDataLoading(true);

		const unsubFamily = onSnapshot(
			doc(db, "families", user.currentFamilyId),
			(d) => {
				setFamily(d.exists() ? { id: d.id, ...d.data() } : null);
			},
			(error) => {
				console.error("Family listener error", error);
				setFamilyDataLoading(false);
			},
		);

		const unsubMembers = onSnapshot(
			query(
				collection(db, "family_members"),
				where("familyId", "==", user.currentFamilyId),
			),
			(s) => {
				const members = s.docs.map((d) => ({ id: d.id, ...d.data() }));
				setFamilyMembers(members);
				const myMemberDoc = members.find((m) => m.userId === user.uid);
				if (myMemberDoc) {
					setUserRole(myMemberDoc.role);
					setUserParentType(myMemberDoc.parentType || null);
				} else {
					setUserRole("caregiver");
					setUserParentType(null);
				}
			},
			(error) => {
				console.error("Family members listener error", error);
				setFamilyDataLoading(false);
			},
		);

		const unsubBabies = onSnapshot(
			query(
				collection(db, "babies"),
				where("familyId", "==", user.currentFamilyId),
			),
			(s) => {
				const b = s.docs
					.map((d) => ({ id: d.id, ...d.data() }))
					.filter((baby) => !baby.archived);
				setBabies(b);
				if (
					b.length > 0 &&
					(!activeBaby || !b.find((x) => x.id === activeBaby?.id))
				) {
					setActiveBaby(b[0]);
				} else if (b.length === 0) {
					setActiveBaby(null);
				}
				setFamilyDataLoading(false);
			},
			(error) => {
				console.error("Babies listener error", error);
				setFamilyDataLoading(false);
			},
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
				limit(50),
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

		const unsubGrowth = onSnapshot(
			query(
				collection(db, "growth"),
				where("familyId", "==", user.currentFamilyId),
				where("babyId", "==", activeBaby.id),
			),
			(s) => {
				setGrowthLogs(
					s.docs
						.map((d) => ({ id: d.id, ...d.data() }))
						.sort((a, b) => b.timestamp - a.timestamp),
				);
			},
		);

		return () => {
			unsubLogs();
			unsubGrowth();
		};
	}, [user?.currentFamilyId, activeBaby?.id]);

	const login = () => signInWithPopup(auth, googleProvider);
	const logout = () => signOut(auth);

	const isSuperAdmin = isSuperAdminUser(user);
	const isFamilyCreator = Boolean(family?.createdBy && family.createdBy === user?.uid);
	const displayRole = getDisplayRole({
		user,
		familyRole: userRole,
		parentType: userParentType,
		isFamilyCreator,
	});

	const createFamily = async (familyName, parentType = "mother") => {
		if (!user?.uid) {
			throw new Error("You need to sign in before creating a family.");
		}

		const joinCode = generateJoinCode();
		const familyRef = await addDoc(collection(db, "families"), {
			name: familyName.trim(),
			joinCode,
			createdAt: Date.now(),
			createdBy: user.uid,
		});
		await setDoc(doc(db, "invite_codes", joinCode), {
			familyId: familyRef.id,
			createdBy: user.uid,
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
			parentType,
			status: "active",
			joinedAt: Date.now(),
		});
		await updateDoc(doc(db, "users", user.uid), {
			currentFamilyId: familyRef.id,
			accountType: "parent",
			parentType,
		});
		setUser((prev) => ({
			...prev,
			currentFamilyId: familyRef.id,
			accountType: "parent",
			parentType,
		}));
		return familyRef.id;
	};

	const createInviteCode = async () => {
		if (!family?.id) {
			throw new Error("No family found.");
		}

		const joinCode =
			typeof family.joinCode === "string" && family.joinCode.trim()
				? family.joinCode.trim().toUpperCase()
				: generateJoinCode();
		if (family.joinCode !== joinCode) {
			await updateDoc(doc(db, "families", family.id), { joinCode });
		}
		await setDoc(doc(db, "invite_codes", joinCode), {
			familyId: family.id,
			createdBy: user.uid,
			createdAt: Date.now(),
		});
		setFamily((prev) => (prev ? { ...prev, joinCode } : prev));
		return joinCode;
	};

	const joinFamily = async (code) => {
		if (!user?.uid) return "Please sign in before joining a family.";

		const inviteCode = code.trim().toUpperCase();
		const inviteSnap = await getDoc(doc(db, "invite_codes", inviteCode));
		if (!inviteSnap.exists()) return "Family not found.";
		setPendingFamilyId(inviteSnap.data().familyId);
		return null;
	};

	const confirmRole = async (role, parentType = null) => {
		if (!user?.uid || !pendingFamilyId) return;
		const memberId = `${pendingFamilyId}_${user.uid}`;
		await setDoc(doc(db, "family_members", memberId), {
			familyId: pendingFamilyId,
			userId: user.uid,
			email: user.email,
			displayName: user.displayName,
			photoURL: user.photoURL || null,
			role,
			parentType: role === "parent" ? parentType || "mother" : null,
			status: "active",
			joinedAt: Date.now(),
		});
		await updateDoc(doc(db, "users", user.uid), {
			currentFamilyId: pendingFamilyId,
			accountType: role === "parent" ? "parent" : "caregiver",
			parentType: role === "parent" ? parentType || "mother" : null,
		});
		setUser((prev) => ({
			...prev,
			currentFamilyId: pendingFamilyId,
			accountType: role === "parent" ? "parent" : "caregiver",
			parentType: role === "parent" ? parentType || "mother" : null,
		}));
		setPendingFamilyId(null);
	};

	const cancelRoleSelection = () => setPendingFamilyId(null);

	const removeMember = async (memberDocId, memberUserId) => {
		await deleteDoc(doc(db, "family_members", memberDocId));
		await updateDoc(doc(db, "users", memberUserId), { currentFamilyId: null });
		if (memberUserId === user.uid) {
			setUser((prev) => ({ ...prev, currentFamilyId: null }));
			setFamily(null);
			setBabies([]);
			setLogs([]);
		}
	};

	const updateUserProfilePhoto = async (photoURL) => {
		if (!user?.uid) {
			throw new Error("You need to sign in before updating your profile.");
		}

		await updateDoc(doc(db, "users", user.uid), {
			photoURL,
			updatedAt: Date.now(),
		});

		if (user.currentFamilyId) {
			await updateDoc(doc(db, "family_members", `${user.currentFamilyId}_${user.uid}`), {
				photoURL,
				updatedAt: Date.now(),
			});
		}

		setUser((prev) => (prev ? { ...prev, photoURL } : prev));
	};

	const addBaby = async (babyData) => {
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}

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
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}
		await updateDoc(doc(db, "babies", babyId), babyData);
	};

	const deleteBaby = async (babyId) => {
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}
		await updateDoc(doc(db, "babies", babyId), {
			archived: true,
			archivedAt: Date.now(),
			archivedBy: user.uid,
		});
		const nextBabies = babies.filter((baby) => baby.id !== babyId);
		setBabies(nextBabies);
		if (activeBaby?.id === babyId) {
			setActiveBaby(nextBabies[0] || null);
			setLogs([]);
			setGrowthLogs([]);
		}
	};

	const switchBaby = (babyId) => {
		const b = babies.find((x) => x.id === babyId);
		if (b) setActiveBaby(b);
	};

	const addLog = async (logData) => {
		if (!user?.currentFamilyId || !activeBaby?.id) {
			throw new Error("Select a child before adding activity.");
		}

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
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}

		const logTimestamp = updatedData.timestamp || Date.now();
		const dataToSave = { ...updatedData };
		delete dataToSave.timestamp;
		await updateDoc(doc(db, "logs", logId), {
			...dataToSave,
			timestamp: logTimestamp,
		});
	};

	const deleteLog = async (logId) => {
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}
		await deleteDoc(doc(db, "logs", logId));
	};

	const addGrowthLog = async (data) => {
		if (!user?.currentFamilyId || !activeBaby?.id) {
			throw new Error("Select a child before adding growth data.");
		}

		await addDoc(collection(db, "growth"), {
			...data,
			familyId: user.currentFamilyId,
			babyId: activeBaby.id,
			userId: user.uid,
			timestamp: data.timestamp || Date.now(),
			createdAt: Date.now(),
			lastAction: "created",
			updatedAt: Date.now(),
		});
	};

	const updateGrowthLog = async (growthId, data) => {
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}

		const dataToSave = { ...data };
		delete dataToSave.id;
		await updateDoc(doc(db, "growth", growthId), {
			...dataToSave,
			lastAction: "updated",
			updatedAt: Date.now(),
			updatedBy: user.uid,
		});
	};

	const deleteGrowthLog = async (growthId) => {
		if (!user?.currentFamilyId) {
			throw new Error("You need to join or create a family first.");
		}

		await deleteDoc(doc(db, "growth", growthId));
	};

	return (
		<AppContext.Provider
			value={{
				user,
				userRole,
				userParentType,
				isSuperAdmin,
				displayRole,
				family,
				familyMembers,
				babies,
				activeBaby,
				logs,
				growthLogs,
				loading,
				familyDataLoading,
				pendingFamilyId,
				encouragement,
				login,
				logout,
				createFamily,
				createInviteCode,
				joinFamily,
				confirmRole,
				cancelRoleSelection,
				removeMember,
				updateUserProfilePhoto,
				addBaby,
				updateBaby,
				deleteBaby,
				switchBaby,
				addLog,
				updateLog,
				deleteLog,
				addGrowthLog,
				updateGrowthLog,
				deleteGrowthLog,
				modal,
				openModal,
				closeModal,
				showEncouragement,
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => useContext(AppContext);
