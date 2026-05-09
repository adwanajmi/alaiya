import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	collection,
	getCountFromServer,
	getDocs,
	limit,
	orderBy,
	query,
	where,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import { db } from "../../services/firebase";
import { isSuperAdminUser } from "../../utils/roles";

const ADMIN_TABS = [
	{ label: "Overview", path: "/admin", view: "overview" },
	{ label: "Users", path: "/admin/users", view: "users" },
	{ label: "Families", path: "/admin/families", view: "families" },
	{ label: "Analytics", path: "/admin/analytics", view: "analytics" },
];

const sinceDaysAgo = (days) => {
	const date = new Date();
	date.setDate(date.getDate() - days);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
};

export default function AdminDashboard({ view = "overview" }) {
	const { isSuperAdmin } = useApp();
	const navigate = useNavigate();
	const [metrics, setMetrics] = useState({
		users: 0,
		families: 0,
		babies: 0,
		logs: 0,
		activeUsers: 0,
		notifications: 0,
		storageItems: 0,
	});
	const [users, setUsers] = useState([]);
	const [families, setFamilies] = useState([]);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const activeTab = useMemo(
		() => ADMIN_TABS.find((tab) => tab.view === view) || ADMIN_TABS[0],
		[view],
	);

	useEffect(() => {
		if (!isSuperAdmin) {
			navigate("/", { replace: true });
			return;
		}

		const fetchAdminData = async () => {
			setLoading(true);
			setError("");
			try {
				const sevenDaysAgo = sinceDaysAgo(7);
				const [
					usersSnap,
					familiesSnap,
					babiesSnap,
					logsSnap,
					activeUsersSnap,
					notificationSnap,
					photoBabiesSnap,
					usersListSnap,
					familiesListSnap,
				] = await Promise.all([
					getCountFromServer(collection(db, "users")),
					getCountFromServer(collection(db, "families")),
					getCountFromServer(collection(db, "babies")),
					getCountFromServer(collection(db, "logs")),
					getCountFromServer(
						query(collection(db, "users"), where("lastLoginAt", ">=", sevenDaysAgo)),
					),
					getCountFromServer(
						query(collection(db, "logs"), where("timestamp", ">=", sevenDaysAgo)),
					),
					getCountFromServer(
						query(collection(db, "babies"), where("photoURL", ">", "")),
					),
					getDocs(
						query(collection(db, "users"), orderBy("lastLoginAt", "desc"), limit(25)),
					),
					getDocs(
						query(collection(db, "families"), orderBy("createdAt", "desc"), limit(25)),
					),
				]);

				setMetrics({
					users: usersSnap.data().count,
					families: familiesSnap.data().count,
					babies: babiesSnap.data().count,
					logs: logsSnap.data().count,
					activeUsers: activeUsersSnap.data().count,
					notifications: notificationSnap.data().count,
					storageItems: photoBabiesSnap.data().count,
				});

				setUsers(usersListSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
				setFamilies(
					familiesListSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
				);

				const last7Days = Array.from({ length: 7 }).map((_, i) => {
					const d = new Date();
					d.setDate(d.getDate() - (6 - i));
					d.setHours(0, 0, 0, 0);
					return d;
				});

				const activityByDay = await Promise.all(
					last7Days.map(async (date) => {
						const startOfDay = date.getTime();
						const endOfDay = startOfDay + 86399999;
						const daySnap = await getCountFromServer(
							query(
								collection(db, "logs"),
								where("timestamp", ">=", startOfDay),
								where("timestamp", "<=", endOfDay),
							),
						);
						return {
							day: date.toLocaleDateString("en-US", { weekday: "short" }),
							activities: daySnap.data().count,
						};
					}),
				);
				setChartData(activityByDay);
			} catch (err) {
				console.error("Admin fetch error:", err);
				setError("Could not load admin data. Check Firestore indexes and rules.");
			} finally {
				setLoading(false);
			}
		};

		fetchAdminData();
	}, [isSuperAdmin, navigate]);

	const metricCards = [
		{ label: "Total Users", value: metrics.users, tone: "#7aaedb" },
		{ label: "Total Families", value: metrics.families, tone: "#cc5b43" },
		{ label: "Total Babies", value: metrics.babies, tone: "#4f9f74" },
		{ label: "Total Logs", value: metrics.logs, tone: "#d9913d" },
		{ label: "Active Users", value: metrics.activeUsers, tone: "#7a68a6" },
		{ label: "Notification Usage", value: metrics.notifications, tone: "#c45b82" },
		{ label: "Storage Items", value: metrics.storageItems, tone: "#5f8c8c" },
		{ label: "Firebase Reads", value: "Live", tone: "#33312e" },
	];

	if (loading) {
		return (
			<div style={{ padding: 40, textAlign: "center", fontWeight: 800 }}>
				Loading Platform Data...
			</div>
		);
	}

	return (
		<div
			style={{
				padding: "24px",
				maxWidth: "1040px",
				margin: "0 auto",
				fontFamily: "Nunito, sans-serif",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<div>
					<h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
						Platform Admin
					</h1>
					<div style={{ color: "var(--text2)", fontSize: 13, fontWeight: 700 }}>
						{activeTab.label}
					</div>
				</div>
				<button
					onClick={() => navigate("/")}
					style={{
						padding: "8px 16px",
						borderRadius: "12px",
						border: "none",
						background: "var(--cream2)",
						fontWeight: 800,
						cursor: "pointer",
					}}
				>
					Exit Admin
				</button>
			</div>

			<div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
				{ADMIN_TABS.map((tab) => (
					<Link
						key={tab.path}
						to={tab.path}
						style={{
							textDecoration: "none",
							color: activeTab.view === tab.view ? "white" : "var(--text)",
							background:
								activeTab.view === tab.view ? "var(--rose-dark)" : "var(--cream2)",
							borderRadius: 12,
							padding: "10px 14px",
							fontWeight: 800,
						}}
					>
						{tab.label}
					</Link>
				))}
			</div>

			{error && (
				<div
					style={{
						background: "var(--peach)",
						color: "var(--rose-dark)",
						borderRadius: 12,
						padding: 14,
						fontWeight: 800,
						marginBottom: 20,
					}}
				>
					{error}
				</div>
			)}

			{(view === "overview" || view === "analytics") && (
				<>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
							gap: 16,
							marginBottom: 32,
						}}
					>
						{metricCards.map((m) => (
							<div
								key={m.label}
								style={{
									background: "white",
									padding: 20,
									borderRadius: 16,
									boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
									borderLeft: `4px solid ${m.tone}`,
								}}
							>
								<div style={{ fontSize: 28, fontWeight: 900, color: "#33312e" }}>
									{typeof m.value === "number" ? m.value.toLocaleString() : m.value}
								</div>
								<div style={{ fontSize: 13, fontWeight: 700, color: "#77736c" }}>
									{m.label}
								</div>
							</div>
						))}
					</div>

					<div
						style={{
							background: "white",
							padding: 24,
							borderRadius: 16,
							boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
							marginBottom: 32,
						}}
					>
						<h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
							Analytics Overview
						</h2>
						<div style={{ height: 300, width: "100%" }}>
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={chartData} margin={{ top: 10, right: 10, left: -20 }}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ede8e1" />
									<XAxis dataKey="day" axisLine={false} tickLine={false} />
									<YAxis axisLine={false} tickLine={false} />
									<Tooltip />
									<Bar
										dataKey="activities"
										name="Total Logs"
										fill="var(--rose-dark)"
										radius={[6, 6, 0, 0]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</>
			)}

			{(view === "overview" || view === "users") && (
				<AdminTable
					title="Recent Users"
					columns={["Name", "Email", "Role", "Last Active"]}
					rows={users.map((u) => [
						u.displayName || "Unknown",
						u.email || "-",
						isSuperAdminUser(u) ? "Super Admin" : "User",
						u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "-",
					])}
				/>
			)}

			{(view === "overview" || view === "families") && (
				<AdminTable
					title="Recent Families"
					columns={["Family", "Invite Code", "Created", "Created By"]}
					rows={families.map((family) => [
						family.name || "Unnamed",
						family.joinCode || "-",
						family.createdAt ? new Date(family.createdAt).toLocaleDateString() : "-",
						family.createdBy || "-",
					])}
				/>
			)}
		</div>
	);
}

function AdminTable({ title, columns, rows }) {
	return (
		<div
			style={{
				background: "white",
				borderRadius: 16,
				overflow: "hidden",
				boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
				marginBottom: 32,
			}}
		>
			<div style={{ padding: 20, borderBottom: "1px solid var(--border)" }}>
				<h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{title}</h2>
			</div>
			<div style={{ overflowX: "auto" }}>
				<table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
					<thead>
						<tr style={{ background: "var(--cream2)", fontSize: 13 }}>
							{columns.map((column) => (
								<th key={column} style={{ padding: 16, fontWeight: 800 }}>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.length ? (
							rows.map((row, index) => (
								<tr key={`${title}-${index}`} style={{ borderBottom: "1px solid var(--border)" }}>
									{row.map((cell, cellIndex) => (
										<td key={`${title}-${index}-${cellIndex}`} style={{ padding: 16, fontWeight: 700 }}>
											{cell}
										</td>
									))}
								</tr>
							))
						) : (
							<tr>
								<td colSpan={columns.length} style={{ padding: 16, color: "var(--text2)" }}>
									No records found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
