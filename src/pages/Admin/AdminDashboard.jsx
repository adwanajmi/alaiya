import { useState, useEffect } from "react";
import { collection, getCountFromServer, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useApp } from "../../contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
	const { user } = useApp();
	const navigate = useNavigate();
	const [metrics, setMetrics] = useState({ users: 0, families: 0, babies: 0, logs: 0 });
	const [recentFamilies, setRecentFamilies] = useState([]);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (user && user.platformRole !== "SUPER_ADMIN") {
			navigate("/");
			return;
		}

		const fetchAdminData = async () => {
			try {
				// 1. Fetch Lifetime Totals (Cost: 4 Reads)
				const [usersSnap, familiesSnap, babiesSnap, logsSnap] = await Promise.all([
					getCountFromServer(collection(db, "users")),
					getCountFromServer(collection(db, "families")),
					getCountFromServer(collection(db, "babies")),
					getCountFromServer(collection(db, "logs"))
				]);

				setMetrics({
					users: usersSnap.data().count,
					families: familiesSnap.data().count,
					babies: babiesSnap.data().count,
					logs: logsSnap.data().count,
				});

				// 2. Fetch Recent Families (Cost: Up to 5 Reads)
				const recentQuery = query(collection(db, "families"), orderBy("createdAt", "desc"), limit(5));
				const recentSnap = await getDocs(recentQuery);
				setRecentFamilies(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

				// 3. FREE TIER ANALYTICS: Last 7 Days Activity (Cost: Exactly 7 Reads)
				const last7Days = Array.from({ length: 7 }).map((_, i) => {
					const d = new Date();
					d.setDate(d.getDate() - (6 - i));
					d.setHours(0, 0, 0, 0);
					return d;
				});

				const chartPromises = last7Days.map(async (date) => {
					const startOfDay = date.getTime();
					const endOfDay = startOfDay + 86399999; // 23:59:59.999
					
					const q = query(
						collection(db, "logs"),
						where("timestamp", ">=", startOfDay),
						where("timestamp", "<=", endOfDay)
					);
					const snap = await getCountFromServer(q);
					
					return {
						day: date.toLocaleDateString("en-US", { weekday: 'short' }),
						activities: snap.data().count
					};
				});

				const resolvedChartData = await Promise.all(chartPromises);
				setChartData(resolvedChartData);

			} catch (error) {
				console.error("Admin fetch error:", error);
			} finally {
				setLoading(false);
			}
		};

		if (user) fetchAdminData();
	}, [user, navigate]);

	if (loading) return <div style={{ padding: 40, textAlign: "center", fontWeight: 800 }}>Loading Platform Data...</div>;

	return (
		<div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto", fontFamily: "Nunito, sans-serif" }}>
			<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
				<h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Platform Overview</h1>
				<button onClick={() => navigate("/")} style={{ padding: "8px 16px", borderRadius: "12px", border: "none", background: "var(--cream2)", fontWeight: 800, cursor: "pointer" }}>
					Exit Admin
				</button>
			</div>

			{/* Top Metrics Grid */}
			<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 32 }}>
				{[
					{ label: "Total Users", val: metrics.users, icon: "👤", color: "#7aaedb" },
					{ label: "Active Families", val: metrics.families, icon: "👨‍👩‍👧", color: "#cc5b43" },
					{ label: "Babies Tracked", val: metrics.babies, icon: "👶", color: "#4CAF50" },
					{ label: "Lifetime Logs", val: metrics.logs, icon: "📝", color: "#FF9800" },
				].map((m, i) => (
					<div key={i} style={{ background: "white", padding: 20, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", borderLeft: `4px solid ${m.color}` }}>
						<div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
						<div style={{ fontSize: 32, fontWeight: 900, color: "#33312e" }}>{m.val.toLocaleString()}</div>
						<div style={{ fontSize: 13, fontWeight: 700, color: "#99958c" }}>{m.label}</div>
					</div>
				))}
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
				
				{/* 7-Day Analytics Chart */}
				<div style={{ background: "white", padding: 24, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
					<h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "var(--text)" }}>Platform Activity (Last 7 Days)</h2>
					<div style={{ height: 300, width: "100%" }}>
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
								<XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#99958c" }} dy={10} />
								<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#99958c" }} />
								<Tooltip 
									cursor={{ fill: "var(--cream2)" }}
									contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontWeight: 800 }}
								/>
								<Bar dataKey="activities" name="Total Logs" fill="var(--rose-dark)" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Recent Families Table */}
				<div style={{ background: "white", borderRadius: "20px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
					<div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
						<h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Newest Families</h2>
					</div>
					<div style={{ overflowX: "auto" }}>
						<table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
							<thead>
								<tr style={{ background: "var(--cream2)", fontSize: 13, color: "var(--text2)" }}>
									<th style={{ padding: "16px", fontWeight: 800 }}>Family Name</th>
									<th style={{ padding: "16px", fontWeight: 800 }}>Join Code</th>
									<th style={{ padding: "16px", fontWeight: 800 }}>Created Date</th>
								</tr>
							</thead>
							<tbody>
								{recentFamilies.map(fam => (
									<tr key={fam.id} style={{ borderBottom: "1px solid var(--border)" }}>
										<td style={{ padding: "16px", fontWeight: 700 }}>{fam.name}</td>
										<td style={{ padding: "16px", fontFamily: "monospace", letterSpacing: 1 }}>{fam.joinCode}</td>
										<td style={{ padding: "16px", fontSize: 13, color: "var(--text2)" }}>
											{new Date(fam.createdAt).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

			</div>
		</div>
	);
}