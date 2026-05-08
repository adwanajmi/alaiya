import { useApp } from "../../contexts/AppContext";
import { formatTime } from "../../utils/dateUtils";

export default function Dashboard() {
	const { activeBaby, logs } = useApp();

	const getLogTime = (l) => l.timestamp || l.time || Date.now();
	const timeSince = (ts) => {
		const mins = Math.floor((Date.now() - ts) / 60000);
		if (mins < 60) return `${mins}m ago`;
		return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
	};

	const isToday = (ts) =>
		new Date(ts).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0);
	const todayLogs = logs.filter((l) => isToday(getLogTime(l)));

	const milkLogs = todayLogs.filter((l) => l.type === "milk");

	const bottleLogs = milkLogs.filter((l) => l.feedType === "bottle");
	const bottleTotal = bottleLogs.reduce(
		(acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount),
		0,
	);

	const directLogs = milkLogs.filter((l) => l.feedType === "direct");
	const directSessions = directLogs.length;

	const pumpLogs = todayLogs.filter((l) => l.type === "pump");
	const pumpTotal = pumpLogs.reduce(
		(acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount),
		0,
	);

	const sleepLogs = todayLogs.filter((l) => l.type === "sleep");
	const diapersToday = todayLogs.filter((l) => l.type === "diaper").length;

	const lastMilk = milkLogs[0];
	const lastDiaper = todayLogs.filter((l) => l.type === "diaper")[0];

	const babyName = activeBaby?.name?.split(" ")[0] || "Baby";

	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour >= 5 && hour < 12) return "Good morning 🌸";
		if (hour >= 12 && hour < 17) return "Good afternoon 🌤️";
		if (hour >= 17 && hour < 20) return "Good evening ✨";
		return "Good night 🌙";
	};

	const getInsight = () => {
		const greeting = getGreeting();
		if (todayLogs.length === 0)
			return `${greeting} Ready to track ${babyName}'s day?`;
		let insights = [];
		if (bottleTotal > 0)
			insights.push(
				`${babyName} has consumed ${Math.round(bottleTotal)}ml of milk today.`,
			);
		if (lastMilk && Date.now() - getLogTime(lastMilk) > 10800000)
			insights.push(
				`It's been over 3 hours since the last feed. Next one likely soon!`,
			);
		if (diapersToday > 5)
			insights.push(
				`Lots of diaper changes today (${diapersToday})! Keep the cream handy.`,
			);
		return insights.length > 0
			? insights[0]
			: `${greeting} ${babyName} is having a steady day.`;
	};

	const MetricCard = ({ title, value, subtext, color, icon }) => (
		<div
			style={{
				background: "var(--white)",
				padding: "16px",
				borderRadius: "var(--r)",
				boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: "8px",
			}}
		>
			<div
				style={{
					width: 48,
					height: 48,
					borderRadius: "14px",
					background: color,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "22px",
				}}
			>
				{icon}
			</div>
			<div>
				<div
					style={{
						fontSize: "20px",
						fontWeight: 900,
						color: "var(--text)",
						lineHeight: 1.1,
						marginBottom: 2,
					}}
				>
					{value}
				</div>
				<div
					style={{
						fontSize: "12px",
						fontWeight: 800,
						color: "var(--text3)",
						textTransform: "uppercase",
						letterSpacing: "0.5px",
					}}
				>
					{title}
				</div>
				{subtext && (
					<div
						style={{
							fontSize: "11px",
							fontWeight: 600,
							color: "var(--text2)",
							marginTop: 4,
						}}
					>
						{subtext}
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div
			className="fade-in"
			style={{ display: "flex", flexDirection: "column", gap: "24px" }}
		>
			<div
				style={{
					background:
						"linear-gradient(135deg, var(--rose-dark) 0%, var(--rose) 100%)",
					borderRadius: "var(--r)",
					padding: "24px",
					color: "white",
					boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "12px",
					}}
				>
					<span style={{ fontSize: "13px", fontWeight: 800, opacity: 0.9 }}>
						Daily Insight ✨
					</span>
					<span
						style={{
							fontSize: "12px",
							fontWeight: 700,
							background: "rgba(255,255,255,0.2)",
							padding: "4px 10px",
							borderRadius: "12px",
						}}
					>
						Today
					</span>
				</div>
				<h2 style={{ fontSize: "20px", fontWeight: 800, lineHeight: 1.3 }}>
					{getInsight()}
				</h2>
			</div>

			{todayLogs.length > 0 && new Date().getHours() >= 22 && (
				<div
					style={{
						background: "var(--white)",
						borderRadius: "var(--r)",
						padding: "20px",
						boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
						border: "1px solid var(--peach)",
					}}
				>
					<div
						style={{
							fontSize: "16px",
							fontWeight: 800,
							color: "var(--text)",
							marginBottom: "12px",
							display: "flex",
							alignItems: "center",
							gap: "8px",
						}}
					>
						<span>📝</span> End of Day Summary
					</div>
					<div
						style={{
							fontSize: "14px",
							color: "var(--text2)",
							lineHeight: 1.6,
							fontWeight: 700,
						}}
					>
						{babyName} had a great day today 🌸
						<br />
						{bottleTotal > 0 && (
							<>
								Bottle intake: {Math.round(bottleTotal)}ml
								<br />
							</>
						)}
						{directSessions > 0 && (
							<>
								Direct feeding sessions: {directSessions}
								<br />
							</>
						)}
						{pumpTotal > 0 && (
							<>
								Pump output: {Math.round(pumpTotal)}ml
								<br />
							</>
						)}
						{sleepLogs.length > 0 && (
							<>
								Sleep sessions logged: {sleepLogs.length}
								<br />
							</>
						)}
						{diapersToday > 0 && (
							<>
								Diaper changes: {diapersToday}
								<br />
							</>
						)}
						{lastMilk && (
							<>Last feed was at {formatTime(getLogTime(lastMilk))} ✨</>
						)}
					</div>
				</div>
			)}

			<div>
				<div
					className="section-title"
					style={{
						textAlign: "center",
						justifyContent: "center",
						marginBottom: 16,
					}}
				>
					Today's Overview
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "14px",
					}}
				>
					<MetricCard
						title="Bottle Volume"
						value={`${Math.round(bottleTotal)} ml`}
						subtext={
							bottleLogs[0]
								? `Last: ${timeSince(getLogTime(bottleLogs[0]))}`
								: "No bottles yet"
						}
						color="var(--color-milk)"
						icon="🍼"
					/>
					<MetricCard
						title="Direct Sessions"
						value={directSessions}
						subtext={
							directLogs[0]
								? `Last: ${timeSince(getLogTime(directLogs[0]))}`
								: "No direct feeds"
						}
						color="var(--peach)"
						icon="🤱"
					/>
					<MetricCard
						title="Diaper Changes"
						value={diapersToday}
						subtext={
							lastDiaper
								? `Last: ${timeSince(getLogTime(lastDiaper))}`
								: "None yet"
						}
						color="var(--color-diaper)"
						icon="🧷"
					/>
					<MetricCard
						title="Pump Output"
						value={`${Math.round(pumpTotal)} ml`}
						subtext={`${pumpLogs.length} sessions`}
						color="var(--color-pump)"
						icon="💧"
					/>
				</div>
			</div>
		</div>
	);
}
