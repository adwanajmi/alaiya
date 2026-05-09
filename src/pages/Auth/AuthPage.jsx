import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import Loading from "../../components/ui/Loading";

export default function AuthPage() {
	const { login, loading, user } = useApp();
	const navigate = useNavigate();
	const location = useLocation();
	const redirectTo = location.state?.from?.pathname || "/";

	useEffect(() => {
		if (user) {
			navigate(redirectTo, { replace: true });
		}
	}, [user, navigate, redirectTo]);

	if (loading) return <Loading fullScreen text="Checking your session..." />;

	return (
		<div
			className="app"
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				padding: "24px",
			}}
		>
			<div className="logo" style={{ fontSize: 44, marginBottom: 32 }}>
				Bably 🌸
			</div>
			<p
				style={{
					color: "var(--text2)",
					fontWeight: 600,
					marginBottom: 24,
					textAlign: "center",
				}}
			>
				Track feeding, sleep & diapers beautifully, together.
			</p>
			<button
				onClick={login}
				className="submit-btn"
				style={{
					background: "var(--white)",
					color: "var(--text)",
					border: "1px solid var(--border)",
					boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
				}}
			>
				<i className="ti ti-brand-google"></i> Sign in with Google
			</button>
		</div>
	);
}
