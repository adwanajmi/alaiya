import { useMemo } from "react";
import { useApp } from "../../contexts/AppContext";

export default function SmartReport({ dateRange = "weekly" }) {
	const { logs, activeBaby, familyMembers } = useApp();

	const reportData = useMemo(() => {
		const now = Date.now();
		const timeLimit = dateRange === "weekly" ? 7 * 86400000 : 86400000;
		const relevantLogs = logs.filter(
			(l) => now - (l.timestamp || l.time) <= timeLimit,
		);

		const bottleLogs = relevantLogs.filter(
			(l) => l.type === "milk" && l.feedType === "bottle",
		);
		const bottleTotal = bottleLogs.reduce(
			(acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount),
			0,
		);

		const directLogs = relevantLogs.filter(
			(l) => l.type === "milk" && l.feedType === "direct",
		);
		const pumpLogs = relevantLogs.filter((l) => l.type === "pump");
		const sleepLogs = relevantLogs.filter((l) => l.type === "sleep");
		const diapers = relevantLogs.filter((l) => l.type === "diaper");

		const contributors = {};
		relevantLogs.forEach((l) => {
			const uid = l.userId || l.updatedBy;
			if (uid) contributors[uid] = (contributors[uid] || 0) + 1;
		});

		const topContributorEntry = Object.entries(contributors).sort(
			(a, b) => b[1] - a[1],
		)[0];
		
		const heroName = topContributorEntry
			? familyMembers.find((m) => m.userId === topContributorEntry[0])?.displayName
			: "Family";

		return {
			bottleTotal: Math.round(bottleTotal),
			directCount: directLogs.length,
			pumpCount: pumpLogs.length,
			sleepCount: sleepLogs.length,
			diaperCount: diapers.length,
			hero: heroName,
		};
	}, [logs, dateRange, familyMembers]);

	const aiInsight =
		reportData.sleepCount >= 7
			? `${activeBaby?.name?.split(" ")[0] || "Baby"}'s sleep consistency is steady 🌙`
			: `Keep tracking to unlock personalized sleep and feeding insights ✨`;

	return (
		<div
			className="fade-in"
			style={{
				background: "var(--white)",
				borderRadius: "var(--r)",
				padding: 20,
				boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
				border: "1px solid var(--border)",
				marginBottom: 24,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>
					{dateRange === "weekly" ? "Weekly Recap" : "Daily Summary"}
				</div>
				<button
					style={{
						background: "var(--cream2)",
						border: "none",
						padding: "6px 12px",
						borderRadius: 12,
						fontWeight: 800,
						color: "var(--rose-dark)",
						cursor: "pointer"
					}}
				>
					Export PDF
				</button>
			</div>

			<div
				style={{
					background:
						"linear-gradient(135deg, var(--rose-dark) 0%, var(--rose) 100%)",
					borderRadius: 16,
					padding: 16,
					color: "white",
					marginBottom: 16,
				}}
			>
				<div
					style={{
						fontSize: 12,
						fontWeight: 800,
						opacity: 0.9,
						marginBottom: 4,
						textTransform: "uppercase",
					}}
				>
					Smart Insight
				</div>
				<div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4 }}>
					{aiInsight}
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: 12,
					marginBottom: 16,
				}}
			>
				<div
					style={{ background: "var(--cream2)", padding: 12, borderRadius: 12 }}
				>
					<div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 800 }}>
						Milk Intake
					</div>
					<div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>
						{reportData.bottleTotal} ml
					</div>
					<div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 700 }}>
						+ {reportData.directCount} direct feeds
					</div>
				</div>
				<div
					style={{ background: "var(--cream2)", padding: 12, borderRadius: 12 }}
				>
					<div style={{ fontSize: 12, color: "var(--text3)", fontWeight: 800 }}>
						Care Hero
					</div>
					<div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
						{reportData.hero}
					</div>
					<div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 700 }}>
						Most activities logged
					</div>
				</div>
			</div>

			<div style={{ display: "flex", gap: 8 }}>
				<div
					style={{
						flex: 1,
						textAlign: "center",
						padding: 10,
						border: "1px solid var(--border)",
						borderRadius: 12,
					}}
				>
					<div style={{ fontSize: 18, marginBottom: 4 }}>🧷</div>
					<div style={{ fontSize: 14, fontWeight: 900 }}>
						{reportData.diaperCount}
					</div>
				</div>
				<div
					style={{
						flex: 1,
						textAlign: "center",
						padding: 10,
						border: "1px solid var(--border)",
						borderRadius: 12,
					}}
				>
					<div style={{ fontSize: 18, marginBottom: 4 }}>😴</div>
					<div style={{ fontSize: 14, fontWeight: 900 }}>
						{reportData.sleepCount}
					</div>
				</div>
				<div
					style={{
						flex: 1,
						textAlign: "center",
						padding: 10,
						border: "1px solid var(--border)",
						borderRadius: 12,
					}}
				>
					<div style={{ fontSize: 18, marginBottom: 4 }}>💧</div>
					<div style={{ fontSize: 14, fontWeight: 900 }}>
						{reportData.pumpCount}
					</div>
				</div>
			</div>
		</div>
	);
}