import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { useApp } from "./contexts/AppContext";
import { db } from "./services/firebase";

export default function App() {
	const {
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
		removeMember,
		addBaby,
		addLog,
		switchBaby,
	} = useApp();

	const [activeTab, setActiveTab] = useState("dashboard");
	const [modal, setModal] = useState({ isOpen: false, type: null });
	const [formState, setFormState] = useState({
		amount: 120,
		unit: "ml",
		feedType: "direct",
		duration: 15,
		breastSide: "both",
		diaperType: "wet",
		name: "",
		note: "",
	});

	const [familyMode, setFamilyMode] = useState("join");
	const [familyName, setFamilyName] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [joinError, setJoinError] = useState("");
	const [joining, setJoining] = useState(false);

	const [babyName, setBabyName] = useState("");
	const [babyDob, setBabyDob] = useState("");
	const [editBabyName, setEditBabyName] = useState("");
	const [editBabyDob, setEditBabyDob] = useState("");
	const [isEditingBaby, setIsEditingBaby] = useState(false);

	// Determine role for Quick Actions
	const myRole =
		familyMembers.find((m) => m.userId === user?.uid)?.role || "parent";

	// ─── Loading & Auth Guards ────────────────────────────────────────────────
	if (loading) {
		return (
			<div
				className="app"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
				}}
			>
				<div
					style={{ color: "var(--rose-dark)", fontWeight: 800, fontSize: 18 }}
				>
					Loading...
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div
				className="app"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "100vh",
					padding: "24px",
				}}
			>
				<div className="logo" style={{ fontSize: 44, marginBottom: 32 }}>
					alai<span>ya</span> 🌸
				</div>
				<p
					style={{
						color: "var(--text2)",
						fontWeight: 600,
						marginBottom: 24,
						textAlign: "center",
					}}
				>
					Track feeding, sleep & diapers — beautifully, together.
				</p>
				<button
					onClick={login}
					className="submit-btn"
					style={{
						background: "var(--white)",
						color: "var(--text)",
						border: "1px solid var(--border)",
						boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
					}}
				>
					<i className="ti ti-brand-google"></i> Sign in with Google
				</button>
			</div>
		);
	}

	// ─── Family & Role Screens (Truncated for brevity, perfectly identical to your setup) ───
	if (pendingFamilyId) {
		return (
			<div className="app" style={{ minHeight: "100vh", padding: "24px" }}>
				<div
					style={{
						background: "var(--white)",
						padding: "24px",
						borderRadius: "var(--r)",
						border: "1px solid var(--border)",
						marginTop: "40px",
					}}
				>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 800,
							marginBottom: 8,
							textAlign: "center",
						}}
					>
						Choose your role
					</h2>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							marginTop: 24,
						}}
					>
						<button
							onClick={() => confirmRole("parent")}
							className="submit-btn"
						>
							👪 Parent
						</button>
						<button
							onClick={() => confirmRole("caregiver")}
							className="submit-btn"
							style={{ background: "var(--cream2)", color: "var(--text)" }}
						>
							🍼 Caregiver
						</button>
						<button onClick={cancelRoleSelection} className="cancel-btn">
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!family) {
		return (
			<div className="app" style={{ minHeight: "100vh", padding: "24px" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 32,
					}}
				>
					<div className="logo" style={{ fontSize: 30 }}>
						alai<span>ya</span> 🌸
					</div>
					<button
						onClick={logout}
						className="cancel-btn"
						style={{ width: "auto", padding: "6px 16px" }}
					>
						Sign Out
					</button>
				</div>
				<div
					style={{
						display: "flex",
						background: "var(--cream2)",
						borderRadius: "var(--r)",
						padding: 4,
						marginBottom: 20,
					}}
				>
					{["join", "create"].map((mode) => (
						<button
							key={mode}
							onClick={() => {
								setFamilyMode(mode);
								setJoinError("");
							}}
							style={{
								flex: 1,
								padding: "10px",
								border: "none",
								borderRadius: "var(--r2)",
								fontFamily: "inherit",
								fontSize: 14,
								fontWeight: 800,
								cursor: "pointer",
								transition: "all 0.15s",
								background:
									familyMode === mode ? "var(--white)" : "transparent",
								color:
									familyMode === mode ? "var(--rose-dark)" : "var(--text3)",
								boxShadow:
									familyMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
							}}
						>
							{mode === "join" ? "Join Family" : "Create New"}
						</button>
					))}
				</div>
				<div
					style={{
						background: "var(--white)",
						padding: "24px",
						borderRadius: "var(--r)",
					}}
				>
					{familyMode === "join" ? (
						<>
							<input
								type="text"
								placeholder="8-Digit Code"
								value={joinCode}
								onChange={(e) => {
									setJoinCode(e.target.value);
									setJoinError("");
								}}
								className="form-input"
								style={{
									marginBottom: 16,
									textTransform: "uppercase",
									textAlign: "center",
									letterSpacing: 2,
								}}
								maxLength={8}
							/>
							{joinError && (
								<p
									style={{
										color: "var(--rose-dark)",
										fontSize: 13,
										fontWeight: 700,
										marginBottom: 12,
										textAlign: "center",
									}}
								>
									{joinError}
								</p>
							)}
							<button
								onClick={async () => {
									setJoining(true);
									const err = await joinFamily(joinCode);
									if (err) setJoinError(err);
									setJoining(false);
								}}
								className="submit-btn"
								disabled={joining || joinCode.length < 8}
								style={{ opacity: joinCode.length < 8 ? 0.5 : 1 }}
							>
								{joining ? "Joining..." : "Continue"}
							</button>
						</>
					) : (
						<>
							<input
								type="text"
								placeholder="Family Name"
								value={familyName}
								onChange={(e) => setFamilyName(e.target.value)}
								className="form-input"
								style={{ marginBottom: 16 }}
							/>
							<button
								onClick={() => createFamily(familyName)}
								className="submit-btn"
								disabled={!familyName.trim()}
								style={{ opacity: !familyName.trim() ? 0.5 : 1 }}
							>
								Create Family
							</button>
						</>
					)}
				</div>
			</div>
		);
	}

	if (babies.length === 0) {
		return (
			<div
				className="app"
				style={{
					minHeight: "100vh",
					padding: "24px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<div
					style={{
						background: "var(--white)",
						padding: "24px",
						borderRadius: "var(--r)",
					}}
				>
					<div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>
						🍼
					</div>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 800,
							marginBottom: 16,
							textAlign: "center",
						}}
					>
						Add Your Baby
					</h2>
					<div className="form-group">
						<label className="form-label">Name</label>
						<input
							type="text"
							value={babyName}
							onChange={(e) => setBabyName(e.target.value)}
							className="form-input"
						/>
					</div>
					<div className="form-group">
						<label className="form-label">Date of Birth</label>
						<input
							type="date"
							value={babyDob}
							onChange={(e) => setBabyDob(e.target.value)}
							className="form-input"
						/>
					</div>
					<button
						onClick={() => addBaby({ name: babyName, dob: babyDob })}
						className="submit-btn"
					>
						Save Profile
					</button>
				</div>
			</div>
		);
	}

	// ─── Helpers ───
	const getLogTime = (l) => l.timestamp || l.time || Date.now();
	const formatTime = (ts) =>
		new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	const timeSince = (ts) => {
		const mins = Math.floor((Date.now() - ts) / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const h = Math.floor(mins / 60);
		return `${h}h ${mins % 60}m ago`;
	};

	const getAgeString = (dobString) => {
		if (!dobString) return "";
		const dob = new Date(dobString);
		const today = new Date();
		let months =
			(today.getFullYear() - dob.getFullYear()) * 12 +
			(today.getMonth() - dob.getMonth());
		let days = today.getDate() - dob.getDate();
		if (days < 0) {
			months--;
			days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
		}
		if (months < 0) return "Not born yet";
		if (months === 0 && days === 0) return "Born today";
		let str = [];
		if (months > 0) str.push(`${months} month${months !== 1 ? "s" : ""}`);
		if (days > 0) str.push(`${days} day${days !== 1 ? "s" : ""}`);
		return str.join(", ") + " old";
	};

	const isToday = (ts) =>
		new Date(ts).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
	const bottleLogsToday = logs.filter(
		(l) =>
			l.type === "milk" && l.feedType === "bottle" && isToday(getLogTime(l)),
	);
	const totalMilkToday = bottleLogsToday.reduce(
		(acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount),
		0,
	);
	const feedsToday = logs.filter(
		(l) => l.type === "milk" && isToday(getLogTime(l)),
	).length;
	const diapersToday = logs.filter(
		(l) => l.type === "diaper" && isToday(getLogTime(l)),
	).length;
	const lastMilk = logs.filter((l) => l.type === "milk")[0];

	// ─── UI Mappings ───
	const activityConfig = {
		milk: { emoji: "🍼", title: "Feeding", color: "bg-milk" },
		pump: { emoji: "💧", title: "Breast Pump", color: "bg-pump" },
		diaper: { emoji: "🧷", title: "Diaper", color: "bg-diaper" },
		sleep: { emoji: "😴", title: "Sleep", color: "bg-sleep" },
		bath: { emoji: "🛁", title: "Bath Time", color: "bg-bath" },
		meds: { emoji: "💊", title: "Medication", color: "bg-meds" },
		note: { emoji: "📝", title: "Note", color: "bg-note" },
	};

	// ─── Modal Actions ───
	const handleModalSubmit = () => {
		const logData = { type: modal.type, text: formState.note };
		if (modal.type === "milk") {
			logData.feedType = formState.feedType;
			if (formState.feedType === "bottle") {
				logData.amount = formState.amount;
				logData.unit = formState.unit;
			} else {
				logData.duration = formState.duration;
				logData.breastSide = formState.breastSide;
			}
		}
		if (modal.type === "pump") {
			logData.amount = formState.amount;
			logData.unit = formState.unit;
			logData.breastSide = formState.breastSide;
		}
		if (modal.type === "diaper") logData.diaperType = formState.diaperType;
		if (modal.type === "meds") logData.name = formState.name || "Medication";
		if (modal.type === "sleep") logData.isSleeping = true;

		addLog(logData);
		setModal({ isOpen: false, type: null });
		setFormState((prev) => ({ ...prev, name: "", note: "" }));
	};

	const closeModal = () => setModal({ isOpen: false, type: null });
	const openMenu = () => setModal({ isOpen: true, type: "menu" });

	const adjAmount = (delta) => {
		const step = formState.unit === "oz" ? 0.5 : 10;
		const min = formState.unit === "oz" ? 0.5 : 10;
		setFormState((prev) => ({
			...prev,
			amount: Math.max(min, prev.amount + delta * step),
		}));
	};
	const adjDuration = (delta) =>
		setFormState((prev) => ({
			...prev,
			duration: Math.max(1, prev.duration + delta * 5),
		}));
	const setUnit = (unit) => {
		setFormState((prev) => {
			let newAmt = prev.amount;
			if (unit === "oz" && prev.amount >= 10)
				newAmt = Math.round((prev.amount / 30) * 2) / 2;
			if (unit === "ml" && prev.amount <= 15)
				newAmt = Math.round(prev.amount * 30);
			return { ...prev, unit, amount: newAmt };
		});
	};

	// ─── Timeline Card Component ───
	const TimelineCard = ({ log }) => {
		const config = activityConfig[log.type] || activityConfig.note;
		return (
			<div className="timeline-card fade-in">
				<div className={`activity-avatar ${config.color}`}>{config.emoji}</div>
				<div className="timeline-card-content">
					<div className="timeline-header">
						<span className="timeline-title">
							{config.title}{" "}
							{log.type === "milk" &&
								(log.feedType === "direct" ? "(Direct)" : "(Bottle)")}
						</span>
						<span className="timeline-time">{formatTime(getLogTime(log))}</span>
					</div>
					<div className="timeline-details">
						{log.type === "milk" &&
							log.feedType === "bottle" &&
							`${log.amount}${log.unit} Breast Milk`}
						{log.type === "milk" &&
							log.feedType === "direct" &&
							`${log.duration} mins • ${log.breastSide} side`}
						{log.type === "pump" &&
							`${log.amount}${log.unit} • ${log.breastSide} side`}
						{log.type === "diaper" && (
							<span style={{ textTransform: "capitalize" }}>
								{log.diaperType} Diaper
							</span>
						)}
						{log.type === "meds" && log.name}
						{log.type === "sleep" && "Fell asleep"}
						{log.type === "bath" && "Splish splash"}
					</div>
					{log.text && <div className="timeline-notes">"{log.text}"</div>}
				</div>
			</div>
		);
	};

	// Quick Action Buttons based on Role
	const parentActions = [
		{ type: "pump", icon: "💧", label: "Pump", color: "bg-pump" },
		{ type: "milk", icon: "🍼", label: "Feed", color: "bg-milk" },
		{ type: "diaper", icon: "🧷", label: "Diaper", color: "bg-diaper" },
	];
	const caregiverActions = [
		{ type: "bath", icon: "🛁", label: "Bath", color: "bg-bath" },
		{ type: "sleep", icon: "😴", label: "Sleep", color: "bg-sleep" },
		{ type: "milk", icon: "🍼", label: "Feed", color: "bg-milk" },
		{ type: "diaper", icon: "🧷", label: "Diaper", color: "bg-diaper" },
	];
	const quickActions = myRole === "parent" ? parentActions : caregiverActions;

	return (
		<div className="app">
			{/* Header */}
			<div className="header">
				<div className="header-top">
					<div>
						<div className="logo">
							alai<span>ya</span>
						</div>
						<div className="baby-name">
							{activeBaby.name} • {getAgeString(activeBaby.dob)}
						</div>
					</div>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: "50%",
							background: "var(--cream2)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontWeight: 800,
						}}
					>
						{user.displayName?.charAt(0)}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="content">
				{activeTab === "dashboard" && (
					<div className="fade-in">
						<div className="hero-card">
							<div className="hero-greeting">
								Hi {user.displayName?.split(" ")[0]} 👋
							</div>
							<div className="hero-status">How is {activeBaby.name} doing?</div>
							<div className="hero-stats">
								<div className="hero-stat">
									<span className="hero-stat-val">
										{lastMilk ? timeSince(getLogTime(lastMilk)) : "—"}
									</span>
									<span className="hero-stat-lbl">Last Fed</span>
								</div>
								<div className="hero-stat">
									<span className="hero-stat-val">{feedsToday}</span>
									<span className="hero-stat-lbl">Feeds Today</span>
								</div>
								<div className="hero-stat">
									<span className="hero-stat-val">{diapersToday}</span>
									<span className="hero-stat-lbl">Diapers</span>
								</div>
							</div>
						</div>

						<div className="section-title">Recent Activity</div>
						<div className="timeline-cards">
							{logs.slice(0, 4).map((log) => (
								<TimelineCard key={log.id} log={log} />
							))}
							{logs.length === 0 && (
								<div
									style={{
										textAlign: "center",
										padding: "40px",
										color: "var(--text3)",
										fontWeight: 700,
									}}
								>
									No activities yet. Tap below to log!
								</div>
							)}
						</div>
					</div>
				)}

				{activeTab === "timeline" && (
					<div className="fade-in">
						<div className="section-title">Full History</div>
						<div className="timeline-cards">
							{logs.map((log) => (
								<TimelineCard key={log.id} log={log} />
							))}
						</div>
					</div>
				)}

				{activeTab === "settings" && (
					<div className="fade-in">
						{/* 1. Family Details */}
						<div className="section-title">Family Details</div>
						<div
							style={{
								background: "var(--white)",
								borderRadius: "var(--r)",
								padding: 20,
								marginBottom: 24,
								textAlign: "center",
								boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
							}}
						>
							<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>
								{family.name}
							</h3>
							<p
								style={{
									fontSize: 13,
									color: "var(--text2)",
									marginBottom: 16,
									fontWeight: 600,
								}}
							>
								Share this code to invite members:
							</p>
							<div
								style={{
									fontSize: 24,
									letterSpacing: 4,
									fontWeight: 900,
									color: "var(--rose-dark)",
									background: "var(--peach)",
									padding: "12px",
									borderRadius: "12px",
								}}
							>
								{family.joinCode}
							</div>
						</div>

						{/* 2. Baby Profile */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 12,
							}}
						>
							<div className="section-title" style={{ marginBottom: 0 }}>
								Baby Profile
							</div>
							{!isEditingBaby ? (
								<button
									onClick={() => {
										setEditBabyName(activeBaby.name);
										setEditBabyDob(activeBaby.dob);
										setIsEditingBaby(true);
									}}
									style={{
										background: "none",
										border: "none",
										color: "var(--rose-dark)",
										fontSize: 13,
										fontWeight: 800,
										cursor: "pointer",
										padding: "4px 8px",
									}}
								>
									Edit
								</button>
							) : (
								<button
									onClick={() => setIsEditingBaby(false)}
									style={{
										background: "none",
										border: "none",
										color: "var(--text3)",
										fontSize: 13,
										fontWeight: 800,
										cursor: "pointer",
										padding: "4px 8px",
									}}
								>
									Cancel
								</button>
							)}
						</div>

						<div
							style={{
								background: "var(--white)",
								borderRadius: "var(--r)",
								padding: "16px",
								marginBottom: 24,
								boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
							}}
						>
							{!isEditingBaby ? (
								<div
									style={{ display: "flex", flexDirection: "column", gap: 12 }}
								>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<span style={{ fontWeight: 700, color: "var(--text2)" }}>
											Name
										</span>
										<span style={{ fontWeight: 800 }}>{activeBaby.name}</span>
									</div>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<span style={{ fontWeight: 700, color: "var(--text2)" }}>
											Birthday
										</span>
										<span style={{ fontWeight: 800 }}>{activeBaby.dob}</span>
									</div>
									<div
										style={{ display: "flex", justifyContent: "space-between" }}
									>
										<span style={{ fontWeight: 700, color: "var(--text2)" }}>
											Age
										</span>
										<span style={{ fontWeight: 800 }}>
											{getAgeString(activeBaby.dob)}
										</span>
									</div>
								</div>
							) : (
								<div
									style={{ display: "flex", flexDirection: "column", gap: 12 }}
								>
									<div className="form-group" style={{ marginBottom: 0 }}>
										<label className="form-label">Name</label>
										<input
											type="text"
											value={editBabyName}
											onChange={(e) => setEditBabyName(e.target.value)}
											className="form-input"
										/>
									</div>
									<div className="form-group" style={{ marginBottom: 0 }}>
										<label className="form-label">Date of Birth</label>
										<input
											type="date"
											value={editBabyDob}
											onChange={(e) => setEditBabyDob(e.target.value)}
											className="form-input"
										/>
									</div>
									<button
										onClick={async () => {
											await updateDoc(doc(db, "babies", activeBaby.id), {
												name: editBabyName,
												dob: editBabyDob,
											});
											setIsEditingBaby(false);
										}}
										className="submit-btn"
										style={{ marginTop: 8 }}
									>
										Save Changes
									</button>
								</div>
							)}
						</div>

						{/* 3. Family Members */}
						<div className="section-title">Family Members</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 12,
								marginBottom: 32,
							}}
						>
							{familyMembers.map((member) => {
								const isMe = member.userId === user.uid;
								return (
									<div
										key={member.id}
										style={{
											background: "var(--white)",
											padding: "16px",
											borderRadius: "var(--r)",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "12px",
											}}
										>
											{member.photoURL ? (
												<img
													src={member.photoURL}
													alt={member.displayName}
													style={{
														width: 44,
														height: 44,
														borderRadius: "14px",
														objectFit: "cover",
													}}
												/>
											) : (
												<div
													style={{
														width: 44,
														height: 44,
														borderRadius: "14px",
														background: "var(--rose-light)",
														color: "var(--rose-dark)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontWeight: 800,
														fontSize: 18,
													}}
												>
													{member.displayName?.charAt(0)?.toUpperCase() || "?"}
												</div>
											)}
											<div style={{ display: "flex", flexDirection: "column" }}>
												<span
													style={{
														fontWeight: 800,
														fontSize: 15,
														color: "var(--text)",
													}}
												>
													{member.displayName}{" "}
													{isMe && (
														<span style={{ color: "var(--rose-dark)" }}>
															(You)
														</span>
													)}
												</span>
												<span
													style={{
														fontSize: 12,
														color: "var(--text3)",
														fontWeight: 700,
														textTransform: "capitalize",
													}}
												>
													{member.role}
												</span>
											</div>
										</div>

										<button
											onClick={() => {
												const action = isMe
													? "leave the family"
													: "remove this member";
												if (
													window.confirm(`Are you sure you want to ${action}?`)
												) {
													removeMember(member.id, member.userId);
												}
											}}
											style={{
												background: isMe ? "var(--peach)" : "var(--cream2)",
												border: "none",
												color: isMe ? "var(--rose-dark)" : "var(--text2)",
												fontSize: 13,
												fontWeight: 800,
												cursor: "pointer",
												padding: "8px 14px",
												borderRadius: "var(--r2)",
												transition: "all 0.2s",
											}}
										>
											{isMe ? "Leave" : "Remove"}
										</button>
									</div>
								);
							})}
						</div>

						{/* Sign out */}
						<button
							onClick={logout}
							className="cancel-btn"
							style={{
								background: "var(--white)",
								border: "2px solid var(--cream2)",
								color: "var(--text2)",
								borderRadius: "var(--r)",
							}}
						>
							Sign Out
						</button>
					</div>
				)}
			</div>

			{/* ── Floating Quick Action Dock ── */}
			<div className="floating-dock">
				{quickActions.map((action) => (
					<button
						key={action.type}
						className="dock-btn"
						onClick={() => setModal({ isOpen: true, type: action.type })}
					>
						<div className={`dock-icon ${action.color}`}>{action.icon}</div>
						<span className="dock-label">{action.label}</span>
					</button>
				))}
				<button className="dock-btn" onClick={openMenu}>
					<div
						className="dock-icon bg-note"
						style={{ background: "var(--cream2)" }}
					>
						➕
					</div>
					<span className="dock-label">More</span>
				</button>
			</div>

			{/* ── Standard Bottom Navigation ── */}
			<div className="bottom-nav">
				{[
					{ id: "dashboard", icon: "🏠", label: "Home" },
					{ id: "timeline", icon: "📋", label: "Timeline" },
					{ id: "settings", icon: "⚙️", label: "Settings" },
				].map((tab) => (
					<button
						key={tab.id}
						className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
						onClick={() => setActiveTab(tab.id)}
					>
						<i style={{ fontStyle: "normal" }}>{tab.icon}</i>
						<span>{tab.label}</span>
					</button>
				))}
			</div>

			{/* ── Unified Modal ── */}
			{modal.isOpen && (
				<div
					className="modal-overlay"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) closeModal();
					}}
				>
					<div className="modal">
						<div className="modal-handle"></div>

						{/* FULL MENU (More Button) */}
						{modal.type === "menu" && (
							<>
								<div className="modal-title">Log Activity</div>
								<div className="quick-btns-grid">
									{Object.entries(activityConfig).map(([type, config]) => (
										<button
											key={type}
											className="grid-btn"
											onClick={() => setModal({ isOpen: true, type })}
										>
											<div className={`grid-icon ${config.color}`}>
												{config.emoji}
											</div>
											<div className="grid-label">{config.title}</div>
										</button>
									))}
								</div>
							</>
						)}

						{/* PUMP */}
						{modal.type === "pump" && (
							<>
								<div className="modal-title">💧 Breast Pump</div>
								<div className="form-group">
									<label className="form-label">Side</label>
									<div className="type-btns">
										{["left", "both", "right"].map((side) => (
											<button
												key={side}
												onClick={() =>
													setFormState({ ...formState, breastSide: side })
												}
												className={`type-btn ${formState.breastSide === side ? "selected" : ""}`}
												style={{ textTransform: "capitalize" }}
											>
												{side}
											</button>
										))}
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Unit</label>
									<div className="type-btns">
										<button
											className={`type-btn ${formState.unit === "ml" ? "selected" : ""}`}
											onClick={() => setUnit("ml")}
										>
											ml
										</button>
										<button
											className={`type-btn ${formState.unit === "oz" ? "selected" : ""}`}
											onClick={() => setUnit("oz")}
										>
											oz
										</button>
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Total Amount</label>
									<div className="amount-row">
										<button
											className="amount-btn"
											onClick={() => adjAmount(-1)}
										>
											−
										</button>
										<span className="amount-val">{formState.amount}</span>
										<span className="amount-unit">{formState.unit}</span>
										<button className="amount-btn" onClick={() => adjAmount(1)}>
											+
										</button>
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Notes (Optional)</label>
									<input
										className="form-input"
										placeholder="e.g. Morning pump"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
									/>
								</div>
							</>
						)}

						{/* MILK (Direct/Bottle) */}
						{modal.type === "milk" && (
							<>
								<div className="modal-title">🍼 Feed Baby</div>
								<div className="form-group">
									<label className="form-label">Method</label>
									<div className="type-btns">
										<button
											className={`type-btn ${formState.feedType === "direct" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, feedType: "direct" })
											}
										>
											🤱 Direct
										</button>
										<button
											className={`type-btn ${formState.feedType === "bottle" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, feedType: "bottle" })
											}
										>
											🍼 Bottle
										</button>
									</div>
								</div>
								{formState.feedType === "direct" ? (
									<>
										<div className="form-group">
											<label className="form-label">Side</label>
											<div className="type-btns">
												{["left", "both", "right"].map((side) => (
													<button
														key={side}
														onClick={() =>
															setFormState({ ...formState, breastSide: side })
														}
														className={`type-btn ${formState.breastSide === side ? "selected" : ""}`}
														style={{ textTransform: "capitalize" }}
													>
														{side}
													</button>
												))}
											</div>
										</div>
										<div className="form-group">
											<label className="form-label">Duration</label>
											<div className="amount-row">
												<button
													className="amount-btn"
													onClick={() => adjDuration(-1)}
												>
													−
												</button>
												<span className="amount-val">{formState.duration}</span>
												<span className="amount-unit">mins</span>
												<button
													className="amount-btn"
													onClick={() => adjDuration(1)}
												>
													+
												</button>
											</div>
										</div>
									</>
								) : (
									<>
										<div className="form-group">
											<label className="form-label">Unit</label>
											<div className="type-btns">
												<button
													className={`type-btn ${formState.unit === "ml" ? "selected" : ""}`}
													onClick={() => setUnit("ml")}
												>
													ml
												</button>
												<button
													className={`type-btn ${formState.unit === "oz" ? "selected" : ""}`}
													onClick={() => setUnit("oz")}
												>
													oz
												</button>
											</div>
										</div>
										<div className="form-group">
											<label className="form-label">Amount</label>
											<div className="amount-row">
												<button
													className="amount-btn"
													onClick={() => adjAmount(-1)}
												>
													−
												</button>
												<span className="amount-val">{formState.amount}</span>
												<span className="amount-unit">{formState.unit}</span>
												<button
													className="amount-btn"
													onClick={() => adjAmount(1)}
												>
													+
												</button>
											</div>
										</div>
									</>
								)}
								<div className="form-group">
									<label className="form-label">Notes (Optional)</label>
									<input
										className="form-input"
										placeholder="e.g. Spat up a little"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
									/>
								</div>
							</>
						)}

						{/* DIAPER */}
						{modal.type === "diaper" && (
							<>
								<div className="modal-title">🧷 Diaper Change</div>
								<div className="form-group">
									<label className="form-label">Type</label>
									<div className="type-btns">
										{[
											{ val: "wet", label: "💧 Wet" },
											{ val: "dirty", label: "💩 Dirty" },
											{ val: "both", label: "Both" },
										].map(({ val, label }) => (
											<button
												key={val}
												className={`type-btn ${formState.diaperType === val ? "selected" : ""}`}
												onClick={() =>
													setFormState({ ...formState, diaperType: val })
												}
											>
												{label}
											</button>
										))}
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Notes (Optional)</label>
									<input
										className="form-input"
										placeholder="e.g. Rash looks better"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
									/>
								</div>
							</>
						)}

						{/* SLEEP / BATH (Quick Loggers) */}
						{(modal.type === "sleep" || modal.type === "bath") && (
							<>
								<div className="modal-title">
									{modal.type === "sleep" ? "😴 Log Sleep" : "🛁 Log Bath"}
								</div>
								<div
									style={{
										background: "var(--cream2)",
										padding: 20,
										borderRadius: "var(--r2)",
										textAlign: "center",
										marginBottom: 20,
										fontWeight: 700,
										color: "var(--text2)",
									}}
								>
									Will be logged at{" "}
									{new Date().toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
								<div className="form-group">
									<label className="form-label">Notes (Optional)</label>
									<input
										className="form-input"
										placeholder="e.g. Very fussy"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
									/>
								</div>
							</>
						)}

						{/* MEDS */}
						{modal.type === "meds" && (
							<>
								<div className="modal-title">💊 Medication</div>
								<div className="form-group">
									<label className="form-label">Medication Name</label>
									<input
										className="form-input"
										placeholder="e.g. Vitamin D drops"
										value={formState.name}
										onChange={(e) =>
											setFormState({ ...formState, name: e.target.value })
										}
									/>
								</div>
							</>
						)}

						{/* NOTE */}
						{modal.type === "note" && (
							<>
								<div className="modal-title">📝 Add Note</div>
								<div className="form-group">
									<label className="form-label">Observation</label>
									<textarea
										className="form-input"
										rows="4"
										placeholder="e.g. First smile today!"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
										style={{ resize: "none" }}
									></textarea>
								</div>
							</>
						)}

						{modal.type !== "menu" && (
							<>
								<button className="submit-btn" onClick={handleModalSubmit}>
									Save Activity
								</button>
								<button className="cancel-btn" onClick={closeModal}>
									Cancel
								</button>
							</>
						)}
						{modal.type === "menu" && (
							<button
								className="cancel-btn"
								onClick={closeModal}
								style={{ marginTop: 12 }}
							>
								Close
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
