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

			<div className="bottom-nav">
				<Link to="/" className={`nav-tab ${activeTab === "/" ? "active" : ""}`}>
					<i>🏠</i><span>Home</span>
				</Link>
				<Link to="/timeline" className={`nav-tab ${activeTab === "/timeline" ? "active" : ""}`}>
					<i>📋</i><span>History</span>
				</Link>

				<div className="fab-container">
					<button className={`fab-button ${isFabOpen ? 'open' : ''}`} onClick={() => setIsFabOpen(!isFabOpen)}>
						<div className="fab-icon-inner">+</div>
					</button>
				</div>

				<Link to="/stats" className={`nav-tab ${activeTab === "/stats" ? "active" : ""}`}>
					<i>📊</i><span>Stats</span>
				</Link>
				<Link to="/settings" className={`nav-tab ${activeTab === "/settings" ? "active" : ""}`}>
					<i>⚙️</i><span>Settings</span>
				</Link>
			</div>
		</>
	);
}
