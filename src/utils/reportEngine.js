const mlValue = (log) => Number(log?.unit === "oz" ? log.amount * 30 : log.amount || 0);
const logTime = (log) => log?.timestamp || log?.time || 0;
const dayKey = (timestamp) => new Date(timestamp).toISOString().split("T")[0];
const round = (value) => Math.round(value || 0);

const withinDays = (timestamp, days, now = new Date()) => {
	const start = new Date(now);
	start.setDate(start.getDate() - (days - 1));
	start.setHours(0, 0, 0, 0);
	return timestamp >= start.getTime() && timestamp <= now.getTime();
};

const buildCareTotals = (logs) => {
	const milkLogs = logs.filter((log) => log.type === "milk");
	const bottleLogs = milkLogs.filter((log) => log.feedType === "bottle");
	const directLogs = milkLogs.filter((log) => log.feedType === "direct");
	const pumpLogs = logs.filter((log) => log.type === "pump");
	const sleepLogs = logs.filter((log) => log.type === "sleep");
	const diaperLogs = logs.filter((log) => log.type === "diaper");
	const caregiverIds = new Set(logs.map((log) => log.userId).filter(Boolean));

	return {
		totalLogs: logs.length,
		bottleMl: round(bottleLogs.reduce((sum, log) => sum + mlValue(log), 0)),
		bottleFeeds: bottleLogs.length,
		directFeeds: directLogs.length,
		pumpMl: round(pumpLogs.reduce((sum, log) => sum + mlValue(log), 0)),
		pumpSessions: pumpLogs.length,
		sleepSessions: sleepLogs.length,
		sleepMinutes: sleepLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0),
		diapers: diaperLogs.length,
		caregiverCount: caregiverIds.size,
	};
};

const comparePercent = (current, previous) => {
	if (!previous && !current) return 0;
	if (!previous) return 100;
	return Math.round(((current - previous) / previous) * 100);
};

const makeDailyRows = (logs, days, now) => {
	const rows = Array.from({ length: days }).map((_, i) => {
		const date = new Date(now);
		date.setDate(date.getDate() - (days - 1 - i));
		const key = dayKey(date.getTime());
		const dayLogs = logs.filter((log) => dayKey(logTime(log)) === key);
		return {
			key,
			label: date.toLocaleDateString("en-US", { weekday: "short" }),
			dateLabel: date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			...buildCareTotals(dayLogs),
		};
	});
	return rows;
};

const buildHighlights = ({ babyName, weekly, previousWeekly, growthLogs }) => {
	const highlights = [];
	const bottleChange = comparePercent(weekly.bottleMl, previousWeekly.bottleMl);
	const sleepChange = comparePercent(weekly.sleepMinutes, previousWeekly.sleepMinutes);
	const pumpChange = comparePercent(weekly.pumpMl, previousWeekly.pumpMl);
	const latestGrowth = [...growthLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
	const previousGrowth = [...growthLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[1];

	if (weekly.totalLogs >= 20) {
		highlights.push(`Strong tracking week: ${weekly.totalLogs} care entries for ${babyName}.`);
	}
	if (weekly.bottleMl > 0) {
		highlights.push(`Bottle intake totaled ${weekly.bottleMl}ml this week.`);
	}
	if (Math.abs(bottleChange) >= 10) {
		highlights.push(
			`Bottle intake ${bottleChange > 0 ? "increased" : "decreased"} by ${Math.abs(
				bottleChange,
			)}% compared with the previous week.`,
		);
	}
	if (weekly.sleepMinutes > 0) {
		highlights.push(
			`${babyName} had about ${Math.round(weekly.sleepMinutes / 60)} hours of logged sleep this week.`,
		);
	}
	if (Math.abs(sleepChange) >= 10) {
		highlights.push(
			`Sleep consistency ${sleepChange > 0 ? "improved" : "shifted down"} by ${Math.abs(
				sleepChange,
			)}% this week.`,
		);
	}
	if (weekly.pumpMl > 0) {
		highlights.push(`Pump output totaled ${weekly.pumpMl}ml across ${weekly.pumpSessions} sessions.`);
	}
	if (Math.abs(pumpChange) >= 10) {
		highlights.push(
			`Pumping output ${pumpChange > 0 ? "increased" : "changed"} by ${Math.abs(
				pumpChange,
			)}% compared with last week.`,
		);
	}
	if (weekly.diapers >= 20) {
		highlights.push(`Diaper frequency looks well documented with ${weekly.diapers} changes.`);
	}
	if (weekly.caregiverCount >= 2) {
		highlights.push("Care was shared across multiple family members/caregivers.");
	}
	if (latestGrowth && previousGrowth) {
		const weightDelta = Number(latestGrowth.weight || 0) - Number(previousGrowth.weight || 0);
		if (weightDelta) {
			highlights.push(
				`Latest growth trend: weight changed by ${weightDelta.toFixed(2)}kg since the prior entry.`,
			);
		}
	}
	if (!highlights.length) {
		highlights.push(`Start logging a few more moments to unlock smarter patterns for ${babyName}.`);
	}
	return highlights.slice(0, 6);
};

export const buildCareReports = ({
	logs = [],
	growthLogs = [],
	activeBaby,
	familyMembers = [],
	now = new Date(),
}) => {
	const babyName = activeBaby?.name?.split(" ")[0] || "Baby";
	const todayKey = dayKey(now.getTime());
	const todayLogs = logs.filter((log) => dayKey(logTime(log)) === todayKey);
	const weeklyLogs = logs.filter((log) => withinDays(logTime(log), 7, now));
	const previousWeeklyLogs = logs.filter((log) => {
		const timestamp = logTime(log);
		const end = new Date(now);
		end.setDate(end.getDate() - 7);
		end.setHours(23, 59, 59, 999);
		const start = new Date(end);
		start.setDate(start.getDate() - 6);
		start.setHours(0, 0, 0, 0);
		return timestamp >= start.getTime() && timestamp <= end.getTime();
	});
	const monthlyLogs = logs.filter((log) => withinDays(logTime(log), 30, now));
	const monthlyGrowth = growthLogs.filter((log) => withinDays(log.timestamp || 0, 30, now));
	const dailyRows = makeDailyRows(logs, 7, now);
	const weekly = buildCareTotals(weeklyLogs);
	const previousWeekly = buildCareTotals(previousWeeklyLogs);
	const monthly = buildCareTotals(monthlyLogs);
	const caregiverMap = familyMembers.reduce((map, member) => {
		map[member.userId] = member.displayName?.split(" ")[0] || member.email || "Caregiver";
		return map;
	}, {});
	const caregiverRows = Object.entries(
		weeklyLogs.reduce((acc, log) => {
			const key = log.userId || "unknown";
			acc[key] = (acc[key] || 0) + 1;
			return acc;
		}, {}),
	).map(([userId, count]) => ({
		userId,
		name: caregiverMap[userId] || "Someone",
		count,
	}));

	const highlights = buildHighlights({
		babyName,
		weekly,
		previousWeekly,
		growthLogs,
	});

	return {
		babyName,
		generatedAt: now.getTime(),
		daily: {
			title: "Daily Summary Report",
			period: "Today",
			...buildCareTotals(todayLogs),
		},
		weekly: {
			title: "Weekly Baby Care Report",
			period: "Last 7 days",
			...weekly,
			rows: dailyRows,
			highlights,
		},
		monthly: {
			title: "Monthly Growth Report",
			period: "Last 30 days",
			...monthly,
			growthEntries: monthlyGrowth.length,
		},
		caregivers: caregiverRows,
		benefits: [
			"Understand feeding patterns and intervals without relying on memory.",
			"Spot sleep irregularities before they become stressful.",
			"Monitor pumping and milk supply trends over time.",
			"Prepare concise summaries for pediatrician visits.",
			"Share care context with a spouse, family member, or caregiver.",
			"Reduce mental load by turning logs into readable summaries.",
			"Improve routine consistency with weekly trend visibility.",
		],
		futureAiHooks: {
			observations: highlights,
			metrics: { weekly, previousWeekly, monthly },
			timeSeries: dailyRows,
			recommendationTargets: ["feeding", "sleep", "pump", "growth", "diaper"],
		},
	};
};

export const formatShareableReport = (report) => [
	`${report.weekly.title} for ${report.babyName}`,
	`${report.weekly.period}`,
	"",
	`Bottle: ${report.weekly.bottleMl}ml (${report.weekly.bottleFeeds} feeds)`,
	`Direct feeds: ${report.weekly.directFeeds}`,
	`Pump: ${report.weekly.pumpMl}ml (${report.weekly.pumpSessions} sessions)`,
	`Sleep: ${Math.round(report.weekly.sleepMinutes / 60)}h (${report.weekly.sleepSessions} sessions)`,
	`Diapers: ${report.weekly.diapers}`,
	`Logs: ${report.weekly.totalLogs}`,
	"",
	"Smart Insights:",
	...report.weekly.highlights.map((line) => `- ${line}`),
].join("\n");
