import { useState } from "react";
import Loading from "../../components/ui/Loading";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";
import { formatTime } from "../../utils/dateUtils";

export default function Timeline() {
	const {
		logs,
		growthLogs,
		activeBaby,
		user,
		familyMembers,
		isSuperAdmin,
		openModal,
		deleteLog,
	} = useApp();
	const [filter, setFilter] = useState("today");

	const myRole =
		familyMembers.find((m) => m.userId === user?.uid)?.role || "caregiver";

	const handleDelete = async (logId) => {
		if (window.confirm("Are you sure you want to delete this log?")) {
			await deleteLog(logId);
		}
	};

	const canEditOrDelete = (log) => {
		if (isSuperAdmin || myRole === "parent") return true;
		return log.userId === user?.uid;
	};

	const timelineEvents = [
		...(logs || []).map((log) => ({
			...log,
			eventType: "care",
			sortTime: log.timestamp || log.time || 0,
		})),
		...(growthLogs || []).map((growth) => ({
			...growth,
			type: "growth",
			eventType: "growth",
			sortTime: growth.updatedAt || growth.createdAt || growth.timestamp || 0,
		})),
	].sort((a, b) => b.sortTime - a.sortTime);

	const getFilteredLogs = () => {
		if (!timelineEvents) return [];
		const now = new Date();
		const startOfToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		).getTime();
		const startOfYesterday = startOfToday - 86400000;
		const startOf7Days = startOfToday - 86400000 * 7;

		return timelineEvents.filter((log) => {
			const logTime = log.sortTime || log.timestamp || log.time || Date.now();
			if (filter === "today") return logTime >= startOfToday;
			if (filter === "yesterday")
				return logTime >= startOfYesterday && logTime < startOfToday;
			if (filter === "7days") return logTime >= startOf7Days;
			return true;
		});
	};

	const filteredLogs = getFilteredLogs();

	const TimelineCard = ({ log }) => {
		const config = ACTIVITY_CONFIG[log.type] || ACTIVITY_CONFIG.note;
		const member = familyMembers.find(
			(m) => m.userId === (log.updatedBy || log.userId),
		);
		const actor = member?.displayName?.split(" ")[0] || "Someone";
		return (
			<div className="timeline-card fade-in">
				<div className={`activity-avatar ${config.color}`}>{config.emoji}</div>
				<div className="timeline-card-content">
					<div className="timeline-header">
						<span className="timeline-title">
							{config.title}{" "}
							{log.type === "milk" &&
								(log.feedType === "direct" ? "(Direct)" : "(Bottle)")}
							{log.type === "growth" &&
								(log.updatedBy ? "(Updated)" : "(Measurement)")}
						</span>
						<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
							<span className="timeline-time">
								{formatTime(log.timestamp || log.time || Date.now())}
							</span>
							{log.eventType === "care" && canEditOrDelete(log) && (
								<div style={{ display: "flex", gap: "4px" }}>
									<button
										onClick={() => openModal(log.type, log)}
										style={{
											background: "none",
											border: "none",
											fontSize: "14px",
											cursor: "pointer",
											opacity: 0.6,
										}}
									>
										✏️
									</button>
									<button
										onClick={() => handleDelete(log.id)}
										style={{
											background: "none",
											border: "none",
											fontSize: "14px",
											cursor: "pointer",
											opacity: 0.6,
										}}
									>
										🗑️
									</button>
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
						{log.type === "sleep" && (
							<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
								<span style={{ fontWeight: 800, color: "var(--text)" }}>
									{log.isSleeping ? "Currently Sleeping 🌙" : `${log.sleepType || "Sleep"} • ${Math.floor(log.duration / 60)}h ${log.duration % 60}m`}
								</span>
								{log.startTime && log.endTime && (
									<span style={{ fontSize: "12px", color: "var(--text3)" }}>
										{formatTime(log.startTime)} → {formatTime(log.endTime)}
									</span>
								)}
								{log.isSleeping && log.startTime && (
									<span style={{ fontSize: "12px", color: "var(--text3)" }}>
										Started at {formatTime(log.startTime)}
									</span>
								)}
							</div>
						)}
						{log.type === "bath" && "Splish splash 🛁"}
						{log.type === "growth" && (
							<>
								{log.weight && <span>{log.weight} kg</span>}
								{log.weight && (log.height || log.hc) && " • "}
								{log.height && <span>{log.height} cm</span>}
								{log.height && log.hc && " • "}
								{log.hc && <span>{log.hc} cm HC</span>}
								<span style={{ color: "var(--text3)" }}> by {actor}</span>
							</>
						)}
					</div>
					{log.text && <div className="timeline-notes">"{log.text}"</div>}
					{log.notes && <div className="timeline-notes">"{log.notes}"</div>}
				</div>
			</div>
		);
	};

	return (
		<div className="fade-in">
			<div className="section-title">Timeline</div>

			<div
				style={{
					display: "flex",
					gap: "8px",
					overflowX: "auto",
					paddingBottom: "16px",
					scrollbarWidth: "none",
				}}
			>
				{[
					{ id: "today", label: "Today" },
					{ id: "yesterday", label: "Yesterday" },
					{ id: "7days", label: "Last 7 Days" },
					{ id: "all", label: "All History" },
				].map((f) => (
					<button
						key={f.id}
						onClick={() => setFilter(f.id)}
						style={{
							padding: "8px 16px",
							borderRadius: "20px",
							border: "none",
							background:
								filter === f.id ? "var(--rose-dark)" : "var(--cream2)",
							color: filter === f.id ? "white" : "var(--text2)",
							fontWeight: 800,
							fontSize: "13px",
							whiteSpace: "nowrap",
							cursor: "pointer",
						}}
					>
						{f.label}
					</button>
				))}
			</div>

			{!logs ? (
				<Loading
					inline
					text={`Preparing ${activeBaby?.name?.split(" ")[0]}'s timeline 🌸`}
				/>
			) : (
				<div className="timeline-cards">
					{filteredLogs.map((log) => (
						<TimelineCard key={`${log.eventType}-${log.id}`} log={log} />
					))}
					{filteredLogs.length === 0 && (
						<div
							style={{
								textAlign: "center",
								padding: "40px",
								color: "var(--text3)",
								fontWeight: 700,
							}}
						>
							No activities found.
						</div>
					)}
				</div>
			)}
		</div>
	);
}
