import { useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useApp } from "../../contexts/AppContext";
import {
	buildCareReports,
	formatShareableReport,
} from "../../utils/reportEngine";

const getDateInputValue = (timestamp) => {
	if (!timestamp) return new Date().toISOString().split("T")[0];
	return new Date(timestamp).toISOString().split("T")[0];
};

const getMeasurementTimestamp = (dateValue) =>
	new Date(`${dateValue}T12:00:00`).getTime();

const emptyGrowthForm = () => ({
	measureDate: new Date().toISOString().split("T")[0],
	weight: "",
	height: "",
	hc: "",
	notes: "",
});

export default function Stats() {
	const {
		logs,
		growthLogs,
		addGrowthLog,
		updateGrowthLog,
		deleteGrowthLog,
		activeBaby,
		familyMembers,
		userRole,
		isSuperAdmin,
	} = useApp();
	const [activeSubTab, setActiveSubTab] = useState("activity");
	const [reportCopied, setReportCopied] = useState(false);
	const [growthForm, setGrowthForm] = useState(emptyGrowthForm);
	const [selectedGrowth, setSelectedGrowth] = useState(null);
	const [editForm, setEditForm] = useState(emptyGrowthForm);
	const [isSavingGrowth, setIsSavingGrowth] = useState(false);
	const [growthError, setGrowthError] = useState("");
	const [undoGrowth, setUndoGrowth] = useState(null);

	const canEditGrowth =
		userRole === "caregiver" ||
		userRole === "parent" ||
		isSuperAdmin;
	const canDeleteGrowth = userRole === "parent" || isSuperAdmin;
	const reports = buildCareReports({
		logs,
		growthLogs,
		activeBaby,
		familyMembers,
	});

	const last7Days = [...Array(7)].map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d.toISOString().split("T")[0];
	});

	const chartData = last7Days.map((dateStr) => {
		const dayLogs = logs.filter((l) => {
			const logDate = new Date(l.timestamp || l.time)
				.toISOString()
				.split("T")[0];
			return logDate === dateStr && l.type === "milk" && l.feedType === "bottle";
		});
		const totalMl = dayLogs.reduce(
			(acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount),
			0,
		);

		return {
			name: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }),
			milk: Math.round(totalMl),
		};
	});

	const weeklyCareData = last7Days.map((dateStr) => {
		const dayLogs = logs.filter((l) => {
			const logDate = new Date(l.timestamp || l.time)
				.toISOString()
				.split("T")[0];
			return logDate === dateStr;
		});
		const bottleLogs = dayLogs.filter(
			(l) => l.type === "milk" && l.feedType === "bottle",
		);
		const directLogs = dayLogs.filter(
			(l) => l.type === "milk" && l.feedType === "direct",
		);
		const pumpLogs = dayLogs.filter((l) => l.type === "pump");
		const sleepLogs = dayLogs.filter((l) => l.type === "sleep");

		return {
			name: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }),
			bottleMl: Math.round(
				bottleLogs.reduce(
					(acc, curr) =>
						acc + (curr.unit === "oz" ? curr.amount * 30 : Number(curr.amount || 0)),
					0,
				),
			),
			directSessions: directLogs.length,
			pumpMl: Math.round(
				pumpLogs.reduce(
					(acc, curr) =>
						acc + (curr.unit === "oz" ? curr.amount * 30 : Number(curr.amount || 0)),
					0,
				),
			),
			pumpSessions: pumpLogs.length,
			diapers: dayLogs.filter((l) => l.type === "diaper").length,
			sleepMinutes: sleepLogs.reduce(
				(acc, curr) => acc + Number(curr.duration || 0),
				0,
			),
			sleepSessions: sleepLogs.length,
		};
	});

	const weeklyTotals = weeklyCareData.reduce(
		(acc, day) => ({
			bottleMl: acc.bottleMl + day.bottleMl,
			directSessions: acc.directSessions + day.directSessions,
			pumpMl: acc.pumpMl + day.pumpMl,
			pumpSessions: acc.pumpSessions + day.pumpSessions,
			diapers: acc.diapers + day.diapers,
			sleepMinutes: acc.sleepMinutes + day.sleepMinutes,
			sleepSessions: acc.sleepSessions + day.sleepSessions,
		}),
		{
			bottleMl: 0,
			directSessions: 0,
			pumpMl: 0,
			pumpSessions: 0,
			diapers: 0,
			sleepMinutes: 0,
			sleepSessions: 0,
		},
	);

	const growthChartData = [...growthLogs].reverse().map((g) => ({
		id: g.id,
		name: new Date(g.timestamp).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		weight: parseFloat(g.weight) || null,
	}));

	const updateGrowthForm = (field, value) => {
		setGrowthForm((prev) => ({ ...prev, [field]: value }));
	};

	const updateEditForm = (field, value) => {
		setEditForm((prev) => ({ ...prev, [field]: value }));
	};

	const openGrowthDetail = (log) => {
		setGrowthError("");
		setSelectedGrowth(log);
		setEditForm({
			measureDate: getDateInputValue(log.timestamp),
			weight: log.weight || "",
			height: log.height || "",
			hc: log.hc || "",
			notes: log.notes || "",
		});
	};

	const closeGrowthDetail = () => {
		if (isSavingGrowth) return;
		setSelectedGrowth(null);
		setGrowthError("");
	};

	const handleAddGrowth = async () => {
		if (!growthForm.weight && !growthForm.height && !growthForm.hc) return;

		setGrowthError("");
		setIsSavingGrowth(true);
		try {
			await addGrowthLog({
				weight: growthForm.weight,
				height: growthForm.height,
				hc: growthForm.hc,
				notes: growthForm.notes,
				timestamp: getMeasurementTimestamp(growthForm.measureDate),
			});
			setGrowthForm(emptyGrowthForm());
		} catch (error) {
			console.error("Failed to save growth measurement", error);
			setGrowthError(error?.message || "Could not save measurement.");
		} finally {
			setIsSavingGrowth(false);
		}
	};

	const handleUpdateGrowth = async () => {
		if (!selectedGrowth || !canEditGrowth) return;
		if (!editForm.weight && !editForm.height && !editForm.hc) {
			setGrowthError("Add at least one measurement value.");
			return;
		}

		setIsSavingGrowth(true);
		setGrowthError("");
		try {
			await updateGrowthLog(selectedGrowth.id, {
				weight: editForm.weight,
				height: editForm.height,
				hc: editForm.hc,
				notes: editForm.notes,
				timestamp: getMeasurementTimestamp(editForm.measureDate),
			});
			closeGrowthDetail();
		} catch (error) {
			console.error("Failed to update growth measurement", error);
			setGrowthError(error?.message || "Could not update measurement.");
		} finally {
			setIsSavingGrowth(false);
		}
	};

	const handleDeleteGrowth = async () => {
		if (!selectedGrowth || !canDeleteGrowth) return;
		if (!window.confirm("Are you sure you want to delete this growth entry?")) {
			return;
		}

		const deletedEntry = selectedGrowth;
		setIsSavingGrowth(true);
		setGrowthError("");
		try {
			await deleteGrowthLog(selectedGrowth.id);
			setUndoGrowth(deletedEntry);
			closeGrowthDetail();
		} catch (error) {
			console.error("Failed to delete growth measurement", error);
			setGrowthError(error?.message || "Could not delete measurement.");
		} finally {
			setIsSavingGrowth(false);
		}
	};

	const handleUndoDelete = async () => {
		if (!undoGrowth) return;

		const restored = undoGrowth;
		setUndoGrowth(null);
		try {
			await addGrowthLog({
				weight: restored.weight || "",
				height: restored.height || "",
				hc: restored.hc || "",
				notes: restored.notes || "",
				timestamp: restored.timestamp,
			});
		} catch (error) {
			console.error("Failed to restore growth measurement", error);
			setGrowthError(error?.message || "Could not restore measurement.");
		}
	};

	const handleCopyReport = async () => {
		const text = formatShareableReport(reports);
		try {
			await navigator.clipboard.writeText(text);
			setReportCopied(true);
			window.setTimeout(() => setReportCopied(false), 2500);
		} catch (error) {
			console.error("Failed to copy report", error);
			alert(text);
		}
	};

	return (
		<div className="fade-in">
			<div
				style={{
					display: "flex",
					background: "var(--cream2)",
					borderRadius: "var(--r)",
					padding: 4,
					marginBottom: 24,
				}}
			>
				<button
					onClick={() => setActiveSubTab("activity")}
					style={{
						flex: 1,
						padding: "10px",
						border: "none",
						borderRadius: "var(--r2)",
						fontWeight: 800,
						background:
							activeSubTab === "activity" ? "var(--white)" : "transparent",
						color:
							activeSubTab === "activity" ? "var(--rose-dark)" : "var(--text3)",
						boxShadow:
							activeSubTab === "activity"
								? "0 1px 4px rgba(0,0,0,0.08)"
								: "none",
					}}
				>
					Weekly Trends
				</button>
				<button
					onClick={() => setActiveSubTab("reports")}
					style={{
						flex: 1,
						padding: "10px",
						border: "none",
						borderRadius: "var(--r2)",
						fontWeight: 800,
						background:
							activeSubTab === "reports" ? "var(--white)" : "transparent",
						color:
							activeSubTab === "reports" ? "var(--rose-dark)" : "var(--text3)",
						boxShadow:
							activeSubTab === "reports"
								? "0 1px 4px rgba(0,0,0,0.08)"
								: "none",
					}}
				>
					Reports
				</button>
				<button
					onClick={() => setActiveSubTab("growth")}
					style={{
						flex: 1,
						padding: "10px",
						border: "none",
						borderRadius: "var(--r2)",
						fontWeight: 800,
						background:
							activeSubTab === "growth" ? "var(--white)" : "transparent",
						color:
							activeSubTab === "growth" ? "var(--rose-dark)" : "var(--text3)",
						boxShadow:
							activeSubTab === "growth"
								? "0 1px 4px rgba(0,0,0,0.08)"
								: "none",
					}}
				>
					Growth Tracker
				</button>
			</div>

			{activeSubTab === "activity" && (
				<div className="fade-in">
					<div className="section-title">Weekly Care Trends</div>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 12,
							marginBottom: 24,
						}}
					>
						{[
							{ label: "Bottle Intake", value: `${weeklyTotals.bottleMl} ml` },
							{ label: "Direct Feeds", value: weeklyTotals.directSessions },
							{ label: "Diapers", value: weeklyTotals.diapers },
							{
								label: weeklyTotals.sleepMinutes
									? "Sleep Duration"
									: "Sleep Sessions",
								value: weeklyTotals.sleepMinutes
									? `${Math.round(weeklyTotals.sleepMinutes / 60)}h`
									: weeklyTotals.sleepSessions,
							},
							...(canDeleteGrowth
								? [
										{
											label: "Pump Output",
											value: `${weeklyTotals.pumpMl} ml`,
										},
										{
											label: "Pump Sessions",
											value: weeklyTotals.pumpSessions,
										},
									]
								: []),
						].map((metric) => (
							<div
								key={metric.label}
								style={{
									background: "var(--white)",
									borderRadius: "var(--r2)",
									padding: 14,
									boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
									border: "1px solid var(--border)",
								}}
							>
								<div
									style={{
										fontSize: 18,
										fontWeight: 900,
										color: "var(--text)",
									}}
								>
									{metric.value}
								</div>
								<div
									style={{
										fontSize: 11,
										fontWeight: 800,
										color: "var(--text3)",
										textTransform: "uppercase",
									}}
								>
									{metric.label}
								</div>
							</div>
						))}
					</div>

					<div className="section-title">Bottle Intake</div>
					<div
						style={{
							background: "var(--white)",
							padding: "20px 10px 20px 0",
							borderRadius: "var(--r)",
							boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
							height: 300,
							marginBottom: 24,
						}}
					>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#ffbba6" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#ffbba6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#ede8e1"
								/>
								<XAxis
									dataKey="name"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 12, fill: "#99958c" }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 12, fill: "#99958c" }}
									dx={-10}
								/>
								<Tooltip
									cursor={{
										stroke: "var(--rose)",
										strokeWidth: 2,
										strokeDasharray: "3 3",
									}}
									contentStyle={{
										borderRadius: "12px",
										border: "none",
										boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									}}
								/>
								<Area
									type="monotone"
									dataKey="milk"
									stroke="#ff9a85"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#colorMilk)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					<div className="section-title">Daily Care Activity</div>
					<div
						style={{
							background: "var(--white)",
							padding: "20px 10px 20px 0",
							borderRadius: "var(--r)",
							boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
							height: 300,
							marginBottom: 24,
						}}
					>
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={weeklyCareData}>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
									stroke="#ede8e1"
								/>
								<XAxis
									dataKey="name"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 12, fill: "#99958c" }}
									dy={10}
								/>
								<YAxis
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 12, fill: "#99958c" }}
									dx={-10}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: "12px",
										border: "none",
										boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
									}}
								/>
								<Line
									type="monotone"
									dataKey="directSessions"
									name="Direct feeds"
									stroke="#cc5b43"
									strokeWidth={3}
								/>
								<Line
									type="monotone"
									dataKey="diapers"
									name="Diapers"
									stroke="#d1a600"
									strokeWidth={3}
								/>
								<Line
									type="monotone"
									dataKey="sleepSessions"
									name="Sleep sessions"
									stroke="#7a8ee8"
									strokeWidth={3}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>

					{weeklyTotals.sleepMinutes > 0 && (
						<>
							<div className="section-title">Sleep Duration</div>
							<div
								style={{
									background: "var(--white)",
									padding: "20px 10px 20px 0",
									borderRadius: "var(--r)",
									boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
									height: 250,
									marginBottom: 24,
								}}
							>
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={weeklyCareData}>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="#ede8e1"
										/>
										<XAxis dataKey="name" axisLine={false} tickLine={false} />
										<YAxis axisLine={false} tickLine={false} />
										<Tooltip />
										<Area
											type="monotone"
											dataKey="sleepMinutes"
											name="Sleep minutes"
											stroke="#7a8ee8"
											fill="#c6d0ff"
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</>
					)}

					{canDeleteGrowth && (
						<>
							<div className="section-title">Pumping Output</div>
							<div
								style={{
									background: "var(--white)",
									padding: "20px 10px 20px 0",
									borderRadius: "var(--r)",
									boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
									height: 250,
									marginBottom: 24,
								}}
							>
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={weeklyCareData}>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="#ede8e1"
										/>
										<XAxis dataKey="name" axisLine={false} tickLine={false} />
										<YAxis axisLine={false} tickLine={false} />
										<Tooltip />
										<Line
											type="monotone"
											dataKey="pumpMl"
											name="Pump output (ml)"
											stroke="#b35fa3"
											strokeWidth={3}
										/>
										<Line
											type="monotone"
											dataKey="pumpSessions"
											name="Pump sessions"
											stroke="#6f8f7a"
											strokeWidth={3}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</>
					)}
				</div>
			)}

			{activeSubTab === "reports" && (
				<div className="fade-in">
					<div className="section-title">Care Reports</div>
					<div
						style={{
							background: "var(--white)",
							borderRadius: "var(--r)",
							padding: 20,
							border: "1px solid var(--border)",
							boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
							marginBottom: 20,
						}}
					>
						<div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
							{reports.weekly.title}
						</div>
						<div
							style={{
								fontSize: 13,
								color: "var(--text2)",
								fontWeight: 800,
								marginBottom: 16,
							}}
						>
							{reports.babyName} • {reports.weekly.period}
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
								gap: 10,
								marginBottom: 18,
							}}
						>
							{[
								["Bottle", `${reports.weekly.bottleMl} ml`],
								["Direct feeds", reports.weekly.directFeeds],
								["Pump", `${reports.weekly.pumpMl} ml`],
								["Sleep", `${Math.round(reports.weekly.sleepMinutes / 60)}h`],
								["Diapers", reports.weekly.diapers],
								["Care logs", reports.weekly.totalLogs],
							].map(([label, value]) => (
								<div
									key={label}
									style={{
										background: "var(--cream2)",
										borderRadius: 12,
										padding: 12,
									}}
								>
									<div style={{ fontSize: 18, fontWeight: 900 }}>{value}</div>
									<div
										style={{
											fontSize: 11,
											fontWeight: 800,
											color: "var(--text3)",
											textTransform: "uppercase",
										}}
									>
										{label}
									</div>
								</div>
							))}
						</div>
						<button className="submit-btn" onClick={handleCopyReport}>
							{reportCopied ? "Copied Report" : "Copy Shareable Summary"}
						</button>
					</div>

					<div className="section-title">Smart Insights</div>
					<div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
						{reports.weekly.highlights.map((highlight) => (
							<div
								key={highlight}
								style={{
									background: "var(--white)",
									borderRadius: 14,
									padding: 14,
									border: "1px solid var(--border)",
									fontWeight: 800,
									color: "var(--text2)",
								}}
							>
								{highlight}
							</div>
						))}
					</div>

					<div className="section-title">Report Types</div>
					<div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
						{[
							[
								"Daily Summary Report",
								"Quick recap of today’s feeds, sleep, diapers, pumping, and highlights.",
							],
							[
								"Weekly Baby Care Report",
								"Best for spotting routines, feeding intervals, sleep shifts, and caregiver coverage.",
							],
							[
								"Monthly Growth Report",
								"Useful for pediatrician visits and tracking weight/height/head-circumference changes.",
							],
							[
								"Feeding Trend Report",
								"Helps compare bottle intake, direct feeds, and feeding frequency over time.",
							],
							[
								"Pumping Consistency Report",
								"Helps monitor supply trends, session count, and weekly output changes.",
							],
							[
								"Caregiver Activity Summary",
								"Shows who contributed care logs and helps families stay aligned.",
							],
						].map(([title, body]) => (
							<div
								key={title}
								style={{
									background: "var(--white)",
									borderRadius: 14,
									padding: 16,
									border: "1px solid var(--border)",
								}}
							>
								<div style={{ fontWeight: 900, marginBottom: 4 }}>{title}</div>
								<div
									style={{
										color: "var(--text2)",
										fontSize: 13,
										fontWeight: 700,
										lineHeight: 1.45,
									}}
								>
									{body}
								</div>
							</div>
						))}
					</div>

					<div className="section-title">Why Reports Help</div>
					<div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
						{reports.benefits.map((benefit) => (
							<div
								key={benefit}
								style={{
									background: "var(--cream2)",
									borderRadius: 12,
									padding: "10px 12px",
									fontSize: 13,
									fontWeight: 800,
									color: "var(--text2)",
								}}
							>
								{benefit}
							</div>
						))}
					</div>

					<div className="section-title">Future AI Reports</div>
					<div
						style={{
							background: "var(--white)",
							borderRadius: "var(--r)",
							padding: 16,
							border: "1px solid var(--border)",
							fontSize: 13,
							fontWeight: 700,
							color: "var(--text2)",
							lineHeight: 1.55,
						}}
					>
						Report data is now structured for AI-generated observations,
						predictive feeding/sleep suggestions, trend anomaly detection,
						weekly summaries, printable pediatrician reports, and email/PDF
						exports.
					</div>
				</div>
			)}

			{activeSubTab === "growth" && (
				<div className="fade-in">
					<div
						style={{
							background: "var(--white)",
							padding: "20px",
							borderRadius: "var(--r)",
							boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
							marginBottom: 24,
						}}
					>
						<div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
							Log New Measurement
						</div>

						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								marginBottom: 16,
							}}
						>
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Measurement Date</label>
								<input
									type="date"
									value={growthForm.measureDate}
									onChange={(e) =>
										updateGrowthForm("measureDate", e.target.value)
									}
									className="form-input"
								/>
							</div>

							<div style={{ display: "flex", gap: "12px" }}>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Weight (kg)</label>
									<input
										type="number"
										step="0.01"
										value={growthForm.weight}
										onChange={(e) => updateGrowthForm("weight", e.target.value)}
										className="form-input"
										placeholder="e.g. 4.2"
									/>
								</div>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Height (cm)</label>
									<input
										type="number"
										step="0.1"
										value={growthForm.height}
										onChange={(e) => updateGrowthForm("height", e.target.value)}
										className="form-input"
										placeholder="e.g. 52"
									/>
								</div>
							</div>

							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Head Circumference (cm)</label>
								<input
									type="number"
									step="0.1"
									value={growthForm.hc}
									onChange={(e) => updateGrowthForm("hc", e.target.value)}
									className="form-input"
									placeholder="e.g. 35"
								/>
							</div>

							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Notes (Optional)</label>
								<input
									type="text"
									value={growthForm.notes}
									onChange={(e) => updateGrowthForm("notes", e.target.value)}
									className="form-input"
									placeholder="e.g. 2 Month Checkup"
								/>
							</div>
						</div>

						<button
							className="submit-btn"
							onClick={handleAddGrowth}
							disabled={
								isSavingGrowth ||
								(!growthForm.weight && !growthForm.height && !growthForm.hc)
							}
							style={{
								opacity:
									isSavingGrowth ||
									(!growthForm.weight && !growthForm.height && !growthForm.hc)
										? 0.5
										: 1,
							}}
						>
							{isSavingGrowth ? "Saving..." : "Save Measurement"}
						</button>
					</div>

					{growthChartData.filter((d) => d.weight).length > 1 && (
						<>
							<div className="section-title">Weight Progression</div>
							<div
								style={{
									background: "var(--white)",
									padding: "20px 10px 20px 0",
									borderRadius: "var(--r)",
									boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
									height: 250,
									marginBottom: 24,
								}}
							>
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={growthChartData.filter((d) => d.weight)}>
										<CartesianGrid
											strokeDasharray="3 3"
											vertical={false}
											stroke="#ede8e1"
										/>
										<XAxis
											dataKey="name"
											axisLine={false}
											tickLine={false}
											tick={{ fontSize: 12, fill: "#99958c" }}
											dy={10}
										/>
										<YAxis
											domain={["auto", "auto"]}
											axisLine={false}
											tickLine={false}
											tick={{ fontSize: 12, fill: "#99958c" }}
											dx={-10}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: "12px",
												border: "none",
												boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											}}
										/>
										<Line
											type="monotone"
											dataKey="weight"
											stroke="#1d9e75"
											strokeWidth={3}
											dot={{ r: 5, fill: "#1d9e75" }}
											activeDot={{
												r: 8,
												onClick: (_, payload) => {
													const log = growthLogs.find(
														(g) => g.id === payload?.payload?.id,
													);
													if (log) openGrowthDetail(log);
												},
											}}
										/>
									</LineChart>
								</ResponsiveContainer>
							</div>
						</>
					)}

					<div className="section-title">History</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{growthLogs.map((log) => (
							<button
								key={log.id}
								onClick={() => openGrowthDetail(log)}
								style={{
									background: "var(--white)",
									padding: "16px",
									borderRadius: "var(--r2)",
									display: "flex",
									flexDirection: "column",
									gap: "8px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
									border: "1px solid var(--border)",
									textAlign: "left",
									fontFamily: "inherit",
									cursor: "pointer",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										gap: 12,
									}}
								>
									<div style={{ fontWeight: 800, color: "var(--text)" }}>
										{new Date(log.timestamp).toLocaleDateString("en-US", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</div>
									<span
										style={{
											fontSize: 12,
											fontWeight: 800,
											color: "var(--rose-dark)",
										}}
									>
										View
									</span>
								</div>

								<div
									style={{
										display: "flex",
										flexWrap: "wrap",
										gap: "10px 16px",
										color: "var(--text2)",
										fontWeight: 700,
										fontSize: "14px",
									}}
								>
									{log.weight && <span>{log.weight} kg</span>}
									{log.height && <span>{log.height} cm</span>}
									{log.hc && <span>{log.hc} cm (HC)</span>}
								</div>

								{log.notes && (
									<div
										style={{
											fontSize: "13px",
											color: "var(--text3)",
											fontStyle: "italic",
											background: "var(--cream2)",
											padding: "8px 12px",
											borderRadius: "8px",
											marginTop: "4px",
										}}
									>
										"{log.notes}"
									</div>
								)}
							</button>
						))}
						{growthLogs.length === 0 && (
							<div
								style={{
									textAlign: "center",
									padding: "20px",
									color: "var(--text3)",
									fontWeight: 600,
								}}
							>
								No measurements logged yet.
							</div>
						)}
					</div>
				</div>
			)}

			{selectedGrowth && (
				<div
					className="modal-overlay"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget) closeGrowthDetail();
					}}
				>
					<div className="modal">
						<div className="modal-handle"></div>
						<div className="modal-title">Growth Entry</div>

						{!canEditGrowth && (
							<div
								style={{
									background: "var(--cream2)",
									borderRadius: "var(--r2)",
									padding: "12px",
									fontSize: 13,
									fontWeight: 700,
									color: "var(--text2)",
									marginBottom: 16,
									textAlign: "center",
								}}
							>
								Only family members with growth permissions can edit entries.
							</div>
						)}

						<div style={{ display: "grid", gap: 12 }}>
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Measurement Date</label>
								<input
									type="date"
									value={editForm.measureDate}
									onChange={(e) => updateEditForm("measureDate", e.target.value)}
									className="form-input"
									disabled={!canEditGrowth || isSavingGrowth}
								/>
							</div>
							<div style={{ display: "flex", gap: "12px" }}>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Weight (kg)</label>
									<input
										type="number"
										step="0.01"
										value={editForm.weight}
										onChange={(e) => updateEditForm("weight", e.target.value)}
										className="form-input"
										disabled={!canEditGrowth || isSavingGrowth}
									/>
								</div>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Height (cm)</label>
									<input
										type="number"
										step="0.1"
										value={editForm.height}
										onChange={(e) => updateEditForm("height", e.target.value)}
										className="form-input"
										disabled={!canEditGrowth || isSavingGrowth}
									/>
								</div>
							</div>
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Head Circumference (cm)</label>
								<input
									type="number"
									step="0.1"
									value={editForm.hc}
									onChange={(e) => updateEditForm("hc", e.target.value)}
									className="form-input"
									disabled={!canEditGrowth || isSavingGrowth}
								/>
							</div>
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Notes</label>
								<input
									type="text"
									value={editForm.notes}
									onChange={(e) => updateEditForm("notes", e.target.value)}
									className="form-input"
									disabled={!canEditGrowth || isSavingGrowth}
								/>
							</div>
						</div>

						{growthError && (
							<div
								style={{
									color: "var(--rose-dark)",
									fontSize: 13,
									fontWeight: 700,
									marginTop: 12,
								}}
							>
								{growthError}
							</div>
						)}

						{canEditGrowth && (
							<div style={{ display: "grid", gap: 10, marginTop: 20 }}>
								<button
									className="submit-btn"
									onClick={handleUpdateGrowth}
									disabled={isSavingGrowth}
									style={{ opacity: isSavingGrowth ? 0.6 : 1 }}
								>
									{isSavingGrowth ? "Saving..." : "Save Changes"}
								</button>
								{canDeleteGrowth && (
									<button
										className="cancel-btn"
										onClick={handleDeleteGrowth}
										disabled={isSavingGrowth}
										style={{
											background: "var(--peach)",
											color: "var(--rose-dark)",
										}}
									>
										Delete Entry
									</button>
								)}
							</div>
						)}

						<button
							className="cancel-btn"
							onClick={closeGrowthDetail}
							disabled={isSavingGrowth}
							style={{ marginTop: 10 }}
						>
							Close
						</button>
					</div>
				</div>
			)}

			{undoGrowth && (
				<div
					style={{
						position: "fixed",
						left: "50%",
						bottom: "calc(86px + env(safe-area-inset-bottom))",
						transform: "translateX(-50%)",
						width: "min(420px, calc(100vw - 32px))",
						background: "var(--text)",
						color: "white",
						borderRadius: "14px",
						padding: "12px 14px",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 12,
						zIndex: 80,
						boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
						fontWeight: 800,
						fontSize: 13,
					}}
				>
					<span>Growth entry deleted</span>
					<button
						onClick={handleUndoDelete}
						style={{
							background: "transparent",
							border: "none",
							color: "var(--rose-light)",
							fontWeight: 900,
							cursor: "pointer",
							fontFamily: "inherit",
						}}
					>
						Undo
					</button>
				</div>
			)}
		</div>
	);
}
