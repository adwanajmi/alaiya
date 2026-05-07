import { useEffect, useState } from "react";

export default function EncouragementOverlay({ message, onFinished }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (message) {
			setVisible(true);
			const timer = setTimeout(() => {
				setVisible(false);
				setTimeout(onFinished, 500); // Wait for fade out animation
			}, 3500);
			return () => clearTimeout(timer);
		}
	}, [message, onFinished]);

	if (!message && !visible) return null;

	return (
		<div style={{
			position: "fixed",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			zIndex: 1000,
			width: "85%",
			maxWidth: "320px",
			pointerEvents: "none",
			opacity: visible ? 1 : 0,
			transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
		}}>
			<div style={{
				background: "var(--white)",
				padding: "32px 24px",
				borderRadius: "30px",
				textAlign: "center",
				boxShadow: "0 20px 50px rgba(204, 91, 67, 0.15)",
				border: "1px solid var(--peach)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "16px"
			}}>
				<div style={{ fontSize: "40px" }}>🌸</div>
				<p style={{
					fontSize: "17px",
					fontWeight: "800",
					color: "var(--text)",
					lineHeight: "1.4",
					margin: 0
				}}>
					{message}
				</p>
			</div>
		</div>
	);
}