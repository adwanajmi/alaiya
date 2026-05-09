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
				padding: "16px 20px",
				background: "linear-gradient(135deg, #FFDADB 0%, #FFEFE5 100%)",
				borderBottom: "none",
				boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
				display: "flex",
				alignItems: "center",
				gap: "14px"
			}}>
				{/* Left Section: Dynamic Icon & Logo */}
				<div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
					{activeBaby?.photoURL ? (
						<img
							src={activeBaby.photoURL}
							alt={activeBaby.name || "Baby"}
							className="avatar-circle"
							style={{
								width: "46px",
								height: "46px",
								border: "2px solid var(--white)",
								boxShadow: "0 2px 10px rgba(204, 91, 67, 0.25)",
								objectFit: "cover"
							}}
						/>
					) : (
						<div style={{
							width: "46px",
							height: "46px",
							borderRadius: "50%",
							background: "var(--rose-dark)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "24px",
							color: "white",
							boxShadow: "0 2px 10px rgba(204, 91, 67, 0.25)"
						}}>
							{activeBaby ? (activeBaby.gender === 'boy' ? '👦' : '👧') : '👶'}
						</div>
					)}
					<div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
						<span style={{ fontSize: "22px", fontFamily: "Fredoka, sans-serif", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px" }}>Bably</span>
						<span style={{ fontSize: "16px" }}>🌸</span>
					</div>
				</div>

				{/* Vertical Divider */}
				<div style={{ width: "1px", height: "42px", background: "rgba(0,0,0,0.06)", flexShrink: 0 }} />

				{/* Middle Section: Greeting & Baby Pills */}
				<div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, justifyContent: "center" }}>
					<div style={{ 
						fontSize: "14px", 
						fontWeight: 800, 
						color: "var(--text)", 
						marginBottom: babies.length > 0 ? "4px" : "0",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis"
					}}>
						Good {timeOfDay}, {user?.displayName?.split(' ')[0] || 'parent'}!
					</div>
					
					{babies.length > 0 && (
						<div className="baby-switcher" style={{ paddingTop: 0, paddingBottom: 0, gap: "6px" }}>
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
										style={{
											padding: "3px 10px 3px 3px",
											background: isActive ? "rgba(255,255,255,0.8)" : "transparent",
											border: "none",
											boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
											color: "var(--text)",
											borderRadius: "100px",
											minHeight: "28px"
										}}
									>
										{baby.photoURL ? (
											<img 
												src={baby.photoURL} 
												alt={baby.name}
												className="avatar-circle"
												style={{
													width: "22px",
													height: "22px",
													border: isActive ? "2px solid var(--peach)" : "2px solid transparent",
													flexShrink: 0,
													objectFit: "cover"
												}}
											/>
										) : (
											<div style={{
												width: "22px",
												height: "22px",
												borderRadius: "50%",
												background: isActive ? "var(--peach)" : "transparent",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: "12px",
												flexShrink: 0
											}}>
												{baby.gender === "boy" ? "👦" : "👧"}
											</div>
										)}
										<span style={{ fontWeight: isActive ? 900 : 700, fontSize: "13px" }}>
											{baby.name.split(' ')[0]}
										</span>
										{isActive && (
											<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--rose-dark)", marginLeft: "2px" }}>
												<path d="m6 9 6 6 6-6"/>
											</svg>
										)}
									</button>
								);
							})}
						</div>
					)}
				</div>

				{/* Right Section: Notification Center */}
				<div ref={notifRef} style={{ position: "relative", flexShrink: 0 }}>
					<button
						onClick={handleNotifClick}
						style={{
							background: "var(--white)",
							border: "1px solid var(--border)",
							borderRadius: "50%",
							width: "42px",
							height: "42px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							position: "relative",
							transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
							boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
							color: "var(--text)",
						}}
					>
						<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
							<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
							<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
						</svg>
						
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
								top: "56px",
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