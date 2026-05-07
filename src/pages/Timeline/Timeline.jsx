import Loading from "../../components/ui/Loading";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";
import { formatTime } from "../../utils/dateUtils";

export default function Timeline() {
	const { logs, activeBaby, user, familyMembers, openModal, deleteLog } = useApp();

	const myRole = familyMembers.find(m => m.userId === user?.uid)?.role || "caregiver";
	const isSuperAdmin = user?.platformRole === "SUPER_ADMIN";

	const handleDelete = async (logId) => {
		if (window.confirm("Are you sure you want to delete this log?")) {
			await deleteLog(logId);
		}
	};

	const canEditOrDelete = (log) => {
		if (isSuperAdmin || myRole === "parent") return true;
		return log.userId === user?.uid;
	};

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
						<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
							<span className="timeline-time">{formatTime(log.timestamp || log.time || Date.now())}</span>
							{canEditOrDelete(log) && (
								<div style={{ display: "flex", gap: "4px" }}>
									<button onClick={() => openModal(log.type, log)} style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", opacity: 0.6 }}>✏️</button>
									<button onClick={() => handleDelete(log.id)} style={{ background: "none", border: "none", fontSize: "14px", cursor: "pointer", opacity: 0.6 }}>🗑️</button>
								</div>
							)}
						</div>
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
						<div style={{ textAlign: "center", padding: "40px", color: "var(--text3)", fontWeight: 700 }}>
							No activities recorded yet.
						</div>
					)}
				</div>
			)}
		</div>
	);
}