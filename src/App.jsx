import { HashRouter, Routes, Route } from "react-router-dom";
import AppEntryGate from "./components/auth/AppEntryGate";
import { AdminRoute, ProtectedRoute } from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";
import Timeline from "./pages/Timeline/Timeline";
import Stats from "./pages/Stats/Stats";
import Settings from "./pages/Settings/Settings";
import AuthPage from "./pages/Auth/AuthPage";
import AdminDashboard from "./pages/Admin/AdminDashboard"; 

export default function App() {
	return (
		<HashRouter>
			<Routes>
				<Route
					path="/"
					element={
						<ProtectedRoute>
							<AppEntryGate />
						</ProtectedRoute>
					}
				>
					<Route index element={<Dashboard />} />
					<Route path="timeline" element={<Timeline />} />
					<Route path="stats" element={<Stats />} />
					<Route path="settings" element={<Settings />} />
				</Route>
				<Route path="/auth" element={<AuthPage />} />
				<Route
					path="/admin"
					element={
						<AdminRoute>
							<AdminDashboard />
						</AdminRoute>
					}
				/>
				<Route path="*" element={<AuthPage />} />
			</Routes>
		</HashRouter>
	);
}
