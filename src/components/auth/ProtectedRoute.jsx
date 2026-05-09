import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import Loading from "../ui/Loading";

export function ProtectedRoute({ children }) {
	const { loading, user } = useApp();
	const location = useLocation();

	if (loading) return <Loading fullScreen text="Checking your session..." />;
	if (!user) return <Navigate to="/auth" replace state={{ from: location }} />;

	return children;
}

export function AdminRoute({ children }) {
	const { loading, user, isSuperAdmin } = useApp();

	if (loading) return <Loading fullScreen text="Checking your session..." />;
	if (!user) return <Navigate to="/auth" replace />;
	if (!isSuperAdmin) return <Navigate to="/" replace />;

	return children;
}
