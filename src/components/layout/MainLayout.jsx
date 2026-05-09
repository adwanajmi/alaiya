import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";
import { timeSince } from "../../utils/dateUtils";
import ActivityModal from "../modals/ActivityModal";
import EncouragementOverlay from "../ui/EncouragementOverlay";
import BottomNav from "./BottomNav";
import ImageViewer from "../ui/ImageViewer";

export default function MainLayout() {
	const {
		user,
		babies,
		activeBaby,
		switchBaby,
		logs,
		growthLogs,
		encouragement,
		showEncouragement,
		familyMembers,
	} = useApp();

	const [showNotifs, setShowNotifs] = useState(false);
	const [lastRead, setLastRead] = useState(() => Date.now());
	const notifRef = useRef(null);

	const themeClass = activeBaby?.gender === "boy" ? "theme-boy" : "theme-girl";

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const growthUpdates = growthLogs.map((growth) => ({
		...growth,
		type: "growth",
		notificationTimestamp: growth.updatedAt || growth.createdAt || growth.timestamp,
		actorId: growth.updatedBy || growth.userId,
	}));
	const careUpdates = logs.map((log) => ({
		...log,
		notificationTimestamp: log.timestamp || log.time,
		actorId: log.userId,
	}));
	const recentUpdates = [...careUpdates, ...growthUpdates]
		.filter((l) => l.actorId !== user?.uid)
		.sort((a, b) => (b.notificationTimestamp || 0) - (a.notificationTimestamp || 0))
		.slice(0, 10);
	const unreadCount = recentUpdates.filter(
		(l) => (l.notificationTimestamp || l.timestamp || l.time) > lastRead,
	).length;

	const handleNotifClick = () => {
		setShowNotifs(!showNotifs);
		if (!showNotifs) setLastRead(Date.now());
	};

	const getMemberName = (uid) => {
		const member = familyMembers?.find((m) => m.userId === uid);
		return member?.displayName?.split(" ")[0] || "Someone";
	};

	const getNotifText = (log) => {
		const babyName = activeBaby?.name?.split(" ")[0] || "Baby";
		const doer = getMemberName(log.actorId || log.userId);

		if (log.type === "milk")
			return log.feedType === "bottle"
				? `${babyName} was fed ${log.amount}${log.unit} by ${doer}`
				: `${doer} nursed ${babyName} for ${log.duration}m`;
		if (log.type === "pump") return `${doer} pumped ${log.amount}${log.unit}`;
		if (log.type === "diaper") return `${doer} changed ${babyName}'s ${log.diaperType} diaper`;
		if (log.type === "sleep") return `${doer} logged ${babyName} went to sleep`;
		if (log.type === "bath") return `${doer} gave ${babyName} a bath`;
		if (log.type === "meds") return `${doer} gave ${babyName} ${log.name}`;
		if (log.type === "growth") {
			const changed = [];
			if (log.weight) changed.push("weight");
			if (log.height) changed.push("height");
			if (log.hc) changed.push("head circumference");
			const metricText = changed.length ? changed.join(", ") : "growth";
			return log.lastAction === "updated" || log.updatedBy
				? `${babyName}'s ${metricText} was updated by ${doer} 🌸`
				: `New growth entry added by ${doer} ✨`;
		}
		return `${doer} logged an activity`;
	};

	const hour = new Date().getHours();
	const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

	return (
		<div className={`app ${themeClass}`}>
			<div className="header" style={{
				padding: "16px 20px 12px",
				background: "rgba(255, 255, 255, 0.85)",
				backdropFilter: "blur(24px)",
				WebkitBackdropFilter: "blur(24px)",
				borderBottom: "none",
				boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
			}}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: babies.length > 0 ? "16px" : "0" }}>
					<div style={{ display: "flex", flexDirection: "column" }}>
						<div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
							<span style={{ fontSize: "24px", fontFamily: "Fredoka, sans-serif", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>Bably</span>
							<span style={{ fontSize: "18px" }}>🌸</span>
						</div>
						<div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text3)" }}>
							Good {timeOfDay}, {user?.displayName?.split(' ')[0] || 'parent'}!
						</div>
					</div>

					<div ref={notifRef} style={{ position: "relative" }}>
						<button
							onClick={handleNotifClick}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								padding: 0,
								position: "relative",
								transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
							}}
							className="avatar-circle-clickable"
						>
							{user?.photoURL ? (
								<img
									src={user.photoURL}
									alt="Profile"
									className="avatar-circle"
									style={{
										width: 42,
										height: 42,
										border: "2px solid var(--white)",
										boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
									}}
								/>
							) : (
								<div
									className="avatar-circle"
									style={{
										width: 42,
										height: 42,
										background: "var(--cream2)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontWeight: 800,
										border: "2px solid var(--white)",
										boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
										color: "var(--rose-dark)",
										fontSize: "16px",
									}}
								>
									{user?.displayName?.charAt(0) || "?"}
								</div>
							)}
							{unreadCount > 0 && (
								<div
									style={{
										position: "absolute",
										top: -4,
										right: -4,
										background: "var(--rose-dark)",
										color: "white",
										fontSize: "10px",
										fontWeight: 900,
										minWidth: "18px",
										height: "18px",
										borderRadius: "9px",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										border: "2px solid var(--white)",
										padding: "0 4px",
										boxShadow: "0 2px 8px rgba(204, 91, 67, 0.4)",
									}}
								>
									{unreadCount > 9 ? "9+" : unreadCount}
								</div>
							)}
						</button>

						{showNotifs && (
								<div
									className="fade-in"
									style={{
										position: "absolute",
										top: "52px",
										right: "0px",
										width: "300px",
										background: "var(--white)",
										borderRadius: "var(--r)",
										boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
										border: "1px solid var(--border)",
										overflow: "hidden",
										zIndex: 100,
									}}
								>
									<div
										style={{
											padding: "14px 16px",
											background: "var(--cream2)",
											borderBottom: "1px solid var(--border)",
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
										}}
									>
										<span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text)" }}>
											Recent Activity
										</span>
										{unreadCount > 0 && (
											<span style={{ fontSize: "11px", fontWeight: 800, color: "var(--rose-dark)" }}>
												{unreadCount} New
											</span>
										)}
									</div>
									<div style={{ maxHeight: "320px", overflowY: "auto" }}>
										{recentUpdates.length > 0 ? (
											recentUpdates.map((log) => {
												const config = ACTIVITY_CONFIG[log.type] || ACTIVITY_CONFIG.note;
												const isNew = (log.notificationTimestamp || log.timestamp || log.time) > lastRead;
												return (
													<div
														key={log.id}
														style={{
															padding: "12px 16px",
															borderBottom: "1px solid var(--border)",
															display: "flex",
															gap: "12px",
															alignItems: "center",
															background: isNew ? "var(--peach)" : "var(--white)",
															transition: "background 0.2s",
														}}
													>
														<div
															style={{
																width: "36px",
																height: "36px",
																borderRadius: "10px",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																fontSize: "18px",
																flexShrink: 0,
																background: `var(--color-${log.type})`,
																opacity: isNew ? 1 : 0.6,
															}}
														>
															{config.emoji}
														</div>
														<div style={{ display: "flex", flexDirection: "column" }}>
															<span style={{ fontSize: "13px", color: "var(--text)", fontWeight: isNew ? 800 : 600 }}>
																{getNotifText(log)}
															</span>
															<span style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 700 }}>
																{timeSince(log.notificationTimestamp || log.timestamp || log.time)}
															</span>
														</div>
													</div>
												);
											})
										) : (
											<div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text3)", fontSize: "13px", fontWeight: 700 }}>
												No recent updates from others.
											</div>
										)}
									</div>
								</div>
							)}
					</div>
				</div>

				{babies.length > 0 && (
					<div className="baby-switcher" style={{ paddingTop: 0 }}>
						{babies.map((baby) => {
							const isActive = activeBaby?.id === baby.id;
							return (
								<button
									key={baby.id}
									className={`baby-tab ${isActive ? "active" : ""}`}
									onClick={() => {
										switchBaby(baby.id);
										setLastRead(Date.now());
									}}
								>
									<div style={{
										width: "28px",
										height: "28px",
										borderRadius: "50%",
										background: isActive ? "var(--peach)" : "var(--white)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "14px",
										boxShadow: isActive ? "none" : "0 2px 6px rgba(0,0,0,0.04)",
										transition: "all 0.2s ease",
										flexShrink: 0
									}}>
										{baby.gender === "boy" ? "👦" : "👧"}
									</div>
									<span style={{ fontWeight: isActive ? 800 : 700, paddingRight: "8px" }}>
										{baby.name.split(' ')[0]}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>

			<div className="content">
				<Outlet />
			</div>
			<BottomNav />
			<ActivityModal />
			<ImageViewer />
			{encouragement && (
				<EncouragementOverlay message={encouragement} onFinished={() => showEncouragement(null)} />
			)}
		</div>
	);
}