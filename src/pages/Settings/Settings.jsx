import { useState } from "react";
import { useApp } from "../../contexts/AppContext";

export default function Settings() {
	const { user, family, familyMembers, babies, addBaby, updateBaby, deleteBaby, removeMember, logout } = useApp();

	// Controls which baby is currently being edited. 'new' means adding a baby.
	const [editingBabyId, setEditingBabyId] = useState(null); 
	
	const [form, setForm] = useState({ name: "", dob: "", weight: "", height: "", gender: "girl" });

	const getAgeString = (dobString) => {
		if (!dobString) return "";
		const dob = new Date(dobString);
		const today = new Date();
		let months = (today.getFullYear() - dob.getFullYear()) * 12 + (today.getMonth() - dob.getMonth());
		let days = today.getDate() - dob.getDate();
		if (days < 0) { months--; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
		if (months < 0) return "Not born yet";
		if (months === 0 && days === 0) return "Born today";
		let str = [];
		if (months > 0) str.push(`${months} month${months !== 1 ? "s" : ""}`);
		if (days > 0) str.push(`${days} day${days !== 1 ? "s" : ""}`);
		return str.join(", ") + " old";
	};

	const startEditing = (baby) => {
		setForm({
			name: baby.name || "",
			dob: baby.dob || "",
			weight: baby.weight || "",
			height: baby.height || "",
			gender: baby.gender || "girl"
		});
		setEditingBabyId(baby.id);
	};

	const startAddingNew = () => {
		setForm({ name: "", dob: "", weight: "", height: "", gender: "girl" });
		setEditingBabyId("new");
	};

	const saveBabyProfile = async () => {
		if (editingBabyId === "new") {
			await addBaby(form);
		} else {
			await updateBaby(editingBabyId, form);
		}
		setEditingBabyId(null);
	};

	const handleDeleteBaby = async (babyId, babyName) => {
		if (window.confirm(`Are you absolutely sure you want to remove ${babyName}'s profile? This cannot be undone.`)) {
			await deleteBaby(babyId);
			setEditingBabyId(null);
		}
	};

	return (
		<div className="fade-in">
			{/* Family Details */}
			<div className="section-title">Family Details</div>
			<div style={{ background: "var(--white)", borderRadius: "var(--r)", padding: 20, marginBottom: 24, textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
				<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>{family?.name}</h3>
				<p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, fontWeight: 600 }}>Share this code to invite members:</p>
				<div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 900, color: "var(--rose-dark)", background: "var(--peach)", padding: "12px", borderRadius: "12px" }}>
					{family?.joinCode}
				</div>
			</div>

			{/* Children Profiles (Multi-Baby Support) */}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
				<div className="section-title" style={{ marginBottom: 0 }}>Children Profiles</div>
				{!editingBabyId && (
					<button onClick={startAddingNew} style={{ background: "none", border: "none", color: "var(--rose-dark)", fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "4px 8px" }}>
						+ Add Child
					</button>
				)}
			</div>

			{editingBabyId === "new" && (
				<div className="fade-in" style={{ background: "var(--white)", borderRadius: "var(--r)", padding: "16px", marginBottom: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", border: "2px solid var(--peach)" }}>
					<div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Add New Child</div>
					<div className="type-btns" style={{ marginBottom: 12 }}>
						<button className={`type-btn ${form.gender === "girl" ? "selected" : ""}`} onClick={() => setForm({ ...form, gender: "girl" })}>👧 Girl</button>
						<button className={`type-btn ${form.gender === "boy" ? "selected" : ""}`} onClick={() => setForm({ ...form, gender: "boy" })}>👦 Boy</button>
					</div>
					<div className="form-group" style={{ marginBottom: 12 }}>
						<label className="form-label">Name</label>
						<input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="e.g. Mia Aalaiya" />
					</div>
					<div className="form-group" style={{ marginBottom: 12 }}>
						<label className="form-label">Date of Birth</label>
						<input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="form-input" placeholder="e.g. 2025-11-22" />
					</div>
					<div style={{ display: "flex", gap: "12px", marginBottom: 16 }}>
						<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
							<label className="form-label">Weight (kg)</label>
							<input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="form-input" />
						</div>
						<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
							<label className="form-label">Height (cm)</label>
							<input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="form-input" />
						</div>
					</div>
					<div style={{ display: "flex", gap: "8px" }}>
						<button onClick={saveBabyProfile} className="submit-btn" disabled={!form.name || !form.dob} style={{ flex: 2, opacity: (!form.name || !form.dob) ? 0.5 : 1 }}>Save Profile</button>
						<button onClick={() => setEditingBabyId(null)} className="cancel-btn" style={{ flex: 1, background: "var(--cream2)" }}>Cancel</button>
					</div>
				</div>
			)}

			<div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: 32 }}>
				{babies.map((baby) => (
					<div key={baby.id} style={{ background: "var(--white)", borderRadius: "var(--r)", padding: "16px", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
						{editingBabyId !== baby.id ? (
							<div className="fade-in">
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
									<span style={{ fontWeight: 800, fontSize: "16px" }}>{baby.name} {baby.gender === 'boy' ? '👦' : '👧'}</span>
									<button onClick={() => startEditing(baby)} style={{ background: "var(--cream2)", border: "none", color: "var(--rose-dark)", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: "6px 12px", borderRadius: "12px" }}>
										Edit
									</button>
								</div>
								<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span style={{ fontWeight: 700, color: "var(--text2)", fontSize: "13px" }}>Birthday</span>
										<span style={{ fontWeight: 800, fontSize: "13px" }}>{baby.dob}</span>
									</div>
									<div style={{ display: "flex", justifyContent: "space-between" }}>
										<span style={{ fontWeight: 700, color: "var(--text2)", fontSize: "13px" }}>Age</span>
										<span style={{ fontWeight: 800, fontSize: "13px" }}>{getAgeString(baby.dob)}</span>
									</div>
								</div>
							</div>
						) : (
							<div className="fade-in">
								<div className="type-btns" style={{ marginBottom: 12 }}>
									<button className={`type-btn ${form.gender === "girl" ? "selected" : ""}`} onClick={() => setForm({ ...form, gender: "girl" })}>👧 Girl</button>
									<button className={`type-btn ${form.gender === "boy" ? "selected" : ""}`} onClick={() => setForm({ ...form, gender: "boy" })}>👦 Boy</button>
								</div>
								<div className="form-group" style={{ marginBottom: 12 }}>
									<label className="form-label">Name</label>
									<input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" />
								</div>
								<div className="form-group" style={{ marginBottom: 12 }}>
									<label className="form-label">Date of Birth</label>
									<input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="form-input" />
								</div>
								<div style={{ display: "flex", gap: "12px", marginBottom: 16 }}>
									<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
										<label className="form-label">Weight (kg)</label>
										<input type="number" step="0.01" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="form-input" />
									</div>
									<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
										<label className="form-label">Height (cm)</label>
										<input type="number" step="0.1" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="form-input" />
									</div>
								</div>
								<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
									<div style={{ display: "flex", gap: "8px" }}>
										<button onClick={saveBabyProfile} className="submit-btn" style={{ flex: 2 }}>Save Changes</button>
										<button onClick={() => setEditingBabyId(null)} className="cancel-btn" style={{ flex: 1, background: "var(--cream2)" }}>Cancel</button>
									</div>
									<button onClick={() => handleDeleteBaby(baby.id, baby.name)} className="cancel-btn" style={{ color: "var(--rose-dark)", background: "var(--rose-light)", opacity: 0.8 }}>
										Delete Profile
									</button>
								</div>
							</div>
						)}
					</div>
				))}
			</div>

			{/* Family Members */}
			<div className="section-title">Family Members</div>
			<div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
				{familyMembers.map((member) => {
					const isMe = member.userId === user?.uid;
					return (
						<div key={member.id} style={{ background: "var(--white)", padding: "16px", borderRadius: "var(--r)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
							<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
								{member.photoURL ? (
									<img src={member.photoURL} alt={member.displayName} style={{ width: 44, height: 44, borderRadius: "14px", objectFit: "cover" }} />
								) : (
									<div style={{ width: 44, height: 44, borderRadius: "14px", background: "var(--rose-light)", color: "var(--rose-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>
										{member.displayName?.charAt(0)?.toUpperCase() || "?"}
									</div>
								)}
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>
										{member.displayName} {isMe && <span style={{ color: "var(--rose-dark)" }}>(You)</span>}
									</span>
									<span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 700, textTransform: "capitalize" }}>
										{member.role}
									</span>
								</div>
							</div>

							<button
								onClick={() => {
									const action = isMe ? "leave the family" : "remove this member";
									if (window.confirm(`Are you sure you want to ${action}?`)) removeMember(member.id, member.userId);
								}}
								style={{ background: isMe ? "var(--peach)" : "var(--cream2)", border: "none", color: isMe ? "var(--rose-dark)" : "var(--text2)", fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "8px 14px", borderRadius: "var(--r2)", transition: "all 0.2s" }}
							>
								{isMe ? "Leave" : "Remove"}
							</button>
						</div>
					);
				})}
			</div>

			<button onClick={logout} className="cancel-btn" style={{ background: "var(--white)", border: "2px solid var(--cream2)", color: "var(--text2)", borderRadius: "var(--r)" }}>
				Sign Out
			</button>

			<div style={{ textAlign: "center", color: "var(--text3)", fontSize: "12px", opacity: 0.6, marginTop: "40px", marginBottom: "20px", fontWeight: 600 }}>
				Developed by Adwa Najmi with 🌸
			</div>
		</div>
	);
}