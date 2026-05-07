import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function Stats() {
	const { logs, growthLogs, addGrowthLog } = useApp();
	const [activeSubTab, setActiveSubTab] = useState("activity"); 
	
	// Growth Form State
	const [measureDate, setMeasureDate] = useState(new Date().toISOString().split('T')[0]);
	const [weight, setWeight] = useState("");
	const [height, setHeight] = useState("");
	const [hc, setHc] = useState("");
	const [notes, setNotes] = useState("");

	// --- Format Data for Charts ---
	const last7Days = [...Array(7)].map((_, i) => {
		const d = new Date();
		d.setDate(d.getDate() - (6 - i));
		return d.toISOString().split('T')[0];
	});

	const chartData = last7Days.map(dateStr => {
		const dayLogs = logs.filter(l => {
			const logDate = new Date(l.timestamp || l.time).toISOString().split('T')[0];
			return logDate === dateStr && l.type === "milk" && l.feedType === "bottle";
		});
		const totalMl = dayLogs.reduce((acc, curr) => acc + (curr.unit === "oz" ? curr.amount * 30 : curr.amount), 0);
		
		return {
			name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
			milk: Math.round(totalMl)
		};
	});

	// Reverse sorts the growth data so it displays chronologically left-to-right on the chart
	const growthChartData = [...growthLogs].reverse().map(g => ({
		name: new Date(g.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
		weight: parseFloat(g.weight) || null
	}));

	const handleAddGrowth = () => {
		if (weight || height || hc) {
			// Set time to midday to avoid timezone shifting the date backward
			const timestamp = new Date(`${measureDate}T12:00:00`).getTime();
			addGrowthLog({ weight, height, hc, notes, timestamp });
			
			// Reset the form after submission
			setWeight("");
			setHeight("");
			setHc("");
			setNotes("");
			setMeasureDate(new Date().toISOString().split('T')[0]);
		}
	};

	return (
		<div className="fade-in">
			{/* Sub-Navigation */}
			<div style={{ display: "flex", background: "var(--cream2)", borderRadius: "var(--r)", padding: 4, marginBottom: 24 }}>
				<button onClick={() => setActiveSubTab("activity")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "var(--r2)", fontWeight: 800, background: activeSubTab === "activity" ? "var(--white)" : "transparent", color: activeSubTab === "activity" ? "var(--rose-dark)" : "var(--text3)", boxShadow: activeSubTab === "activity" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
					Weekly Trends
				</button>
				<button onClick={() => setActiveSubTab("growth")} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "var(--r2)", fontWeight: 800, background: activeSubTab === "growth" ? "var(--white)" : "transparent", color: activeSubTab === "growth" ? "var(--rose-dark)" : "var(--text3)", boxShadow: activeSubTab === "growth" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
					Growth Tracker
				</button>
			</div>

			{activeSubTab === "activity" && (
				<div className="fade-in">
					<div className="section-title">Milk Intake (Last 7 Days)</div>
					<div style={{ background: "var(--white)", padding: "20px 10px 20px 0", borderRadius: "var(--r)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: 300, marginBottom: 24 }}>
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData}>
								<defs>
									<linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#ffbba6" stopOpacity={0.8}/>
										<stop offset="95%" stopColor="#ffbba6" stopOpacity={0}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
								<XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: "#99958c"}} dy={10} />
								<YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: "#99958c"}} dx={-10} />
								<Tooltip cursor={{stroke: 'var(--rose)', strokeWidth: 2, strokeDasharray: '3 3'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
								<Area type="monotone" dataKey="milk" stroke="#ff9a85" strokeWidth={3} fillOpacity={1} fill="url(#colorMilk)" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			)}

			{activeSubTab === "growth" && (
				<div className="fade-in">
					{/* Add Growth Form */}
					<div style={{ background: "var(--white)", padding: "20px", borderRadius: "var(--r)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", marginBottom: 24 }}>
						<div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Log New Measurement</div>
						
						<div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: 16 }}>
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Measurement Date</label>
								<input type="date" value={measureDate} onChange={(e) => setMeasureDate(e.target.value)} className="form-input" />
							</div>
							
							<div style={{ display: "flex", gap: "12px" }}>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Weight (kg)</label>
									<input type="number" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} className="form-input" placeholder="e.g. 4.2" />
								</div>
								<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
									<label className="form-label">Height (cm)</label>
									<input type="number" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} className="form-input" placeholder="e.g. 52" />
								</div>
							</div>
							
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Head Circumference (cm)</label>
								<input type="number" step="0.1" value={hc} onChange={(e) => setHc(e.target.value)} className="form-input" placeholder="e.g. 35" />
							</div>
							
							<div className="form-group" style={{ marginBottom: 0 }}>
								<label className="form-label">Notes (Optional)</label>
								<input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" placeholder="e.g. 2 Month Checkup" />
							</div>
						</div>
						
						<button className="submit-btn" onClick={handleAddGrowth} disabled={!weight && !height && !hc} style={{ opacity: (!weight && !height && !hc) ? 0.5 : 1 }}>
							Save Measurement
						</button>
					</div>

					{/* Growth Chart */}
					{growthChartData.filter(d => d.weight).length > 1 && (
						<>
							<div className="section-title">Weight Progression</div>
							<div style={{ background: "var(--white)", padding: "20px 10px 20px 0", borderRadius: "var(--r)", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", height: 250, marginBottom: 24 }}>
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={growthChartData.filter(d => d.weight)}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
										<XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: "#99958c"}} dy={10} />
										<YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: "#99958c"}} dx={-10} />
										<Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
										<Line type="monotone" dataKey="weight" stroke="#1d9e75" strokeWidth={3} dot={{r: 5, fill: "#1d9e75"}} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</>
					)}

					{/* Growth History List */}
					<div className="section-title">History</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{growthLogs.map(log => (
							<div key={log.id} style={{ background: "var(--white)", padding: "16px", borderRadius: "var(--r2)", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<div style={{ fontWeight: 800, color: "var(--text)" }}>
										{new Date(log.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
									</div>
								</div>
								
								<div style={{ display: "flex", gap: "16px", color: "var(--text2)", fontWeight: 700, fontSize: "14px" }}>
									{log.weight && <span>{log.weight} kg</span>}
									{log.height && <span>{log.height} cm</span>}
									{log.hc && <span>{log.hc} cm (HC)</span>}
								</div>
								
								{log.notes && (
									<div style={{ fontSize: "13px", color: "var(--text3)", fontStyle: "italic", background: "var(--cream2)", padding: "8px 12px", borderRadius: "8px", marginTop: "4px" }}>
										"{log.notes}"
									</div>
								)}
							</div>
						))}
						{growthLogs.length === 0 && <div style={{ textAlign: "center", padding: "20px", color: "var(--text3)", fontWeight: 600 }}>No measurements logged yet.</div>}
					</div>
				</div>
			)}
		</div>
	);
}