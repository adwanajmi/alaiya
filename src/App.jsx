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

	// ─── Loading ─────────────────────────────────────────────────────────────
	if (loading)
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

	// ─── Not signed in ────────────────────────────────────────────────────────
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
				<div className="logo" style={{ fontSize: 40, marginBottom: 32 }}>
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
					Track feeding, sleep & diapers together as a family.
				</p>
				<button onClick={login} className="submit-btn">
					<i className="ti ti-brand-google"></i> Sign in with Google
				</button>
			</div>
		);
	}

	// ─── Role selection screen (after joining via code) ───────────────────────
	if (pendingFamilyId) {
		return (
			<div
				className="app"
				style={{
					minHeight: "100vh",
					padding: "32px 24px",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
				}}
			>
				<div className="logo" style={{ fontSize: 28, marginBottom: 8 }}>
					alai<span>ya</span> 🌸
				</div>
				<p
					style={{
						color: "var(--text2)",
						fontWeight: 600,
						marginBottom: 32,
						fontSize: 14,
					}}
				>
					Almost there! What's your role in this family?
				</p>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 12,
						marginBottom: 24,
					}}
				>
					{[
						{
							role: "parent",
							emoji: "👨‍👩‍👧",
							title: "Parent",
							desc: "Full access — log activities, manage baby profiles and settings.",
						},
						{
							role: "caregiver",
							emoji: "🤝",
							title: "Caregiver",
							desc: "Log feeding, sleep and diaper activities for the baby.",
						},
					].map(({ role, emoji, title, desc }) => (
						<button
							key={role}
							onClick={() => confirmRole(role)}
							style={{
								background: "var(--white)",
								border: "1.5px solid var(--border)",
								borderRadius: "var(--r)",
								padding: "20px 18px",
								cursor: "pointer",
								textAlign: "left",
								fontFamily: "Nunito, sans-serif",
								transition: "all 0.15s",
								display: "flex",
								alignItems: "flex-start",
								gap: 14,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = "var(--rose)";
								e.currentTarget.style.background = "var(--peach)";
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = "var(--border)";
								e.currentTarget.style.background = "var(--white)";
							}}
						>
							<span style={{ fontSize: 28 }}>{emoji}</span>
							<div>
								<div
									style={{
										fontSize: 16,
										fontWeight: 800,
										color: "var(--text)",
										marginBottom: 4,
									}}
								>
									{title}
								</div>
								<div
									style={{
										fontSize: 13,
										color: "var(--text2)",
										fontWeight: 600,
										lineHeight: 1.4,
									}}
								>
									{desc}
								</div>
							</div>
						</button>
					))}
				</div>

				<button onClick={cancelRoleSelection} className="cancel-btn">
					← Go back
				</button>
			</div>
		);
	}

	// ─── No family yet ────────────────────────────────────────────────────────
	const handleJoin = async () => {
		setJoinError("");
		setJoining(true);
		const error = await joinFamily(joinCode);
		if (error) setJoinError(error);
		setJoining(false);
	};

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
								fontFamily: "Nunito, sans-serif",
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
							{mode === "join" ? "Join a Family" : "Create New"}
						</button>
					))}
				</div>

				<div
					style={{
						background: "var(--white)",
						padding: "24px",
						borderRadius: "var(--r)",
						border: "1px solid var(--border)",
					}}
				>
					{familyMode === "join" ? (
						<>
							<p
								style={{
									fontSize: 13,
									color: "var(--text2)",
									fontWeight: 600,
									marginBottom: 16,
								}}
							>
								Ask your family admin for the 8-character code.
							</p>
							<input
								type="text"
								placeholder="e.g. ABC12345"
								value={joinCode}
								onChange={(e) => {
									setJoinCode(e.target.value);
									setJoinError("");
								}}
								className="form-input"
								style={{
									marginBottom: 8,
									textTransform: "uppercase",
									letterSpacing: 2,
									fontSize: 20,
									textAlign: "center",
								}}
								maxLength={8}
							/>
							{joinError && (
								<p
									style={{
										color: "var(--rose-dark)",
										fontSize: 13,
										fontWeight: 700,
										marginBottom: 8,
										textAlign: "center",
									}}
								>
									⚠️ {joinError}
								</p>
							)}
							<button
								onClick={handleJoin}
								className="submit-btn"
								disabled={joining || joinCode.length < 8}
								style={{ opacity: joinCode.length < 8 ? 0.5 : 1 }}
							>
								{joining ? "Looking up..." : "Join Family"}
							</button>
						</>
					) : (
						<>
							<p
								style={{
									fontSize: 13,
									color: "var(--text2)",
									fontWeight: 600,
									marginBottom: 16,
								}}
							>
								Start tracking for your family and share the code with
								caregivers.
							</p>
							<input
								type="text"
								placeholder="e.g. The Johnsons"
								value={familyName}
								onChange={(e) => setFamilyName(e.target.value)}
								className="form-input"
								style={{ marginBottom: 8 }}
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

	// ─── No baby yet ──────────────────────────────────────────────────────────
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
						border: "1px solid var(--border)",
						boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
					}}
				>
					<div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>
						🍼
					</div>
					<h2
						style={{
							fontSize: 17,
							fontWeight: 800,
							marginBottom: 16,
							color: "var(--text)",
							textAlign: "center",
						}}
					>
						Add Your Baby
					</h2>
					<div className="form-group">
						<label className="form-label">Baby's Name</label>
						<input
							type="text"
							placeholder="e.g. Amara"
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
						<i className="ti ti-check"></i> Save Baby Profile
					</button>
				</div>
			</div>
		);
	}

	// ─── Helpers ──────────────────────────────────────────────────────────────
	const getLogTime = (l) => l.timestamp || l.time || Date.now();

	const formatTime = (ts) =>
		new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

	const timeSince = (ts) => {
		const mins = Math.floor((Date.now() - ts) / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
	};

	const getAgeString = (dobString) => {
		if (!dobString) return "";
		const dob = new Date(dobString);
		const today = new Date();
		let months =
			(today.getFullYear() - dob.getFullYear()) * 12 +
			(today.getMonth() - dob.getMonth());
		if (today.getDate() < dob.getDate()) months--;
		return `${months} months old`;
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
	const directLogsToday = logs.filter(
		(l) =>
			l.type === "milk" && l.feedType === "direct" && isToday(getLogTime(l)),
	);
	const totalDurationToday = directLogsToday.reduce(
		(acc, curr) => acc + (curr.duration || 0),
		0,
	);
	const feedsToday = logs.filter(
		(l) => l.type === "milk" && isToday(getLogTime(l)),
	).length;
	const diapersToday = logs.filter(
		(l) => l.type === "diaper" && isToday(getLogTime(l)),
	).length;
	const lastMilk = logs.filter((l) => l.type === "milk")[0];

	const typeIcon = (type) => {
		const map = {
			milk: "ti-droplet",
			diaper: "ti-wind",
			sleep: "ti-moon",
			bath: "ti-droplets",
			note: "ti-notes",
			meds: "ti-pill",
		};
		return map[type] || "ti-circle";
	};

	const roleLabel = (role) => {
		const map = { admin: "Admin", parent: "Parent", caregiver: "Caregiver" };
		return map[role] ?? role;
	};

	const roleBadgeStyle = (role) => {
		if (role === "admin")
			return { background: "var(--purple-bg)", color: "var(--purple)" };
		if (role === "parent")
			return { background: "var(--blue-bg)", color: "var(--blue)" };
		return { background: "var(--teal-bg)", color: "var(--teal)" };
	};

	const avatarColor = (role) => {
		if (role === "admin") return "var(--purple)";
		if (role === "parent") return "var(--blue)";
		return "var(--teal)";
	};

	const getInitials = (name) =>
		name
			? name
					.split(" ")
					.map((n) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2)
			: "?";

	// ─── Modal submit ─────────────────────────────────────────────────────────
	const handleModalSubmit = () => {
		const logData = { type: modal.type };
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
		if (modal.type === "diaper") logData.diaperType = formState.diaperType;
		if (modal.type === "meds") logData.name = formState.name || "Medication";
		if (modal.type === "note") logData.text = formState.note || "";
		if (modal.type === "sleep") logData.isSleeping = true;

		addLog(logData);
		setModal({ isOpen: false, type: null });
		setFormState((prev) => ({ ...prev, name: "", note: "" }));
	};

	const closeModal = () => setModal({ isOpen: false, type: null });

	const adjAmount = (delta) => {
		const step = formState.unit === "oz" ? 0.5 : 10;
		const min = formState.unit === "oz" ? 0.5 : 10;
		const max = formState.unit === "oz" ? 12 : 350;
		setFormState((prev) => ({
			...prev,
			amount: Math.max(min, Math.min(max, prev.amount + delta * step)),
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

	const saveBabyProfile = async () => {
		await updateDoc(doc(db, "babies", activeBaby.id), {
			name: editBabyName,
			dob: editBabyDob,
		});
		setIsEditingBaby(false);
	};

	// ─── Timeline item ────────────────────────────────────────────────────────
	const TimelineItem = ({ log, isLast }) => (
		<div className="timeline-item">
			{!isLast && <div className="timeline-line"></div>}
			<div className={`timeline-dot dot-${log.type}`}>
				<i className={`ti ${typeIcon(log.type)}`}></i>
			</div>
			<div className="timeline-content">
				<div className="timeline-title" style={{ textTransform: "capitalize" }}>
					{log.type}
					{log.type === "milk" ? " Feeding" : ""}
					{log.type === "diaper" ? " Change" : ""}
				</div>
				{log.type === "milk" && log.feedType === "bottle" && (
					<div className="timeline-detail">
						{log.amount}
						{log.unit}
					</div>
				)}
				{log.type === "milk" && log.feedType === "direct" && (
					<div className="timeline-detail">
						{log.duration} mins · {log.breastSide} side
					</div>
				)}
				{log.type === "note" && (
					<div className="timeline-detail">{log.text}</div>
				)}
				{log.type === "meds" && (
					<div className="timeline-detail">{log.name}</div>
				)}
				<div className="timeline-time">
					{formatTime(getLogTime(log))} · {timeSince(getLogTime(log))}
				</div>
				{log.type === "milk" && (
					<span
						className={`timeline-tag ${log.feedType === "direct" ? "tag-direct" : "tag-formula"}`}
					>
						{log.feedType === "direct" ? "Direct BF" : "Bottle (BM)"}
					</span>
				)}
				{log.type === "diaper" && (
					<span className={`timeline-tag tag-${log.diaperType}`}>
						{log.diaperType}
					</span>
				)}
			</div>
		</div>
	);

	// ─── Member card ──────────────────────────────────────────────────────────
	const MemberCard = ({ member }) => {
		const isMe = member.userId === user.uid;
		return (
			<div
				style={{
					background: isMe ? "var(--cream2)" : "var(--white)",
					border: "1px solid var(--border)",
					borderRadius: "var(--r2)",
					padding: "12px 14px",
					display: "flex",
					alignItems: "center",
					gap: 12,
				}}
			>
				{member.photoURL ? (
					<img
						src={member.photoURL}
						alt={member.displayName}
						style={{
							width: 40,
							height: 40,
							borderRadius: "50%",
							objectFit: "cover",
							flexShrink: 0,
						}}
					/>
				) : (
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: "50%",
							background: avatarColor(member.role),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 14,
							fontWeight: 800,
							color: "white",
							flexShrink: 0,
						}}
					>
						{getInitials(member.displayName)}
					</div>
				)}
				<div style={{ flex: 1, minWidth: 0 }}>
					<div
						style={{
							fontSize: 14,
							fontWeight: 800,
							color: "var(--text)",
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
					>
						{member.displayName}
						{isMe ? " (You)" : ""}
					</div>
					{member.joinedAt && (
						<div
							style={{
								fontSize: 11,
								color: "var(--text3)",
								fontWeight: 600,
								marginTop: 1,
							}}
						>
							Joined {new Date(member.joinedAt).toLocaleDateString()}
						</div>
					)}
				</div>
				<span className="role-badge" style={roleBadgeStyle(member.role)}>
					{roleLabel(member.role)}
				</span>
			</div>
		);
	};

	// ─── Main app ─────────────────────────────────────────────────────────────
	return (
		<div className="app">
			{/* Header */}
			<div className="header">
				<div className="header-top">
					<div>
						<div className="logo">
							alai<span>ya</span> 🌸
						</div>
						{babies.length > 1 ? (
							<select
								style={{
									background: "transparent",
									fontSize: 13,
									color: "var(--text2)",
									fontWeight: 600,
									outline: "none",
									cursor: "pointer",
									fontFamily: "Nunito, sans-serif",
								}}
								value={activeBaby.id}
								onChange={(e) => switchBaby(e.target.value)}
							>
								{babies.map((b) => (
									<option key={b.id} value={b.id}>
										{b.name} · {getAgeString(b.dob)}
									</option>
								))}
							</select>
						) : (
							<div className="baby-name">
								{activeBaby.name} · {getAgeString(activeBaby.dob)}
							</div>
						)}
					</div>
						{/* <button
							onClick={logout}
							style={{
								background: "var(--cream2)",
								border: "none",
								borderRadius: 20,
								padding: "5px 14px",
								fontSize: 12,
								fontWeight: 700,
								color: "var(--text2)",
								cursor: "pointer",
								fontFamily: "Nunito, sans-serif",
							}}
						>
							Log Out
						</button> */}
				</div>
				<div className="nav">
					{[
						{ id: "dashboard", icon: "ti-home", label: "Home" },
						{ id: "log", icon: "ti-edit", label: "Log" },
						{ id: "timeline", icon: "ti-timeline", label: "Timeline" },
						{ id: "settings", icon: "ti-settings", label: "Settings" },
					].map(({ id, icon, label }) => (
						<button
							key={id}
							className={`nav-btn ${activeTab === id ? "active" : ""}`}
							onClick={() => setActiveTab(id)}
						>
							<i className={`ti ${icon}`}></i>
							{label}
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className="content">
				{/* Dashboard */}
				{activeTab === "dashboard" && (
					<div className="fade-in">
						<div className="hero-card">
							<div className="hero-greeting">
								Welcome back, {user.displayName?.split(" ")[0]} 👋
							</div>
							<div className="hero-status">
								{activeBaby.name}'s day at a glance
							</div>
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

						<div className="section-title">Today's Summary</div>
						<div className="summary-grid">
							<div className="sum-card highlight">
								<div>
									<span className="sum-card-val">{totalMilkToday}</span>{" "}
									<span className="sum-card-unit">ml</span>
								</div>
								<div className="sum-card-lbl">Bottle Milk</div>
							</div>
							<div className="sum-card" style={{ background: "var(--peach)" }}>
								<div>
									<span
										className="sum-card-val"
										style={{ color: "var(--rose-dark)" }}
									>
										{totalDurationToday}
									</span>{" "}
									<span className="sum-card-unit">mins</span>
								</div>
								<div className="sum-card-lbl">Direct Nursing</div>
							</div>
						</div>

						<div className="section-title">Recent Activity</div>
						<div className="timeline">
							{logs.slice(0, 5).map((log, i) => (
								<TimelineItem
									key={log.id}
									log={log}
									isLast={i === Math.min(4, logs.length - 1)}
								/>
							))}
							{logs.length === 0 && (
								<div
									style={{
										textAlign: "center",
										color: "var(--text3)",
										padding: "32px 24px",
										fontWeight: 600,
									}}
								>
									<div style={{ fontSize: 32, marginBottom: 8 }}>🌸</div>
									No activities logged yet
								</div>
							)}
						</div>
					</div>
				)}

				{/* Log */}
				{activeTab === "log" && (
					<div className="fade-in">
						<div className="section-title">Log an Activity</div>
						<div className="quick-btns">
							{[
								{
									type: "milk",
									icon: "ti-droplet",
									label: "Milk Feeding",
									sub: "Bottle or direct BF",
									cls: "milk",
								},
								{
									type: "diaper",
									icon: "ti-wind",
									label: "Diaper Change",
									sub: "Wet, dirty or both",
									cls: "diaper",
								},
								{
									type: "sleep",
									icon: "ti-moon",
									label: "Sleep",
									sub: "Log a nap or night",
									cls: "sleep",
								},
								{
									type: "bath",
									icon: "ti-droplets",
									label: "Bath Time",
									sub: "Tap to log",
									cls: "bath",
								},
								{
									type: "meds",
									icon: "ti-pill",
									label: "Medication",
									sub: "Vitamins, drops…",
									cls: "meds",
								},
								{
									type: "note",
									icon: "ti-notes",
									label: "Add Note",
									sub: "Mood / Observation",
									cls: "note",
								},
							].map(({ type, icon, label, sub, cls }) => (
								<button
									key={type}
									className={`quick-btn ${cls}`}
									onClick={() => setModal({ isOpen: true, type })}
								>
									<div className="quick-btn-icon">
										<i className={`ti ${icon}`}></i>
									</div>
									<div className="quick-btn-label">{label}</div>
									<div className="quick-btn-sub">{sub}</div>
								</button>
							))}
						</div>
					</div>
				)}

				{/* Timeline */}
				{activeTab === "timeline" && (
					<div className="fade-in">
						<div className="section-title">Full Timeline</div>
						<div className="timeline">
							{logs.map((log, i) => (
								<TimelineItem
									key={log.id}
									log={log}
									isLast={i === logs.length - 1}
								/>
							))}
							{logs.length === 0 && (
								<div
									style={{
										textAlign: "center",
										color: "var(--text3)",
										padding: "32px 24px",
										fontWeight: 600,
									}}
								>
									<div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
									Nothing logged yet — start tracking!
								</div>
							)}
						</div>
					</div>
				)}

				{/* Settings */}
				{activeTab === "settings" && (
					<div className="fade-in">
						{/* Family details */}
						<div className="section-title">Family Details</div>
						<div
							style={{
								background: "var(--white)",
								border: "1px solid var(--border)",
								borderRadius: "var(--r)",
								padding: "16px",
								marginBottom: 16,
							}}
						>
							<p
								style={{
									fontSize: 14,
									fontWeight: 800,
									color: "var(--text)",
									marginBottom: 8,
								}}
							>
								{family.name}
							</p>
							<p
								style={{
									fontSize: 13,
									color: "var(--text2)",
									marginBottom: 10,
									fontWeight: 600,
								}}
							>
								Share this code with family members to join:
							</p>
							<div
								style={{
									fontSize: 28,
									fontFamily: "monospace",
									fontWeight: 800,
									background: "var(--cream2)",
									padding: "12px",
									textAlign: "center",
									borderRadius: "var(--r2)",
									color: "var(--rose-dark)",
									letterSpacing: 4,
								}}
							>
								{family.joinCode ?? family.id.slice(0, 8)}
							</div>
						</div>

						{/* Baby profile */}
						<div
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								marginBottom: 10,
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
										color: "var(--rose)",
										fontSize: 12,
										fontWeight: 800,
										cursor: "pointer",
										fontFamily: "Nunito, sans-serif",
										textTransform: "uppercase",
										letterSpacing: "0.5px",
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
										fontSize: 12,
										fontWeight: 800,
										cursor: "pointer",
										fontFamily: "Nunito, sans-serif",
										textTransform: "uppercase",
										letterSpacing: "0.5px",
									}}
								>
									Cancel
								</button>
							)}
						</div>
						<div
							style={{
								background: "var(--white)",
								border: "1px solid var(--border)",
								borderRadius: "var(--r)",
								padding: "4px 16px",
								marginBottom: 16,
							}}
						>
							{!isEditingBaby ? (
								<>
									<div className="settings-item">
										<span className="settings-label">Name</span>
										<span className="settings-val">{activeBaby.name}</span>
									</div>
									<div className="settings-item">
										<span className="settings-label">Date of Birth</span>
										<span className="settings-val">{activeBaby.dob}</span>
									</div>
									<div className="settings-item">
										<span className="settings-label">Age</span>
										<span className="settings-val">
											{getAgeString(activeBaby.dob)}
										</span>
									</div>
								</>
							) : (
								<div
									style={{
										display: "flex",
										flexDirection: "column",
										gap: 12,
										padding: "12px 0",
									}}
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
										onClick={saveBabyProfile}
										className="submit-btn"
										style={{ marginTop: 4 }}
									>
										<i className="ti ti-check"></i> Save Changes
									</button>
								</div>
							)}
						</div>

						{/* Family members — real-time */}
						<div className="section-title">
							Family Members ({familyMembers.length})
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 8,
								marginBottom: 24,
							}}
						>
							{familyMembers.length === 0 ? (
								<div
									style={{
										textAlign: "center",
										color: "var(--text3)",
										padding: "20px",
										fontWeight: 600,
										fontSize: 13,
									}}
								>
									Loading members...
								</div>
							) : (
								familyMembers.map((m) => <MemberCard key={m.id} member={m} />)
							)}
						</div>

						<button
							onClick={logout}
							className="cancel-btn"
							style={{ width: "100%" }}
						>
							Sign Out
						</button>
					</div>
				)}
			</div>

			{/* Modal */}
			{modal.isOpen && (
				<div
					className="modal-overlay"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) closeModal();
					}}
				>
					<div className="modal">
						<div className="modal-handle"></div>

						{modal.type === "milk" && (
							<>
								<div className="modal-title">🍼 Log Feeding</div>
								<div className="form-group">
									<label className="form-label">Method</label>
									<div className="type-btns">
										<button
											className={`type-btn ${formState.feedType === "direct" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, feedType: "direct" })
											}
										>
											💛 Direct BF
										</button>
										<button
											className={`type-btn ${formState.feedType === "bottle" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, feedType: "bottle" })
											}
										>
											🍼 Bottle (BM)
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
														className={`type-btn ${formState.breastSide === side ? "selected" : ""}`}
														onClick={() =>
															setFormState({ ...formState, breastSide: side })
														}
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
							</>
						)}

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
							</>
						)}

						{modal.type === "sleep" && (
							<>
								<div className="modal-title">😴 Log Sleep</div>
								<div
									style={{
										background: "var(--purple-bg)",
										border: "1px solid var(--purple-light)",
										borderRadius: "var(--r2)",
										padding: "16px",
										marginBottom: 16,
									}}
								>
									<div
										style={{
											color: "var(--purple)",
											fontWeight: 700,
											fontSize: 14,
											marginBottom: 4,
										}}
									>
										Sleep will be logged at the current time.
									</div>
									<div
										style={{
											color: "var(--purple)",
											fontSize: 12,
											fontWeight: 600,
											opacity: 0.8,
										}}
									>
										{new Date().toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</div>
								</div>
							</>
						)}

						{modal.type === "bath" && (
							<>
								<div className="modal-title">🛁 Log Bath Time</div>
								<div
									style={{
										background: "var(--teal-bg)",
										border: "1px solid var(--teal-light)",
										borderRadius: "var(--r2)",
										padding: "16px",
										marginBottom: 16,
									}}
								>
									<div
										style={{
											color: "var(--teal)",
											fontWeight: 700,
											fontSize: 14,
										}}
									>
										Bath time will be logged at the current time.
									</div>
								</div>
							</>
						)}

						{modal.type === "meds" && (
							<>
								<div className="modal-title">💊 Log Medication</div>
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

						{modal.type === "note" && (
							<>
								<div className="modal-title">📝 Add Note</div>
								<div className="form-group">
									<label className="form-label">Note / Observation</label>
									<textarea
										className="form-input"
										rows="4"
										placeholder="e.g. Smiling a lot today!"
										value={formState.note}
										onChange={(e) =>
											setFormState({ ...formState, note: e.target.value })
										}
										style={{ resize: "none" }}
									></textarea>
								</div>
							</>
						)}

						<button className="submit-btn" onClick={handleModalSubmit}>
							<i className="ti ti-check"></i> Log Activity
						</button>
						<button className="cancel-btn" onClick={closeModal}>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
