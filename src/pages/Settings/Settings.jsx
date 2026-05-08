import { Scanner } from "@yudiel/react-qr-scanner";
import { useState } from "react";
import QRCode from "react-qr-code";
import { useNavigate } from "react-router-dom";
import ChildrenProfiles from "../../components/profiles/ChildrenProfiles";
import { useApp } from "../../contexts/AppContext";

export default function Settings() {
	const {
		user,
		family,
		familyMembers,
		pendingFamilyId,
		createFamily,
		joinFamily,
		confirmRole,
		cancelRoleSelection,
		removeMember,
		logout,
	} = useApp();
	const navigate = useNavigate();
	const [newFamilyName, setNewFamilyName] = useState("");
	const [joinCodeInput, setJoinCodeInput] = useState("");
	const [isScanning, setIsScanning] = useState(false);
	const [showQR, setShowQR] = useState(false);

	const handleCreateFamily = async () => {
		if (newFamilyName.trim()) await createFamily(newFamilyName);
	};

	const handleJoinFamily = async () => {
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
		if (family?.joinCode) {
			navigator.clipboard.writeText(family.joinCode);
			alert("Invite code copied to clipboard!");
		}
	};

	return (
		<div className="fade-in">
			<div className="section-title">Settings</div>

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
					<div
						style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}
					>
						Family Details
					</div>
					<h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 800 }}>
						{family.name}
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
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 12,
							marginBottom: 16,
						}}
					>
						<div
							style={{
								fontSize: 24,
								letterSpacing: 4,
								fontWeight: 900,
								color: "var(--rose-dark)",
								background: "var(--peach)",
								padding: "12px",
								borderRadius: "12px",
								flex: 1,
							}}
						>
							{family.joinCode}
						</div>
						<button
							onClick={handleCopyCode}
							style={{
								background: "var(--cream2)",
								border: "none",
								padding: "16px",
								borderRadius: "12px",
								cursor: "pointer",
								fontSize: 18,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							📋
						</button>
					</div>

					<button
						onClick={() => setShowQR(!showQR)}
						className="submit-btn"
						style={{
							background: "var(--cream2)",
							color: "var(--text)",
							padding: "12px",
						}}
					>
						{showQR ? "Hide QR Code" : "Show QR Code"}
					</button>

					{showQR && (
						<div
							className="fade-in"
							style={{
								marginTop: 20,
								display: "flex",
								justifyContent: "center",
								padding: 20,
								background: "var(--white)",
								border: "2px solid var(--cream2)",
								borderRadius: "var(--r)",
							}}
						>
							<QRCode value={family.joinCode} size={160} />
						</div>
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
				<div
					style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}
				>
					Family Management
				</div>

				{!family ? (
					<div style={{ display: "grid", gap: "16px" }}>
						{pendingFamilyId ? (
							<div style={{ display: "grid", gap: "12px" }}>
								<div style={{ fontWeight: 700 }}>Select your role:</div>
								<button
									className="submit-btn"
									onClick={() => confirmRole("parent")}
								>
									Join as Parent
								</button>
								<button
									className="submit-btn"
									onClick={() => confirmRole("caregiver")}
									style={{ background: "var(--cream2)", color: "var(--text)" }}
								>
									Join as Caregiver
								</button>
								<button className="cancel-btn" onClick={cancelRoleSelection}>
									Cancel
								</button>
							</div>
						) : (
							<>
								<div style={{ display: "flex", gap: "8px" }}>
									<input
										className="form-input"
										placeholder="New Family Name"
										value={newFamilyName}
										onChange={(e) => setNewFamilyName(e.target.value)}
										style={{ marginBottom: 0 }}
									/>
									<button
										className="submit-btn"
										onClick={handleCreateFamily}
										style={{ width: "auto", padding: "0 20px" }}
									>
										Create
									</button>
								</div>
								<div
									style={{
										borderTop: "1px solid var(--border)",
										paddingTop: "16px",
									}}
								>
									<div
										style={{
											display: "flex",
											gap: "8px",
											marginBottom: "12px",
										}}
									>
										<input
											className="form-input"
											placeholder="Join Code"
											value={joinCodeInput}
											onChange={(e) => setJoinCodeInput(e.target.value)}
											style={{ marginBottom: 0 }}
										/>
										<button
											className="submit-btn"
											onClick={handleJoinFamily}
											style={{
												width: "auto",
												padding: "0 20px",
												background: "var(--text)",
												color: "white",
											}}
										>
											Join
										</button>
									</div>
									{isScanning ? (
										<div
											className="fade-in"
											style={{
												borderRadius: "12px",
												overflow: "hidden",
												border: "1px solid var(--border)",
												marginBottom: "12px",
											}}
										>
											<Scanner
												onScan={(result) => {
													if (result && result.length > 0) {
														setJoinCodeInput(result[0].rawValue);
														setIsScanning(false);
													}
												}}
												onError={(error) => console.error(error)}
											/>
											<button
												className="cancel-btn"
												onClick={() => setIsScanning(false)}
												style={{
													borderRadius: 0,
													border: "none",
													borderTop: "1px solid var(--border)",
													marginTop: 0,
												}}
											>
												Cancel Scan
											</button>
										</div>
									) : (
										<button
											className="submit-btn"
											onClick={() => setIsScanning(true)}
											style={{
												background: "var(--cream2)",
												color: "var(--text)",
											}}
										>
											📷 Scan QR Code
										</button>
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
									<div
										key={m.id}
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											padding: "12px",
											border: "1px solid var(--border)",
											borderRadius: "12px",
										}}
									>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "12px",
											}}
										>
											{m.photoURL ? (
												<img
													src={m.photoURL}
													alt={m.displayName}
													style={{
														width: 36,
														height: 36,
														borderRadius: "50%",
														objectFit: "cover",
													}}
												/>
											) : (
												<div
													style={{
														width: 36,
														height: 36,
														borderRadius: "50%",
														background: "var(--peach)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontWeight: 800,
														color: "var(--rose-dark)",
													}}
												>
													{m.displayName?.charAt(0) || "?"}
												</div>
											)}
											<div>
												<div style={{ fontSize: "14px", fontWeight: 700 }}>
													{m.displayName}{" "}
													{isMe && (
														<span style={{ color: "var(--rose-dark)" }}>
															(You)
														</span>
													)}
												</div>
												<div
													style={{
														fontSize: "12px",
														color: "var(--text2)",
														textTransform: "capitalize",
														fontWeight: 600,
													}}
												>
													{m.role}
												</div>
											</div>
										</div>
										<button
											onClick={() => {
												if (
													window.confirm(
														`Are you sure you want to ${isMe ? "leave the family" : "remove this member"}?`,
													)
												)
													removeMember(m.id, m.userId);
											}}
											style={{
												background: isMe ? "var(--peach)" : "var(--cream2)",
												border: "none",
												color: isMe ? "var(--rose-dark)" : "var(--text2)",
												cursor: "pointer",
												fontSize: "13px",
												fontWeight: 800,
												padding: "6px 12px",
												borderRadius: "8px",
											}}
										>
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
				{user?.platformRole === "SUPER_ADMIN" && (
					<button
						onClick={() => navigate("/admin")}
						className="submit-btn"
						style={{ background: "#33312e", color: "white" }}
					>
						👑 Open Platform Admin
					</button>
				)}
				<button
					onClick={handleLogout}
					className="cancel-btn"
					style={{
						background: "var(--white)",
						border: "1px solid var(--border)",
						borderRadius: "var(--r)",
					}}
				>
					Sign Out
				</button>
			</div>
		</div>
	);
}
