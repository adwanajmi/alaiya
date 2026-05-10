import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";

export default function BottomNav() {
	const location = useLocation();
	const activeTab = location.pathname;
	
	const { userRole, isSuperAdmin, openModal } = useApp();
	const [isFabOpen, setIsFabOpen] = useState(false);

	const myRole = isSuperAdmin ? "parent" : userRole || "caregiver";

	// 👈 Simplified Parent Actions
	const parentActions = [
		{ type: "milk", icon: "🍼", label: "Feed Baby", color: "bg-milk" },
		{ type: "pump", icon: "💧", label: "Pumping", color: "bg-pump" },
	];
	
	const caregiverActions = [
		{ type: "bath", icon: "🛁", label: "Bath", color: "bg-bath" },
		{ type: "sleep", icon: "😴", label: "Sleep", color: "bg-sleep" },
		{ type: "milk", icon: "🍼", label: "Feed", color: "bg-milk" },
		{ type: "diaper", icon: "🧷", label: "Diaper", color: "bg-diaper" },
	];
	
	const quickActions = myRole === "parent" ? parentActions : caregiverActions;

	const handleActionClick = (type) => {
		openModal(type);
		setIsFabOpen(false); 
	};

	return (
		<>
			{isFabOpen && (
				<div className="fab-overlay" onMouseDown={() => setIsFabOpen(false)}>
					<div className="fab-menu" onMouseDown={(e) => e.stopPropagation()}>
						{quickActions.map((action) => (
							<button key={action.type} className="fab-item" onClick={() => handleActionClick(action.type)}>
								<div className={`fab-item-icon ${action.color}`}>{action.icon}</div>
								<span>{action.label}</span>
							</button>
						))}
						<div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
						<button className="fab-item" onClick={() => handleActionClick("menu")}>
							<div className="fab-item-icon bg-note" style={{ background: "var(--cream2)" }}>➕</div>
							<span>More Options</span>
						</button>
					</div>
				</div>
			)}

			<div className="nav-container">
				<div className="floating-nav">
					<Link to="/" className={`nav-tab ${activeTab === "/" ? "active" : ""}`}>
						<div className="nav-icon-wrapper">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
								<polyline points="9 22 9 12 15 12 15 22"/>
							</svg>
						</div>
						<span className="nav-label">Home</span>
					</Link>
					
					<Link to="/timeline" className={`nav-tab ${activeTab === "/timeline" ? "active" : ""}`}>
						<div className="nav-icon-wrapper">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
							</svg>
						</div>
						<span className="nav-label">Timeline</span>
					</Link>

					<div className="nav-fab-wrapper">
						<button 
							className={`nav-fab-button ${isFabOpen ? 'open' : ''}`} 
							onClick={() => setIsFabOpen(!isFabOpen)}
							aria-label="Quick Add"
						>
							<div className="nav-fab-icon">
								<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
									<path d="M12 5v14M5 12h14"/>
								</svg>
							</div>
						</button>
					</div>

					<Link to="/stats" className={`nav-tab ${activeTab === "/stats" ? "active" : ""}`}>
						<div className="nav-icon-wrapper">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
							</svg>
						</div>
						<span className="nav-label">Stats</span>
					</Link>
					
					<Link to="/settings" className={`nav-tab ${activeTab === "/settings" ? "active" : ""}`}>
						<div className="nav-icon-wrapper">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
							</svg>
						</div>
						<span className="nav-label">Settings</span>
					</Link>
				</div>
			</div>
		</>
	);
}
