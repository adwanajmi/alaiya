import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Loading from "./components/ui/Loading"; // 👈 Import the new component
import { useApp } from "./contexts/AppContext";
import AuthPage from "./pages/Auth/AuthPage";
import Dashboard from "./pages/Dashboard/Dashboard";
import OnboardingFlow from "./pages/Onboarding/OnboardingFlow";
import Settings from "./pages/Settings/Settings";
import Stats from "./pages/Stats/Stats";
import Timeline from "./pages/Timeline/Timeline";

export default function App() {
	const { user, family, babies, loading, pendingFamilyId } = useApp();

	// 👈 Beautiful full-screen loading state
	if (loading) return <Loading fullScreen text="Loading Alaiya 🌸" />;

	if (!user) return <AuthPage />;
	if (pendingFamilyId) return <OnboardingFlow step="role-select" />;
	if (!family) return <OnboardingFlow step="join-create" />;
	if (babies.length === 0) return <OnboardingFlow step="add-baby" />;

	return (
		<HashRouter>
			<Routes>
				<Route element={<MainLayout />}>
					<Route path="/" element={<Dashboard />} />
					<Route path="/timeline" element={<Timeline />} />
					<Route path="/stats" element={<Stats />} />
					<Route path="/settings" element={<Settings />} />
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</HashRouter>
	);
}
