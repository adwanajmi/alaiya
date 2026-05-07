import { Outlet } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import BottomNav from "./BottomNav";
import ActivityModal from "../modals/ActivityModal";

export default function MainLayout() {
	const { user, babies, activeBaby, switchBaby } = useApp();
	
	const themeClass = activeBaby?.gender === "boy" ? "theme-boy" : "theme-girl";
	
	return (
		<div className={`app ${themeClass}`}>
			<div className="header">
				<div className="header-top">
					<div>
						<div className="logo">Alaiya 🌸</div>
					</div>
					<div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--cream2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
						{user?.displayName?.charAt(0)}
					</div>
				</div>
				
				{/* 👈 Dynamic Baby Switcher */}
				{babies.length > 0 && (
					<div className="baby-switcher">
						{babies.map(baby => (
							<button 
								key={baby.id} 
								className={`baby-tab ${activeBaby?.id === baby.id ? "active" : ""}`}
								onClick={() => switchBaby(baby.id)}
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