const RECENT_INSIGHTS_KEY = "bably_recent_daily_insights";
const RECENT_LIMIT = 12;

const mlValue = (log) =>
	Number(log?.unit === "oz" ? log.amount * 30 : log.amount || 0);
const logTime = (log, fallback = Date.now()) =>
	log?.timestamp || log?.time || fallback;

const isSameDay = (timestamp, now) => {
	const day = new Date(timestamp);
	return (
		day.getFullYear() === now.getFullYear() &&
		day.getMonth() === now.getMonth() &&
		day.getDate() === now.getDate()
	);
};

const minutesSince = (timestamp, now) =>
	Math.max(0, Math.floor((now.getTime() - timestamp) / 60000));

const timeBandFor = (now) => {
	const hour = now.getHours();
	if (hour >= 0 && hour < 5) return "lateNight";
	if (hour >= 5 && hour < 12) return "morning";
	if (hour >= 12 && hour < 17) return "afternoon";
	if (hour >= 17 && hour < 21) return "evening";
	return "night";
};

const roleToneFor = ({ userParentType, displayRole }) => {
	if (displayRole === "Caregiver") return "caregiver";
	if (userParentType === "mother" || displayRole === "Mother") return "mother";
	if (userParentType === "father" || displayRole === "Father") return "father";
	return "parent";
};

const fill = (template, values) =>
	template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? "");

const readRecentInsights = () => {
	try {
		return JSON.parse(localStorage.getItem(RECENT_INSIGHTS_KEY) || "[]");
	} catch {
		return [];
	}
};

const rememberInsight = (message) => {
	try {
		const recent = readRecentInsights().filter((item) => item !== message);
		localStorage.setItem(
			RECENT_INSIGHTS_KEY,
			JSON.stringify([message, ...recent].slice(0, RECENT_LIMIT)),
		);
	} catch {
		// Local storage is optional; insights should still render without it.
	}
};

const pickInsight = (candidates) => {
	const recent = readRecentInsights();
	const sorted = [...candidates].sort((a, b) => b.weight - a.weight);
	const fresh = sorted.filter((candidate) => !recent.includes(candidate.message));
	const pool = fresh.length ? fresh : sorted;
	const topWeight = Math.max(...pool.map((candidate) => candidate.weight));
	const nearBest = pool.filter((candidate) => candidate.weight >= topWeight - 1);
	const selected = nearBest[Math.floor(Math.random() * nearBest.length)] || pool[0];
	rememberInsight(selected.message);
	return selected;
};

const timeTemplates = {
	morning: [
		"Good morning 🌸 Ready to start tracking {baby}'s day?",
		"Morning check-in: {baby}'s day is just getting started ✨",
		"Fresh start for {baby} today. A few taps will keep the day easy to follow 🌷",
		"Good morning. Let's keep {baby}'s rhythm gentle and clear today.",
	],
	afternoon: [
		"{baby}'s day is coming together nicely so far ✨",
		"Afternoon check-in: you have a helpful picture of {baby}'s day already.",
		"{baby}'s routine is taking shape today 🌸",
		"Nice steady tracking so far. The afternoon picture is getting clearer.",
	],
	evening: [
		"Evening check-in: {baby}'s day is filling in beautifully ✨",
		"You have captured a lot of {baby}'s care today. That really helps.",
		"{baby}'s evening rhythm is easier to see with today's logs.",
		"Looks like {baby} has had a full, cared-for day so far 🌙",
	],
	night: [
		"Looks like {baby} had a full day today 🌙",
		"Night check-in: today's care story for {baby} is nicely documented.",
		"{baby}'s day is winding down. You have kept a thoughtful record ✨",
		"A gentle wrap-up for {baby}'s day: the important moments are here.",
	],
	lateNight: [
		"Late night parenting mode activated 💕",
		"Quiet hours, steady care. You are still showing up for {baby} 🌙",
		"Late-night check-in: one small log at a time is enough.",
		"You are not behind. Late nights with {baby} count too 💕",
	],
};

const roleTemplates = {
	mother: [
		"You're carrying so much love through the details today, mama 💕",
		"Every log is another little act of care for {baby} 🌸",
		"You're doing beautifully. {baby}'s day is held with so much attention.",
		"A soft reminder: the care you are giving {baby} is enough.",
	],
	father: [
		"Good tracking today. {baby}'s routine is easier to understand with each log.",
		"Nice work keeping {baby}'s day organized and visible.",
		"You're building a clear care picture for {baby} today ✨",
		"Steady, practical care makes a real difference for {baby}.",
	],
	caregiver: [
		"Thank you for keeping {baby}'s day clear for the family 🌸",
		"Your updates make {baby}'s care easier for everyone to follow.",
		"Helpful tracking today. The family can see how {baby} is doing ✨",
		"Your care notes are making the day feel more connected.",
	],
	parent: [
		"You're doing a thoughtful job tracking {baby}'s day ✨",
		"Small updates add up to a clear picture for {baby}.",
		"Today's care record is becoming really useful.",
		"Nice work keeping {baby}'s routine visible.",
	],
};

const insightRules = [
	{
		id: "empty-day",
		when: ({ todayLogs }) => todayLogs.length === 0,
		weight: 9,
		templates: [
			"{timeMessage}",
			"No logs yet today. Start with the next feed, diaper, sleep, or note 🌸",
			"A quiet slate for {baby} today. Add the first moment when you're ready.",
			"Ready when you are. {baby}'s day can start with one simple log.",
		],
	},
	{
		id: "long-feed-gap",
		when: ({ lastMilkMinutes }) => lastMilkMinutes !== null && lastMilkMinutes >= 180,
		weight: 10,
		templates: [
			"It's been a while since {baby}'s last feed 🌸",
			"{baby}'s last feed was {lastFeedAgo} ago. A gentle check-in may be useful.",
			"Feeding interval is getting longer than usual. Worth keeping an eye on {baby}.",
			"{baby} may be nearing the next feed window after {lastFeedAgo}.",
			"Longer stretch since feeding today. A quick check can help keep things smooth.",
		],
	},
	{
		id: "recent-feed",
		when: ({ lastMilkMinutes }) => lastMilkMinutes !== null && lastMilkMinutes < 75,
		weight: 6,
		templates: [
			"{baby} had a recent feed. Nice and fresh in the log ✨",
			"Last feed was only {lastFeedAgo} ago. The care timeline is up to date.",
			"Feeding is nicely current for {baby} right now.",
			"Good timing. {baby}'s latest feed is easy to spot.",
		],
	},
	{
		id: "bottle-intake",
		when: ({ bottleTotal }) => bottleTotal >= 120,
		weight: 7,
		templates: [
			"{baby} has taken about {bottleTotal}ml by bottle today.",
			"Bottle intake is building steadily today: {bottleTotal}ml so far 🍼",
			"{baby}'s bottle feeds are well tracked today, with {bottleTotal}ml logged.",
			"Clear feeding picture today: {bottleTotal}ml in bottle logs so far.",
		],
	},
	{
		id: "many-feeds",
		when: ({ milkCount }) => milkCount >= 5,
		weight: 8,
		templates: [
			"Lots of feeding moments today. {baby}'s rhythm is well documented 🍼",
			"{milkCount} feeds logged today. That's a strong care record.",
			"Feeding tracking is very consistent today, with {milkCount} entries.",
			"You have a detailed feeding picture for {baby} today ✨",
		],
	},
	{
		id: "direct-feeds",
		when: ({ directSessions }) => directSessions >= 2,
		weight: 6,
		templates: [
			"{directSessions} direct feeding sessions logged today. Beautiful consistency 🌸",
			"Direct feeds are showing a steady rhythm for {baby} today.",
			"Nice direct-feeding record today: {directSessions} sessions so far.",
			"Those direct feeding logs are helping show {baby}'s pattern clearly.",
		],
	},
	{
		id: "pump-output",
		when: ({ pumpTotal }) => pumpTotal >= 60,
		weight: 8,
		templates: [
			"Amazing pumping consistency today 💕",
			"{pumpTotal}ml pumped today. That effort is absolutely worth noticing.",
			"Pumping is well tracked today, with {pumpSessions} session{pumpPlural} logged.",
			"Great pumping record today. Every session adds to the bigger picture ✨",
			"Pump output is looking steady today at {pumpTotal}ml.",
		],
	},
	{
		id: "sleep-good",
		when: ({ sleepSessions, sleepMinutes }) => sleepSessions >= 2 || sleepMinutes >= 120,
		weight: 8,
		templates: [
			"Looks like {baby} had restful sleep today 🌙",
			"Great sleep consistency today ✨",
			"{baby}'s sleep has a nice pattern today with {sleepSessions} session{sleepPlural}.",
			"Sleep tracking is looking steady. That helps you spot {baby}'s rhythm.",
			"{baby} has some solid rest logged today 🌙",
		],
	},
	{
		id: "diapers",
		when: ({ diaperCount }) => diaperCount >= 4,
		weight: 7,
		templates: [
			"{diaperCount} diaper changes today. Hydration and care are easy to review.",
			"Diaper tracking is active today, with {diaperCount} changes logged.",
			"{baby}'s diaper pattern is nicely visible today.",
			"Good diaper tracking today. Those details can be surprisingly useful.",
		],
	},
	{
		id: "high-activity",
		when: ({ todayLogs }) => todayLogs.length >= 8,
		weight: 9,
		templates: [
			"You've been doing an incredible job tracking {baby}'s day today ✨",
			"{todayCount} logs today. That's a rich, helpful picture of {baby}'s care.",
			"The tracking is very active today. {baby}'s routine is easy to follow.",
			"You have captured a lot of {baby}'s day. Future-you will appreciate this.",
			"Today's care record is full and thoughtful 🌸",
		],
	},
	{
		id: "growth-update",
		when: ({ growthToday }) => growthToday > 0,
		weight: 8,
		templates: [
			"Growth update saved today 🌱 {baby}'s progress is part of the story.",
			"{baby}'s growth record has a fresh update today ✨",
			"Nice work keeping growth details current for {baby}.",
			"Today's growth entry helps make {baby}'s longer-term picture clearer.",
		],
	},
	{
		id: "shared-care",
		when: ({ uniqueActors }) => uniqueActors >= 2,
		weight: 7,
		templates: [
			"Shared care is showing today. {baby} has updates from {uniqueActors} people ✨",
			"The family care picture is connected today, with multiple contributors.",
			"{baby}'s day has teamwork in it. The logs show shared support.",
			"Multiple caregivers have helped keep {baby}'s day visible.",
		],
	},
	{
		id: "steady-day",
		when: ({ todayLogs }) => todayLogs.length > 0,
		weight: 4,
		templates: [
			"{baby} is having a steady day so far 🌸",
			"The day is coming into focus one log at a time.",
			"Nice steady tracking today. {baby}'s routine is easier to read.",
			"Today's pattern is building gently and clearly.",
			"{timeMessage}",
			"{roleMessage}",
		],
	},
];

export const buildInsightContext = ({
	logs = [],
	growthLogs = [],
	activeBaby,
	userParentType,
	displayRole,
	now = new Date(),
}) => {
	const todayLogs = logs.filter((log) =>
		isSameDay(logTime(log, now.getTime()), now),
	);
	const todayGrowthLogs = growthLogs.filter((log) =>
		isSameDay(
			log.updatedAt || log.createdAt || log.timestamp || now.getTime(),
			now,
		),
	);
	const milkLogs = todayLogs.filter((log) => log.type === "milk");
	const bottleLogs = milkLogs.filter((log) => log.feedType === "bottle");
	const directLogs = milkLogs.filter((log) => log.feedType === "direct");
	const pumpLogs = todayLogs.filter((log) => log.type === "pump");
	const sleepLogs = todayLogs.filter((log) => log.type === "sleep");
	const diaperLogs = todayLogs.filter((log) => log.type === "diaper");
	const latestMilk = [...milkLogs].sort((a, b) => logTime(b) - logTime(a))[0];
	const latestMilkTime = latestMilk ? logTime(latestMilk) : null;
	const roleTone = roleToneFor({ userParentType, displayRole });
	const baby = activeBaby?.name?.split(" ")[0] || "Baby";
	const timeBand = timeBandFor(now);
	const bottleTotal = Math.round(
		bottleLogs.reduce((sum, log) => sum + mlValue(log), 0),
	);
	const pumpTotal = Math.round(
		pumpLogs.reduce((sum, log) => sum + mlValue(log), 0),
	);
	const sleepMinutes = sleepLogs.reduce(
		(sum, log) => sum + Number(log.duration || 0),
		0,
	);
	const actorIds = todayLogs.map((log) => log.userId).filter(Boolean);
	const uniqueActors = new Set(actorIds).size;

	const values = {
		baby,
		todayCount: todayLogs.length,
		milkCount: milkLogs.length,
		bottleTotal,
		directSessions: directLogs.length,
		pumpTotal,
		pumpSessions: pumpLogs.length,
		pumpPlural: pumpLogs.length === 1 ? "" : "s",
		sleepSessions: sleepLogs.length,
		sleepPlural: sleepLogs.length === 1 ? "" : "s",
		diaperCount: diaperLogs.length,
		growthToday: todayGrowthLogs.length,
		uniqueActors,
		lastFeedAgo:
			latestMilkTime === null
				? ""
				: `${Math.floor(minutesSince(latestMilkTime, now) / 60)}h ${minutesSince(
						latestMilkTime,
						now,
					) % 60}m`,
	};

	values.timeMessage = fill(
		timeTemplates[timeBand][
			Math.floor(Math.random() * timeTemplates[timeBand].length)
		],
		values
	);

	values.roleMessage = fill(
		roleTemplates[roleTone][
			Math.floor(Math.random() * roleTemplates[roleTone].length)
		],
		values
	);

	return {
		values,
		timeBand,
		roleTone,
		todayLogs,
		bottleTotal,
		directSessions: directLogs.length,
		milkCount: milkLogs.length,
		pumpTotal,
		pumpSessions: pumpLogs.length,
		sleepSessions: sleepLogs.length,
		sleepMinutes,
		diaperCount: diaperLogs.length,
		growthToday: todayGrowthLogs.length,
		uniqueActors,
		lastMilkMinutes:
			latestMilkTime === null ? null : minutesSince(latestMilkTime, now),
	};
};

export const generateDailyInsight = (context) => {
	const candidates = [];

	for (const rule of insightRules) {
		if (!rule.when(context)) continue;
		for (const template of rule.templates) {
			candidates.push({
				id: rule.id,
				weight: rule.weight,
				message: fill(template, context.values),
			});
		}
	}

	const roleMessages = roleTemplates[context.roleTone].map((template) => ({
		id: `role-${context.roleTone}`,
		weight: context.todayLogs.length >= 4 ? 6 : 3,
		message: fill(template, context.values),
	}));

	const candidatesWithRole = [...candidates, ...roleMessages].filter(
		(candidate) => candidate.message.trim(),
	);

	return pickInsight(candidatesWithRole);
};

export const generateDailySummaryLines = (context) => {
	const lines = [];
	const { values } = context;

	if (context.bottleTotal > 0) {
		lines.push(`Bottle intake: ${values.bottleTotal}ml`);
	}
	if (context.directSessions > 0) {
		lines.push(`Direct feeding sessions: ${values.directSessions}`);
	}
	if (context.pumpTotal > 0) {
		lines.push(`Pump output: ${values.pumpTotal}ml`);
	}
	if (context.sleepSessions > 0) {
		lines.push(`Sleep sessions logged: ${values.sleepSessions}`);
	}
	if (context.diaperCount > 0) {
		lines.push(`Diaper changes: ${values.diaperCount}`);
	}
	if (context.growthToday > 0) {
		lines.push(`Growth updates: ${values.growthToday}`);
	}

	return lines;
};
