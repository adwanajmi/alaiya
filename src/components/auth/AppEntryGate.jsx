import MainLayout from "../layout/MainLayout";
import { useApp } from "../../contexts/AppContext";
import OnboardingFlow from "../../pages/Onboarding/OnboardingFlow";
import Loading from "../ui/Loading";

export default function AppEntryGate() {
	const { loading, familyDataLoading, user, pendingFamilyId, family, babies } =
		useApp();

	if (loading) return <Loading fullScreen text="Checking your session..." />;
	if (!user) return null;
	if (pendingFamilyId) return <OnboardingFlow step="role-select" />;
	if (!user.currentFamilyId) return <OnboardingFlow step="join-create" />;
	if (familyDataLoading || !family) {
		return <Loading fullScreen text="Loading your family..." />;
	}
	if (babies.length === 0) return <OnboardingFlow step="add-baby" />;

	return <MainLayout />;
}
