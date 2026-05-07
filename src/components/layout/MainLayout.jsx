import { Outlet } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import ActivityModal from "../modals/ActivityModal";
import BottomNav from "./BottomNav";

export default function MainLayout() {
	const { user, activeBaby } = useApp();

	return (
		<div className="app">
			<div className="header">
				<div className="header-top">
					<div>
						<div className="logo">
							<i>alai</i><span>ya</span> 🌸
						</div>
						{activeBaby && <div className="baby-name">{activeBaby.name}</div>}
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
						{user?.displayName?.charAt(0)}
					</div>
				</div>
			</div>

			<div className="content">
				<Outlet />
			</div>

			<BottomNav />
			<ActivityModal />
		</div>
	);
}
