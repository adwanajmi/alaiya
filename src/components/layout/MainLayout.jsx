import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import BottomNav from "./BottomNav";
import ActivityModal from "../modals/ActivityModal";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { timeSince } from "../../utils/dateUtils";

export default function MainLayout() {
	const { user, babies, activeBaby, switchBaby, logs } = useApp();
	
	// Notification State
	const [showNotifs, setShowNotifs] = useState(false);
	const [lastRead, setLastRead] = useState(() => 
		parseInt(localStorage.getItem(`alaiya_lastRead_${activeBaby?.id}`)) || Date.now()
	);
	const notifRef = useRef(null);

	const themeClass = activeBaby?.gender === "boy" ? "theme-boy" : "theme-girl";

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Derive recent updates from existing logs (Zero-cost notifications!)
	// Filter out the current user's own logs so they don't get notified of their own actions
	const recentUpdates = logs
		.filter((l) => l.userId !== user?.uid)
		.slice(0, 10); // Show last 10 foreign activities

	const unreadCount = recentUpdates.filter(
		(l) => (l.timestamp || l.time) > lastRead
	).length;

	const handleBellClick = () => {
		setShowNotifs(!showNotifs);
		if (!showNotifs) {
			// Mark as read when opening
			const now = Date.now();
			setLastRead(now);
			localStorage.setItem(`alaiya_lastRead_${activeBaby?.id}`, now.toString());
		}
	};

	// Helper to generate readable notification text
	const getNotifText = (log) => {
		const name = activeBaby?.name?.split(" ")[0] || "Baby";
		if (log.type === "milk") return log.feedType === "bottle" ? `was fed ${log.amount}${log.unit}` : `nursed for ${log.duration}m`;
		if (log.type === "pump") return `pumped ${log.amount}${log.unit}`;
		if (log.type === "diaper") return `had a ${log.diaperType} diaper change`;
		if (log.type === "sleep") return `went to sleep`;
		if (log.type === "bath") return `had a bath`;
		if (log.type === "meds") return `was given ${log.name}`;
		return `activity logged`;
	};

	return (
		<div className={`app ${themeClass}`}>
			<div className="header">
				<div className="header-top">
					<div className="logo" style={{ fontFamily: "Fredoka, sans-serif" }}>Alaiya 🌸</div>
					
					{/* Header Right Actions */}
					<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
						
						{/* Notification Bell */}
						<div ref={notifRef} style={{ position: "relative" }}>
							<button 
								onClick={handleBellClick}
								style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
							>
								🔔
								{unreadCount > 0 && (
									<div style={{ position: "absolute", top: -2, right: -4, background: "var(--rose-dark)", color: "white", fontSize: "10px", fontWeight: 900, minWidth: "18px", height: "18px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--white)" }}>
										{unreadCount > 9 ? "9+" : unreadCount}
									</div>
								)}
							</button>

							{/* Dropdown Panel */}
							{showNotifs && (
								<div className="fade-in" style={{ position: "absolute", top: "40px", right: "-10px", width: "300px", background: "var(--white)", borderRadius: "var(--r)", boxShadow: "0 10px 40px rgba(0,0,0,0.12)", border: "1px solid var(--border)", overflow: "hidden", zIndex: 100 }}>
									<div style={{ padding: "14px 16px", background: "var(--cream2)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<span style={{ fontWeight: 800, fontSize: "14px", color: "var(--text)" }}>Recent Activity</span>
										{unreadCount > 0 && <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--rose-dark)" }}>{unreadCount} New</span>}
									</div>
									
									<div style={{ maxHeight: "320px", overflowY: "auto" }}>
										{recentUpdates.length > 0 ? (
											recentUpdates.map((log) => {
												const config = ACTIVITY_CONFIG[log.type] || ACTIVITY_CONFIG.note;
												const isNew = (log.timestamp || log.time) > lastRead;
												return (
													<div key={log.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: "12px", alignItems: "center", background: isNew ? "var(--peach)" : "var(--white)", transition: "background 0.2s" }}>
														<div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0, background: `var(--color-${log.type})`, opacity: isNew ? 1 : 0.6 }}>
															{config.emoji}
														</div>
														<div style={{ display: "flex", flexDirection: "column" }}>
															<span style={{ fontSize: "13px", color: "var(--text)", fontWeight: isNew ? 800 : 600 }}>
																<span style={{ textTransform: "capitalize" }}>{activeBaby?.name?.split(" ")[0]}</span> {getNotifText(log)}
															</span>
															<span style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 700 }}>
																{timeSince(log.timestamp || log.time)}
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

						{/* Avatar */}
						<div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, border: "2px solid var(--peach)", color: "var(--rose-dark)" }}>
							{user?.displayName?.charAt(0)}
						</div>
					</div>
				</div>
				
				{/* Baby Switcher */}
				{babies.length > 0 && (
					<div className="baby-switcher">
						{babies.map(baby => (
							<button 
								key={baby.id} 
								className={`baby-tab ${activeBaby?.id === baby.id ? "active" : ""}`}
								onClick={() => {
									switchBaby(baby.id);
									// Refresh lastRead for the new baby context
									setLastRead(parseInt(localStorage.getItem(`alaiya_lastRead_${baby.id}`)) || Date.now());
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
		</div>
	);
}