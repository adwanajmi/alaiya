import Loading from "../../components/ui/Loading"; // 👈 Import it
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";

export default function Timeline() {
	const { logs, activeBaby } = useApp();

	const getLogTime = (l) => l.timestamp || l.time || Date.now();
	const formatTime = (ts) =>
		new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

	const TimelineCard = ({ log }) => {
		const config = ACTIVITY_CONFIG[log.type] || ACTIVITY_CONFIG.note;
		return (
			<div className="timeline-card fade-in">
				<div className={`activity-avatar ${config.color}`}>{config.emoji}</div>
				<div className="timeline-card-content">
					<div className="timeline-header">
						<span className="timeline-title">
							{config.title}{" "}
							{log.type === "milk" &&
								(log.feedType === "direct" ? "(Direct)" : "(Bottle)")}
						</span>
						<span className="timeline-time">{formatTime(getLogTime(log))}</span>
					</div>
					<div className="timeline-details">
						{log.type === "milk" &&
							log.feedType === "bottle" &&
							`${log.amount}${log.unit} Breast Milk`}
						{log.type === "milk" &&
							log.feedType === "direct" &&
							`${log.duration} mins • ${log.breastSide} side`}
						{log.type === "pump" &&
							`${log.amount}${log.unit} • ${log.breastSide} side`}
						{log.type === "diaper" && (
							<span style={{ textTransform: "capitalize" }}>
								{log.diaperType} Diaper
							</span>
						)}
						{log.type === "meds" && log.name}
						{log.type === "sleep" && "Fell asleep"}
						{log.type === "bath" && "Splish splash"}
					</div>
					{log.text && <div className="timeline-notes">"{log.text}"</div>}
				</div>
			</div>
		);
	};

	return (
		<div className="fade-in">
			<div className="section-title">Full History</div>

			{/* 👈 Dynamic inline loading state fallback */}
			{!logs ? (
				<Loading
					inline
					text={`Preparing ${activeBaby?.name?.split(" ")[0]}'s timeline 🌸`}
				/>
			) : (
				<div className="timeline-cards">
					{logs.map((log) => (
						<TimelineCard key={log.id} log={log} />
					))}
					{logs.length === 0 && (
						<div
							style={{
								textAlign: "center",
								padding: "40px",
								color: "var(--text3)",
								fontWeight: 700,
							}}
						>
							No activities recorded yet.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
