import { useState } from "react";
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
		deleteBaby,
		userRole,
		user,
		isSuperAdmin,
		growthLogs,
		family,
		openImageViewer,
	} = useApp();
	const [editingId, setEditingId] = useState(null);
	const [formData, setFormData] = useState({});
	const [uploadStates, setUploadStates] = useState({});
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [deleteError, setDeleteError] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	if (!family || babies.length === 0) return null;

	const isParent = userRole === "parent" || isSuperAdmin;

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
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!isParent || !file || babyId === "new") return;

		const previewURL = URL.createObjectURL(file);
		setUploadStates((prev) => ({
			...prev,
			[babyId]: { uploading: true, progress: 5, error: "", previewURL },
		}));

		try {
			const url = await uploadOptimizedImage(
				file,
				user.currentFamilyId,
				"profiles",
				babyId,
				(progress) =>
					setUploadStates((prev) => ({
						...prev,
						[babyId]: {
							...(prev[babyId] || {}),
							uploading: true,
							progress,
							error: "",
						},
					})),
			);
			await updateBaby(babyId, { photoURL: url });
			setUploadStates((prev) => ({
				...prev,
				[babyId]: { uploading: false, progress: 100, error: "", previewURL: "" },
			}));
		} catch (err) {
			setUploadStates((prev) => ({
				...prev,
				[babyId]: {
					...(prev[babyId] || {}),
					uploading: false,
					progress: 0,
					error: err?.message || "Upload failed. Please try again.",
				},
			}));
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		setDeleteError("");
		try {
			await deleteBaby(deleteTarget.id);
			setDeleteTarget(null);
			setEditingId((current) => (current === deleteTarget.id ? null : current));
		} catch (error) {
			setDeleteError(error?.message || "Could not remove this child profile. Please try again.");
		} finally {
			setIsDeleting(false);
		}
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
				<div style={{ fontSize: "18px", fontWeight: 800 }}>Children Profiles</div>
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
							<button className={`type-btn ${formData.gender === "girl" ? "selected" : ""}`} onClick={() => setFormData({ ...formData, gender: "girl" })}>👧 Girl</button>
							<button className={`type-btn ${formData.gender === "boy" ? "selected" : ""}`} onClick={() => setFormData({ ...formData, gender: "boy" })}>👦 Boy</button>
						</div>
						<div className="form-group" style={{ marginBottom: 12 }}>
							<label className="form-label">Name</label>
							<input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" placeholder="e.g. Mia" />
						</div>
						<div className="form-group" style={{ marginBottom: 12 }}>
							<label className="form-label">Date of Birth</label>
							<input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="form-input" />
						</div>
						<div style={{ display: "flex", gap: "12px", marginBottom: 16 }}>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Weight (kg)</label>
								<input type="number" step="0.01" value={formData.weight || ""} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="form-input" />
							</div>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Height (cm)</label>
								<input type="number" step="0.1" value={formData.height || ""} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="form-input" />
							</div>
						</div>
						<div style={{ display: "flex", gap: "8px" }}>
							<button onClick={handleSave} className="submit-btn" disabled={!formData.name || !formData.dob} style={{ flex: 2, opacity: !formData.name || !formData.dob ? 0.5 : 1 }}>Save Profile</button>
							<button onClick={() => setEditingId(null)} className="cancel-btn" style={{ flex: 1, background: "var(--cream2)" }}>Cancel</button>
						</div>
					</div>
				)}

				{babies.map((baby) => (
					<ChildCard
						key={baby.id}
						baby={baby}
						activeBaby={activeBaby}
						editingId={editingId}
						formData={formData}
						uploadState={uploadStates[baby.id]}
						isParent={isParent}
						switchBaby={switchBaby}
						setFormData={setFormData}
						setDeleteTarget={setDeleteTarget}
						handleEdit={handleEdit}
						handleSave={handleSave}
						handleImageSelect={handleImageSelect}
						setEditingId={setEditingId}
						getLatestGrowth={getLatestGrowth}
						openImageViewer={openImageViewer}
					/>
				))}
			</div>

			{deleteTarget && (
				<div
					className="modal-overlay"
					onMouseDown={(e) => {
						if (e.target === e.currentTarget && !isDeleting) {
							setDeleteTarget(null);
							setDeleteError("");
						}
					}}
				>
					<div className="modal" style={{ maxWidth: 420 }}>
						<div className="modal-title">Remove Child Profile?</div>
						<p style={{ color: "var(--text2)", fontSize: 14, fontWeight: 700, lineHeight: 1.5, marginBottom: 16 }}>
							Are you sure you want to remove {deleteTarget.name}'s child profile? This will archive the profile and keep related logs safe.
						</p>
						{deleteError && (
							<div style={{ color: "var(--rose-dark)", fontSize: 13, fontWeight: 800, marginBottom: 12 }}>
								{deleteError}
							</div>
						)}
						<div style={{ display: "flex", gap: 8 }}>
							<button type="button" className="cancel-btn" onClick={() => { setDeleteTarget(null); setDeleteError(""); }} disabled={isDeleting} style={{ flex: 1 }}>Cancel</button>
							<button type="button" className="submit-btn" onClick={handleConfirmDelete} disabled={isDeleting} style={{ flex: 1, background: "var(--rose-dark)", opacity: isDeleting ? 0.6 : 1 }}>
								{isDeleting ? "Removing..." : "Remove"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function ChildCard({
	baby,
	activeBaby,
	editingId,
	formData,
	uploadState,
	isParent,
	switchBaby,
	setFormData,
	setDeleteTarget,
	handleEdit,
	handleSave,
	handleImageSelect,
	setEditingId,
	getLatestGrowth,
	openImageViewer,
}) {
	const imageSrc = uploadState?.previewURL || baby.photoURL;
	const isUploading = Boolean(uploadState?.uploading);

	return (
		<div
			style={{
				background: "var(--white)",
				borderRadius: "var(--r)",
				padding: "20px",
				boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
				border: activeBaby?.id === baby.id ? "2px solid var(--peach)" : "1px solid var(--border)",
			}}
		>
			<div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: editingId === baby.id ? "16px" : "0" }}>
				<div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
					{imageSrc ? (
						<img
							src={imageSrc}
							className="avatar-circle"
							onClick={() => openImageViewer(imageSrc)}
							style={{ width: "100%", height: "100%", cursor: "pointer", border: "2px solid var(--peach)" }}
							alt={baby.name}
						/>
					) : (
						<div
							className="avatar-circle"
							style={{
								width: "100%",
								height: "100%",
								background: "var(--cream2)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "24px",
								border: "2px solid var(--peach)",
							}}
						>
							{baby.gender === "boy" ? "👦" : "👧"}
						</div>
					)}
					{isParent && (
						<label
							htmlFor={`child-photo-${baby.id}`}
							style={{
								position: "absolute",
								bottom: -4,
								right: -4,
								background: "var(--text)",
								color: "white",
								border: "2px solid white",
								borderRadius: "50%",
								width: 28,
								height: 28,
								cursor: isUploading ? "not-allowed" : "pointer",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "12px",
								opacity: isUploading ? 0.7 : 1,
								zIndex: 2,
							}}
						>
							{isUploading ? "..." : "📷"}
						</label>
					)}
					<input
						id={`child-photo-${baby.id}`}
						type="file"
						accept="image/*"
						disabled={isUploading}
						style={{ display: "none" }}
						onChange={(e) => handleImageSelect(e, baby.id)}
					/>
				</div>
				<div style={{ flex: 1 }}>
					<div style={{ fontSize: "18px", fontWeight: 800 }}>{baby.name}</div>
					<div style={{ fontSize: "13px", color: "var(--text2)", fontWeight: 700 }}>
						{getAgeString(baby.dob)} • {getLatestGrowth(baby.id)}
					</div>
				</div>
				<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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
			{uploadState?.uploading && (
				<div style={{ marginTop: 12 }}>
					<div style={{ height: 8, borderRadius: 999, background: "var(--cream2)", overflow: "hidden" }}>
						<div style={{ width: `${uploadState.progress || 5}%`, height: "100%", background: "var(--rose-dark)" }} />
					</div>
					<div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 800, marginTop: 6 }}>
						Uploading photo... {uploadState.progress || 0}%
					</div>
				</div>
			)}
			{uploadState?.error && (
				<div style={{ marginTop: 12, padding: 10, background: "var(--peach)", borderRadius: 12, color: "var(--rose-dark)", fontSize: 13, fontWeight: 800, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
					<span>{uploadState.error}</span>
					<label htmlFor={`child-photo-${baby.id}`} style={{ background: "white", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>Retry</label>
				</div>
			)}
			{editingId === baby.id && (
				<div style={{ display: "grid", gap: "12px", paddingTop: "16px", borderTop: "1px solid var(--border)", marginTop: "16px" }}>
					<input className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" />
					<div style={{ display: "flex", gap: "12px" }}>
						<select className="form-input" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
							<option value="boy">Boy</option>
							<option value="girl">Girl</option>
						</select>
						<input className="form-input" type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
					</div>
					<div style={{ display: "flex", gap: "8px" }}>
						<button className="submit-btn" style={{ flex: 1 }} onClick={handleSave}>Save</button>
						<button className="cancel-btn" style={{ flex: 1 }} onClick={() => setEditingId(null)}>Cancel</button>
					</div>
					{isParent && (
						<button type="button" className="cancel-btn" onClick={() => setDeleteTarget(baby)} style={{ background: "var(--peach)", color: "var(--rose-dark)", border: "1px solid var(--peach)" }}>
							Remove Child Profile
						</button>
					)}
				</div>
			)}
		</div>
	);
}