import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";
import { QRCode } from "react-qr-code";
import { useNavigate } from "react-router-dom";
import ChildrenProfiles from "../../components/profiles/ChildrenProfiles";
import { useApp } from "../../contexts/AppContext";


export default function Settings() {
	const {
		user,
		userRole,
		displayRole,
		isSuperAdmin,
		family,
		familyMembers,
		pendingFamilyId,
		createFamily,
		createInviteCode,
		joinFamily,
		confirmRole,
		cancelRoleSelection,
		removeMember,

		logout,
		openImageViewer,
	} = useApp();
	const navigate = useNavigate();
	const [newFamilyName, setNewFamilyName] = useState("");
	const [joinCodeInput, setJoinCodeInput] = useState("");
	const [isScanning, setIsScanning] = useState(false);
	const [showQR, setShowQR] = useState(false);
	const [isCreatingFamily, setIsCreatingFamily] = useState(false);
	const [isCreatingInviteCode, setIsCreatingInviteCode] = useState(false);
	const [familyActionError, setFamilyActionError] = useState("");
	const [parentType, setParentType] = useState("mother");

	const familyJoinCode = typeof family?.joinCode === "string" ? family.joinCode.trim() : "";
	const roleDescriptions = {
		Mother: "Parent access for feeding, growth, and family care.",
		Father: "Parent access for feeding, growth, and family care.",
		Caregiver: "Care access for daily logs and shared family updates.",
		"Parent Admin": "Parent access plus family setup and member management.",
		"Super Admin": "Platform-wide access for system management.",
	};

	const handleCreateFamily = async () => {
		const familyName = newFamilyName.trim();
		setFamilyActionError("");
		if (!familyName) {
			setFamilyActionError("Enter a family name first.");
			return;
		}
		setIsCreatingFamily(true);
		try {
			await createFamily(familyName, parentType);
			setNewFamilyName("");
		} catch (error) {
			setFamilyActionError(error?.message || "Could not create the family. Please try again.");
		} finally {
			setIsCreatingFamily(false);
		}
	};

	const handleJoinFamily = async () => {
		setFamilyActionError("");
		if (joinCodeInput.trim()) {
			const error = await joinFamily(joinCodeInput);
			if (error) alert(error);
		}
	};

	const handleLogout = async () => {
		await logout();
		navigate("/auth", { replace: true });
	};

	const handleCopyCode = () => {
		if (familyJoinCode) {
			navigator.clipboard.writeText(familyJoinCode);
			alert("Invite code copied to clipboard!");
		}
	};

	const handleShowQR = async () => {
		setFamilyActionError("");
		if (familyJoinCode) {
			if (!showQR && (userRole === "parent" || isSuperAdmin)) {
				try {
					await createInviteCode();
				} catch (error) {
					// Ignore sync failure
				}
			}
			setShowQR((prev) => !prev);
			return;
		}
		setIsCreatingInviteCode(true);
		try {
			await createInviteCode();
			setShowQR(true);
		} catch (error) {
			setFamilyActionError(error?.message || "Could not create an invite code. Please try again.");
		} finally {
			setIsCreatingInviteCode(false);
		}
	};


	return (
		<div className="fade-in">
			<div className="section-title">Settings</div>

			<div
				style={{
					background: "var(--white)",
					borderRadius: "var(--r)",
					padding: 20,
					marginBottom: 24,
					boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
					border: "1px solid var(--border)",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 16,
					}}
				>
					<div>
						<div style={{ fontSize: 13, color: "var(--text2)", fontWeight: 800 }}>
							Current Role
						</div>
						<div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
							{displayRole}
						</div>
						<div
							style={{
								fontSize: 13,
								color: "var(--text2)",
								fontWeight: 700,
								marginTop: 4,
							}}
						>
							{roleDescriptions[displayRole]}
						</div>
					</div>
					<div style={{ textAlign: "center" }}>
						<div style={{ width: 58, height: 58 }}>
							{user?.photoURL ? (
								<img
									src={user.photoURL}
									alt="Profile"
									className="avatar-circle avatar-circle-clickable"
									onClick={() => openImageViewer({ url: user.photoURL, label: user.displayName || "Profile" })}
									style={{
										width: "100%",
										height: "100%",
										border: "2px solid var(--peach)",
									}}
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
										fontWeight: 900,
										color: "var(--rose-dark)",
										fontSize: 20,
										border: "2px solid var(--peach)",
									}}
								>
									{user?.displayName?.charAt(0) || "?"}
								</div>
							)}
						</div>
					</div>
				</div>


			</div>

			<ChildrenProfiles />

			{family && (
				<div
					style={{
						background: "var(--white)",
						borderRadius: "var(--r)",
						padding: 20,
						marginBottom: 24,
						textAlign: "center",
						boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
						border: "1px solid var(--border)",
					}}
				>
					<div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
						Family Details
					</div>
					<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>
						{family.name}
					</h3>
					<p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16, fontWeight: 600 }}>
						Share this code to invite members:
					</p>
					<div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 16 }}>
						<div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 900, color: "var(--rose-dark)", background: "var(--peach)", padding: "12px", borderRadius: "12px", flex: 1 }}>
							{familyJoinCode || "No invite code"}
						</div>
						<button onClick={handleCopyCode} disabled={!familyJoinCode} style={{ background: "var(--cream2)", border: "none", padding: "16px", borderRadius: "12px", cursor: familyJoinCode ? "pointer" : "not-allowed", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: familyJoinCode ? 1 : 0.5 }}>
							📋
						</button>
					</div>
					<button onClick={handleShowQR} disabled={isCreatingInviteCode} className="submit-btn" style={{ background: "var(--cream2)", color: "var(--text)", padding: "12px", opacity: isCreatingInviteCode ? 0.5 : 1, cursor: isCreatingInviteCode ? "not-allowed" : "pointer" }}>
						{isCreatingInviteCode ? "Creating Code..." : showQR ? "Hide QR Code" : "Show QR Code"}
					</button>
					{familyActionError && (
						<div style={{ color: "var(--rose-dark)", fontSize: 13, fontWeight: 700, marginTop: 12 }}>
							{familyActionError}
						</div>
					)}
					{showQR && familyJoinCode && (
						<div className="fade-in" style={{ marginTop: 20, display: "flex", justifyContent: "center", padding: 20, background: "var(--white)", border: "2px solid var(--cream2)", borderRadius: "var(--r)" }}>
							<QRCode value={familyJoinCode} size={160} />
						</div>
					)}
					{!familyJoinCode && (
						<p style={{ color: "var(--text2)", fontSize: 13, fontWeight: 700, marginTop: 12 }}>
							This family does not have an invite code yet. Tap Show QR Code to create one.
						</p>
					)}
				</div>
			)}

			<div
				style={{
					background: "var(--white)",
					borderRadius: "var(--r)",
					padding: "20px",
					marginBottom: "24px",
					boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
					border: "1px solid var(--border)",
				}}
			>
				<div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>
					Family Management
				</div>

				{!family ? (
					<div style={{ display: "grid", gap: "16px" }}>
						{pendingFamilyId ? (
							<div style={{ display: "grid", gap: "12px" }}>
								<div style={{ fontWeight: 700 }}>Select your role:</div>
								<div className="type-btns">
									<button className={`type-btn ${parentType === "mother" ? "selected" : ""}`} onClick={() => setParentType("mother")}>Mother</button>
									<button className={`type-btn ${parentType === "father" ? "selected" : ""}`} onClick={() => setParentType("father")}>Father</button>
								</div>
								<button className="submit-btn" onClick={() => confirmRole("parent", parentType)}>Join as Parent</button>
								<button className="submit-btn" onClick={() => confirmRole("caregiver")} style={{ background: "var(--cream2)", color: "var(--text)" }}>Join as Caregiver</button>
								<button className="cancel-btn" onClick={cancelRoleSelection}>Cancel</button>
							</div>
						) : (
							<>
								<div style={{ display: "flex", gap: "8px" }}>
									<input className="form-input" placeholder="New Family Name" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} style={{ marginBottom: 0 }} />
									<button type="button" className="submit-btn" onClick={handleCreateFamily} disabled={isCreatingFamily || !newFamilyName.trim()} style={{ width: "auto", padding: "0 20px", opacity: isCreatingFamily || !newFamilyName.trim() ? 0.5 : 1, cursor: isCreatingFamily || !newFamilyName.trim() ? "not-allowed" : "pointer" }}>
										{isCreatingFamily ? "Creating..." : "Create"}
									</button>
								</div>
								<div className="type-btns">
									<button className={`type-btn ${parentType === "mother" ? "selected" : ""}`} onClick={() => setParentType("mother")}>Mother</button>
									<button className={`type-btn ${parentType === "father" ? "selected" : ""}`} onClick={() => setParentType("father")}>Father</button>
								</div>
								{familyActionError && (
									<div style={{ color: "var(--rose-dark)", fontSize: 13, fontWeight: 700 }}>
										{familyActionError}
									</div>
								)}
								<div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
									<div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
										<input className="form-input" placeholder="Join Code" value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value)} style={{ marginBottom: 0 }} />
										<button className="submit-btn" onClick={handleJoinFamily} style={{ width: "auto", padding: "0 20px", background: "var(--text)", color: "white" }}>Join</button>
									</div>
									{isScanning ? (
										<div className="fade-in" style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", marginBottom: "12px" }}>
											<Scanner onScan={(result) => { if (result && result.length > 0) { setJoinCodeInput(result[0].rawValue); setIsScanning(false); } }} onError={() => { }} />
											<button className="cancel-btn" onClick={() => setIsScanning(false)} style={{ borderRadius: 0, border: "none", borderTop: "1px solid var(--border)", marginTop: 0 }}>Cancel Scan</button>
										</div>
									) : (
										<button className="submit-btn" onClick={() => setIsScanning(true)} style={{ background: "var(--cream2)", color: "var(--text)" }}>📷 Scan QR Code</button>
									)}
								</div>
							</>
						)}
					</div>
				) : (
					<div style={{ display: "grid", gap: "16px" }}>
						<div style={{ fontWeight: 800 }}>Members</div>
						<div style={{ display: "grid", gap: "8px" }}>
							{familyMembers.map((m) => {
								const isMe = m.userId === user?.uid;
								return (
									<div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", border: "1px solid var(--border)", borderRadius: "12px" }}>
										<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
											{m.photoURL ? (
												<img src={m.photoURL} alt={m.displayName} className="avatar-circle" style={{ width: 36, height: 36 }} />
											) : (
												<div className="avatar-circle" style={{ width: 36, height: 36, background: "var(--peach)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--rose-dark)" }}>
													{m.displayName?.charAt(0) || "?"}
												</div>
											)}
											<div>
												<div style={{ fontSize: "14px", fontWeight: 700 }}>
													{m.displayName} {isMe && <span style={{ color: "var(--rose-dark)" }}>(You)</span>}
												</div>
												<div style={{ fontSize: "12px", color: "var(--text2)", textTransform: "capitalize", fontWeight: 600 }}>
													{m.userId === user?.uid ? displayRole : m.role === "parent" && m.parentType === "father" ? "Father" : m.role === "parent" ? "Mother" : "Caregiver"}
												</div>
											</div>
										</div>
										<button onClick={() => { if (window.confirm(`Are you sure you want to ${isMe ? "leave the family" : "remove this member"}?`)) removeMember(m.id, m.userId); }} style={{ background: isMe ? "var(--peach)" : "var(--cream2)", border: "none", color: isMe ? "var(--rose-dark)" : "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 800, padding: "6px 12px", borderRadius: "8px" }}>
											{isMe ? "Leave" : "Remove"}
										</button>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			<div style={{ display: "grid", gap: "12px", paddingBottom: "24px" }}>
				{isSuperAdmin && (
					<button onClick={() => navigate("/admin")} className="submit-btn" style={{ background: "#33312e", color: "white" }}>
						Super Admin Dashboard
					</button>
				)}
				<button onClick={handleLogout} className="cancel-btn" style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
					Sign Out
				</button>
			</div>

			<div style={{
				textAlign: "center",
				padding: "8px 0 32px 0",
				color: "var(--text3)",
				fontSize: "12px",
				fontWeight: 700,
				display: "flex",
				flexDirection: "column",
				gap: "6px"
			}}>
				<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
					<span style={{ color: "var(--text)", fontWeight: 800, fontSize: "14px" }}>Bably 🌸</span>
					<span style={{
						background: "var(--peach)",
						padding: "2px 8px",
						borderRadius: "8px",
						fontSize: "10px",
						color: "var(--rose-dark)",
						fontWeight: 900,
						letterSpacing: "0.5px",
						textTransform: "uppercase"
					}}>Beta</span>
				</div>
				<div>Developed by Adwa Najmi &copy; 2026</div>
			</div>
		</div>
	);
}