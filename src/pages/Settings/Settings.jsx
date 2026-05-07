import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { db } from "../../services/firebase";

export default function Settings() {
	const { user, family, familyMembers, activeBaby, removeMember, logout } =
		useApp();

	const [editBabyName, setEditBabyName] = useState("");
	const [editBabyDob, setEditBabyDob] = useState("");
	const [editBabyWeight, setEditBabyWeight] = useState("");
	const [editBabyHeight, setEditBabyHeight] = useState("");
	const [isEditingBaby, setIsEditingBaby] = useState(false);

	const getAgeString = (dobString) => {
		if (!dobString) return "";
		const dob = new Date(dobString);
		const today = new Date();
		let months =
			(today.getFullYear() - dob.getFullYear()) * 12 +
			(today.getMonth() - dob.getMonth());
		let days = today.getDate() - dob.getDate();
		if (days < 0) {
			months--;
			days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
		}
		if (months < 0) return "Not born yet";
		if (months === 0 && days === 0) return "Born today";
		let str = [];
		if (months > 0) str.push(`${months} month${months !== 1 ? "s" : ""}`);
		if (days > 0) str.push(`${days} day${days !== 1 ? "s" : ""}`);
		return str.join(", ") + " old";
	};

	const handleEditClick = () => {
		setEditBabyName(activeBaby.name || "");
		setEditBabyDob(activeBaby.dob || "");
		setEditBabyWeight(activeBaby.weight || "");
		setEditBabyHeight(activeBaby.height || "");
		setIsEditingBaby(true);
	};

	const saveBabyProfile = async () => {
		await updateDoc(doc(db, "babies", activeBaby.id), {
			name: editBabyName,
			dob: editBabyDob,
			weight: editBabyWeight,
			height: editBabyHeight,
		});
		setIsEditingBaby(false);
	};

	return (
		<div className="fade-in">
			{/* Family Details */}
			<div className="section-title">Family Details</div>
			<div
				style={{
					background: "var(--white)",
					borderRadius: "var(--r)",
					padding: 20,
					marginBottom: 24,
					textAlign: "center",
					boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
				}}
			>
				<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>
					{family?.name}
				</h3>
				<p
					style={{
						fontSize: 13,
						color: "var(--text2)",
						marginBottom: 16,
						fontWeight: 600,
					}}
				>
					Share this code to invite members:
				</p>
				<div
					style={{
						fontSize: 24,
						letterSpacing: 4,
						fontWeight: 900,
						color: "var(--rose-dark)",
						background: "var(--peach)",
						padding: "12px",
						borderRadius: "12px",
					}}
				>
					{family?.joinCode}
				</div>
			</div>

			{/* Baby Profile */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 12,
				}}
			>
				<div className="section-title" style={{ marginBottom: 0 }}>
					Baby Profile
				</div>
				{!isEditingBaby ? (
					<button
						onClick={handleEditClick}
						style={{
							background: "none",
							border: "none",
							color: "var(--rose-dark)",
							fontSize: 13,
							fontWeight: 800,
							cursor: "pointer",
							padding: "4px 8px",
						}}
					>
						Edit
					</button>
				) : (
					<button
						onClick={() => setIsEditingBaby(false)}
						style={{
							background: "none",
							border: "none",
							color: "var(--text3)",
							fontSize: 13,
							fontWeight: 800,
							cursor: "pointer",
							padding: "4px 8px",
						}}
					>
						Cancel
					</button>
				)}
			</div>

			<div
				style={{
					background: "var(--white)",
					borderRadius: "var(--r)",
					padding: "16px",
					marginBottom: 24,
					boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
				}}
			>
				{!isEditingBaby ? (
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontWeight: 700, color: "var(--text2)" }}>
								Name
							</span>
							<span style={{ fontWeight: 800 }}>{activeBaby?.name}</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontWeight: 700, color: "var(--text2)" }}>
								Birthday
							</span>
							<span style={{ fontWeight: 800 }}>{activeBaby?.dob}</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontWeight: 700, color: "var(--text2)" }}>
								Age
							</span>
							<span style={{ fontWeight: 800 }}>
								{getAgeString(activeBaby?.dob)}
							</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontWeight: 700, color: "var(--text2)" }}>
								Weight
							</span>
							<span style={{ fontWeight: 800 }}>
								{activeBaby?.weight ? `${activeBaby.weight} kg` : "—"}
							</span>
						</div>
						<div style={{ display: "flex", justifyContent: "space-between" }}>
							<span style={{ fontWeight: 700, color: "var(--text2)" }}>
								Height
							</span>
							<span style={{ fontWeight: 800 }}>
								{activeBaby?.height ? `${activeBaby.height} cm` : "—"}
							</span>
						</div>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Name</label>
							<input
								type="text"
								value={editBabyName}
								onChange={(e) => setEditBabyName(e.target.value)}
								className="form-input"
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Date of Birth</label>
							<input
								type="date"
								value={editBabyDob}
								onChange={(e) => setEditBabyDob(e.target.value)}
								className="form-input"
							/>
						</div>
						<div style={{ display: "flex", gap: "12px" }}>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Weight (kg)</label>
								<input
									type="number"
									step="0.01"
									value={editBabyWeight}
									onChange={(e) => setEditBabyWeight(e.target.value)}
									className="form-input"
								/>
							</div>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Height (cm)</label>
								<input
									type="number"
									step="0.1"
									value={editBabyHeight}
									onChange={(e) => setEditBabyHeight(e.target.value)}
									className="form-input"
								/>
							</div>
						</div>
						<button
							onClick={saveBabyProfile}
							className="submit-btn"
							style={{ marginTop: 8 }}
						>
							Save Changes
						</button>
					</div>
				)}
			</div>

			{/* Family Members */}
			<div className="section-title">Family Members</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: 12,
					marginBottom: 32,
				}}
			>
				{familyMembers.map((member) => {
					const isMe = member.userId === user?.uid;
					return (
						<div
							key={member.id}
							style={{
								background: "var(--white)",
								padding: "16px",
								borderRadius: "var(--r)",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
							}}
						>
							<div
								style={{ display: "flex", alignItems: "center", gap: "12px" }}
							>
								{member.photoURL ? (
									<img
										src={member.photoURL}
										alt={member.displayName}
										style={{
											width: 44,
											height: 44,
											borderRadius: "14px",
											objectFit: "cover",
										}}
									/>
								) : (
									<div
										style={{
											width: 44,
											height: 44,
											borderRadius: "14px",
											background: "var(--rose-light)",
											color: "var(--rose-dark)",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontWeight: 800,
											fontSize: 18,
										}}
									>
										{member.displayName?.charAt(0)?.toUpperCase() || "?"}
									</div>
								)}
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span
										style={{
											fontWeight: 800,
											fontSize: 15,
											color: "var(--text)",
										}}
									>
										{member.displayName}{" "}
										{isMe && (
											<span style={{ color: "var(--rose-dark)" }}>(You)</span>
										)}
									</span>
									<span
										style={{
											fontSize: 12,
											color: "var(--text3)",
											fontWeight: 700,
											textTransform: "capitalize",
										}}
									>
										{member.role}
									</span>
								</div>
							</div>

							<button
								onClick={() => {
									const action = isMe
										? "leave the family"
										: "remove this member";
									if (window.confirm(`Are you sure you want to ${action}?`))
										removeMember(member.id, member.userId);
								}}
								style={{
									background: isMe ? "var(--peach)" : "var(--cream2)",
									border: "none",
									color: isMe ? "var(--rose-dark)" : "var(--text2)",
									fontSize: 13,
									fontWeight: 800,
									cursor: "pointer",
									padding: "8px 14px",
									borderRadius: "var(--r2)",
									transition: "all 0.2s",
								}}
							>
								{isMe ? "Leave" : "Remove"}
							</button>
						</div>
					);
				})}
			</div>

			<button
				onClick={logout}
				className="cancel-btn"
				style={{
					background: "var(--white)",
					border: "2px solid var(--cream2)",
					color: "var(--text2)",
					borderRadius: "var(--r)",
				}}
			>
				Sign Out
			</button>
		</div>
	);
}
