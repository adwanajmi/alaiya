import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";
import { timeSince } from "../../utils/dateUtils";
import ActivityModal from "../modals/ActivityModal";
import EncouragementOverlay from "../ui/EncouragementOverlay";
import BottomNav from "./BottomNav";

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
			if (notifRef.current && !notifRef.current.contains(e.target))
				setShowNotifs(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const growthUpdates = growthLogs.map((growth) => ({
		...growth,
		type: "growth",
		notificationTimestamp:
			growth.updatedAt || growth.createdAt || growth.timestamp,
		actorId: growth.updatedBy || growth.userId,
	}));
	const careUpdates = logs.map((log) => ({
		...log,
		notificationTimestamp: log.timestamp || log.time,
		actorId: log.userId,
	}));
	const recentUpdates = [...careUpdates, ...growthUpdates]
		.filter((l) => l.actorId !== user?.uid)
		.sort(
			(a, b) => (b.notificationTimestamp || 0) - (a.notificationTimestamp || 0),
		)
		.slice(0, 10);
	const unreadCount = recentUpdates.filter(
		(l) => (l.notificationTimestamp || l.timestamp || l.time) > lastRead,
	).length;

	const handleAvatarClick = () => {
		setShowNotifs(!showNotifs);
		if (!showNotifs) {
			const now = Date.now();
			setLastRead(now);
		}
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
		if (log.type === "diaper")
			return `${doer} changed ${babyName}'s ${log.diaperType} diaper`;
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

	return (
		<div className={`app ${themeClass}`}>
			<div className="header">
				<div className="header-top">
					<div
						className="logo"
						style={{ fontFamily: "Fredoka, sans-serif", fontSize: 0 }}
					>
						<span style={{ fontSize: 24 }}>Bably 🌸</span>
						{activeBaby?.name && (
							<span
								style={{
									fontFamily: "Nunito, sans-serif",
									fontSize: 13,
									fontWeight: 800,
									color: "var(--text2)",
								}}
							></span>
						)}
					</div>

					{/* Profile Avatar acts as Notification Toggle */}
					<div ref={notifRef} style={{ position: "relative" }}>
						<button
							onClick={handleAvatarClick}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								position: "relative",
								padding: 0,
							}}
						>
							{user?.photoURL ? (
								<img
									src={user.photoURL}
									alt="Profile"
									style={{
										width: 42,
										height: 42,
										borderRadius: "50%",
										border: "2px solid var(--peach)",
										objectFit: "cover",
										display: "block",
									}}
								/>
							) : (
								<div
									style={{
										width: 42,
										height: 42,
										borderRadius: "50%",
										background: "var(--cream2)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontWeight: 800,
										border: "2px solid var(--peach)",
										color: "var(--rose-dark)",
									}}
								>
									{user?.displayName?.charAt(0) || "?"}
								</div>
							)}
							{unreadCount > 0 && (
								<div
									style={{
										position: "absolute",
										top: -2,
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
									}}
								>
									{unreadCount > 9 ? "9+" : unreadCount}
								</div>
							)}
						</button>

						{/* Interactive Notification Panel */}
						{showNotifs && (
							<div
								className="fade-in"
								style={{
									position: "absolute",
									top: "54px",
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
									<span
										style={{
											fontWeight: 800,
											fontSize: "14px",
											color: "var(--text)",
										}}
									>
										Recent Activity
									</span>
									{unreadCount > 0 && (
										<span
											style={{
												fontSize: "11px",
												fontWeight: 800,
												color: "var(--rose-dark)",
											}}
										>
											{unreadCount} New
										</span>
									)}
								</div>
								<div style={{ maxHeight: "320px", overflowY: "auto" }}>
									{recentUpdates.length > 0 ? (
										recentUpdates.map((log) => {
											const config =
												ACTIVITY_CONFIG[log.type] || ACTIVITY_CONFIG.note;
											const isNew =
												(log.notificationTimestamp ||
													log.timestamp ||
													log.time) > lastRead;
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
													<div
														style={{ display: "flex", flexDirection: "column" }}
													>
														<span
															style={{
																fontSize: "13px",
																color: "var(--text)",
																fontWeight: isNew ? 800 : 600,
															}}
														>
															{getNotifText(log)}
														</span>
														<span
															style={{
																fontSize: "11px",
																color: "var(--text3)",
																fontWeight: 700,
															}}
														>
															{timeSince(
																log.notificationTimestamp ||
																	log.timestamp ||
																	log.time,
															)}
														</span>
													</div>
												</div>
											);
										})
									) : (
										<div
											style={{
												padding: "32px 16px",
												textAlign: "center",
												color: "var(--text3)",
												fontSize: "13px",
												fontWeight: 700,
											}}
										>
											No recent updates from others.
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				</div>

				{babies.length > 0 && (
					<div className="baby-switcher">
						{babies.map((baby) => (
							<button
								key={baby.id}
								className={`baby-tab ${activeBaby?.id === baby.id ? "active" : ""}`}
								onClick={() => {
									switchBaby(baby.id);
									setLastRead(parseInt() || Date.now());
								}}
							>
								{baby.gender === "boy" ? "👦" : "👧"} {baby.name}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="content">
				<Outlet />
			</div>
			<BottomNav />
			<ActivityModal />
			{encouragement && (
				<EncouragementOverlay
					message={encouragement}
					onFinished={() => showEncouragement(null)}
				/>
			)}
		</div>
	);
}
