import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";

export default function Dashboard() {
	const { user, activeBaby, logs } = useApp();

	const getLogTime = (l) => l.timestamp || l.time || Date.now();
	const formatTime = (ts) =>
		new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	const timeSince = (ts) => {
		const mins = Math.floor((Date.now() - ts) / 60000);
		if (mins < 1) return "just now";
		if (mins < 60) return `${mins}m ago`;
		const h = Math.floor(mins / 60);
		return `${h}h ${mins % 60}m ago`;
	};

	const isToday = (ts) =>
		new Date(ts).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
	const feedsToday = logs.filter(
		(l) => l.type === "milk" && isToday(getLogTime(l)),
	).length;
	const diapersToday = logs.filter(
		(l) => l.type === "diaper" && isToday(getLogTime(l)),
	).length;
	const lastMilk = logs.filter((l) => l.type === "milk")[0];

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
			<div className="hero-card">
				<div className="hero-greeting">
					Hi {user?.displayName?.split(" ")[0]} 👋
				</div>
				<div className="hero-status">How is {activeBaby?.name} doing?</div>
				<div className="hero-stats">
					<div className="hero-stat">
						<span className="hero-stat-val">
							{lastMilk ? timeSince(getLogTime(lastMilk)) : "—"}
						</span>
						<span className="hero-stat-lbl">Last Fed</span>
					</div>
					<div className="hero-stat">
						<span className="hero-stat-val">{feedsToday}</span>
						<span className="hero-stat-lbl">Feeds Today</span>
					</div>
					<div className="hero-stat">
						<span className="hero-stat-val">{diapersToday}</span>
						<span className="hero-stat-lbl">Diapers</span>
					</div>
				</div>
			</div>

			<div className="section-title">Recent Activity</div>
			<div className="timeline-cards">
				{logs.slice(0, 4).map((log) => (
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
						No activities yet. Tap below to log!
					</div>
				)}
			</div>
		</div>
	);
}
