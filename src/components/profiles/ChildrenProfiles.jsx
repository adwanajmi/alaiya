import { useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { uploadOptimizedImage } from "../../services/storageUtils";
import { getAgeString } from "../../utils/dateUtils";

export default function ChildrenProfiles() {
	const {
		babies,
		activeBaby,
		switchBaby,
		updateBaby,
		addBaby,
		userRole,
		user,
		growthLogs,
		family,
	} = useApp();
	const [editingId, setEditingId] = useState(null);
	const [formData, setFormData] = useState({});
	const [isUploading, setIsUploading] = useState(false);
	const fileRef = useRef(null);

	if (!family || babies.length === 0) return null;

	const isParent =
		userRole === "parent" || user?.platformRole === "SUPER_ADMIN";

	const getLatestGrowth = (babyId) => {
		const logs = growthLogs
			.filter((g) => g.babyId === babyId)
			.sort((a, b) => b.timestamp - a.timestamp);
		if (!logs.length) return "No data";
		return `${logs[0].weight || "-"} kg, ${logs[0].height || "-"} cm`;
	};

	const handleEdit = (baby) => {
		if (!isParent) return;
		setEditingId(baby.id);
		setFormData(baby);
	};

	const handleAddNew = () => {
		if (!isParent) return;
		setEditingId("new");
		setFormData({ name: "", gender: "girl", dob: "", weight: "", height: "" });
	};

	const handleSave = async () => {
		if (editingId === "new") {
			await addBaby(formData);
		} else {
			await updateBaby(editingId, formData);
		}
		setEditingId(null);
	};

	const handleImageSelect = async (e, babyId) => {
		if (!isParent || !e.target.files[0] || babyId === "new") return;
		setIsUploading(true);
		try {
			const url = await uploadOptimizedImage(
				e.target.files[0],
				user.currentFamilyId,
				"profiles",
				babyId,
			);
			await updateBaby(babyId, { photoURL: url });
		} catch (err) {
			console.error("Upload failed", err);
		}
		setIsUploading(false);
	};

	return (
		<div className="fade-in" style={{ marginBottom: "24px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: "16px",
				}}
			>
				<div style={{ fontSize: "18px", fontWeight: 800 }}>
					Children Profiles
				</div>
				{isParent && editingId !== "new" && (
					<button
						onClick={handleAddNew}
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
						+ Add Child
					</button>
				)}
			</div>

			<div style={{ display: "grid", gap: "16px" }}>
				{/* Add New Child Form */}
				{editingId === "new" && (
					<div
						className="fade-in"
						style={{
							background: "var(--white)",
							borderRadius: "var(--r)",
							padding: "16px",
							boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
							border: "2px solid var(--peach)",
						}}
					>
						<div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
							Add New Child
						</div>
						<div className="type-btns" style={{ marginBottom: 12 }}>
							<button
								className={`type-btn ${formData.gender === "girl" ? "selected" : ""}`}
								onClick={() => setFormData({ ...formData, gender: "girl" })}
							>
								👧 Girl
							</button>
							<button
								className={`type-btn ${formData.gender === "boy" ? "selected" : ""}`}
								onClick={() => setFormData({ ...formData, gender: "boy" })}
							>
								👦 Boy
							</button>
						</div>
						<div className="form-group" style={{ marginBottom: 12 }}>
							<label className="form-label">Name</label>
							<input
								type="text"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								className="form-input"
								placeholder="e.g. Mia"
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 12 }}>
							<label className="form-label">Date of Birth</label>
							<input
								type="date"
								value={formData.dob}
								onChange={(e) =>
									setFormData({ ...formData, dob: e.target.value })
								}
								className="form-input"
							/>
						</div>
						<div style={{ display: "flex", gap: "12px", marginBottom: 16 }}>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Weight (kg)</label>
								<input
									type="number"
									step="0.01"
									value={formData.weight || ""}
									onChange={(e) =>
										setFormData({ ...formData, weight: e.target.value })
									}
									className="form-input"
								/>
							</div>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Height (cm)</label>
								<input
									type="number"
									step="0.1"
									value={formData.height || ""}
									onChange={(e) =>
										setFormData({ ...formData, height: e.target.value })
									}
									className="form-input"
								/>
							</div>
						</div>
						<div style={{ display: "flex", gap: "8px" }}>
							<button
								onClick={handleSave}
								className="submit-btn"
								disabled={!formData.name || !formData.dob}
								style={{
									flex: 2,
									opacity: !formData.name || !formData.dob ? 0.5 : 1,
								}}
							>
								Save Profile
							</button>
							<button
								onClick={() => setEditingId(null)}
								className="cancel-btn"
								style={{ flex: 1, background: "var(--cream2)" }}
							>
								Cancel
							</button>
						</div>
					</div>
				)}

				{/* Existing Children */}
				{babies.map((baby) => (
					<div
						key={baby.id}
						style={{
							background: "var(--white)",
							borderRadius: "var(--r)",
							padding: "20px",
							boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
							border:
								activeBaby?.id === baby.id
									? "2px solid var(--peach)"
									: "1px solid var(--border)",
						}}
					>
						<div
							style={{
								display: "flex",
								gap: "16px",
								alignItems: "center",
								marginBottom: editingId === baby.id ? "16px" : "0",
							}}
						>
							<div style={{ position: "relative" }}>
								<div
									style={{
										width: "64px",
										height: "64px",
										borderRadius: "32px",
										background: "var(--cream2)",
										overflow: "hidden",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: "24px",
									}}
								>
									{baby.photoURL ? (
										<img
											src={baby.photoURL}
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
											alt={baby.name}
										/>
									) : baby.gender === "boy" ? (
										"👦"
									) : (
										"👧"
									)}
								</div>
								{isParent && (
									<button
										onClick={() => {
											if (!isUploading) fileRef.current?.click();
										}}
										style={{
											position: "absolute",
											bottom: 0,
											right: 0,
											background: "var(--text)",
											color: "white",
											border: "none",
											borderRadius: "50%",
											width: "24px",
											height: "24px",
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "12px",
										}}
									>
										{isUploading ? "..." : "📷"}
									</button>
								)}
								<input
									type="file"
									accept="image/*"
									ref={fileRef}
									style={{ display: "none" }}
									onChange={(e) => handleImageSelect(e, baby.id)}
								/>
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: "18px", fontWeight: 800 }}>
									{baby.name}
								</div>
								<div
									style={{
										fontSize: "13px",
										color: "var(--text2)",
										fontWeight: 700,
									}}
								>
									{getAgeString(baby.dob)} • {getLatestGrowth(baby.id)}
								</div>
							</div>
							<div
								style={{ display: "flex", flexDirection: "column", gap: "8px" }}
							>
								{activeBaby?.id !== baby.id && (
									<button
										onClick={() => switchBaby(baby.id)}
										style={{
											padding: "6px 12px",
											borderRadius: "12px",
											border: "1px solid var(--peach)",
											background: "transparent",
											color: "var(--rose-dark)",
											fontWeight: 800,
											cursor: "pointer",
										}}
									>
										Select
									</button>
								)}
								{isParent && editingId !== baby.id && (
									<button
										onClick={() => handleEdit(baby)}
										style={{
											padding: "6px 12px",
											borderRadius: "12px",
											border: "none",
											background: "var(--cream2)",
											color: "var(--text2)",
											fontWeight: 800,
											cursor: "pointer",
										}}
									>
										Edit
									</button>
								)}
							</div>
						</div>

						{editingId === baby.id && (
							<div
								style={{
									display: "grid",
									gap: "12px",
									paddingTop: "16px",
									borderTop: "1px solid var(--border)",
								}}
							>
								<input
									className="form-input"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="Full Name"
								/>
								<div style={{ display: "flex", gap: "12px" }}>
									<select
										className="form-input"
										value={formData.gender}
										onChange={(e) =>
											setFormData({ ...formData, gender: e.target.value })
										}
									>
										<option value="boy">Boy</option>
										<option value="girl">Girl</option>
									</select>
									<input
										className="form-input"
										type="date"
										value={formData.dob}
										onChange={(e) =>
											setFormData({ ...formData, dob: e.target.value })
										}
									/>
								</div>
								<div style={{ display: "flex", gap: "8px" }}>
									<button
										className="submit-btn"
										style={{ flex: 1 }}
										onClick={handleSave}
									>
										Save
									</button>
									<button
										className="cancel-btn"
										style={{ flex: 1 }}
										onClick={() => setEditingId(null)}
									>
										Cancel
									</button>
								</div>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
