export default function Loading({
	fullScreen = false,
	text = "Loading Alaiya...",
}) {
	const containerClass = fullScreen
		? "loading-container loading-fullscreen"
		: "loading-container loading-inline";

	return (
		<div className={containerClass}>
			<div className="loading-icon">🌸</div>
			<div className="loading-text">{text}</div>
		</div>
	);
}
