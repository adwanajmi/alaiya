import { useState } from "react";
import { useApp } from "../../contexts/AppContext";
import { Scanner } from '@yudiel/react-qr-scanner';

export default function OnboardingFlow({ step }) {
	const {
		logout,
		createFamily,
		joinFamily,
		confirmRole,
		cancelRoleSelection,
		addBaby,
	} = useApp();

	const [familyMode, setFamilyMode] = useState("join");
	const [familyName, setFamilyName] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [joinError, setJoinError] = useState("");
	const [joining, setJoining] = useState(false);

	// Added weight and height state
	const [babyName, setBabyName] = useState("");
	const [babyDob, setBabyDob] = useState("");
	const [babyWeight, setBabyWeight] = useState("");
	const [babyHeight, setBabyHeight] = useState("");
	const [babyGender, setBabyGender] = useState("girl");

	const [isScanning, setIsScanning] = useState(false);

	if (step === "role-select") {
		return (
			<div className="app" style={{ minHeight: "100vh", padding: "24px" }}>
				<div
					style={{
						background: "var(--white)",
						padding: "24px",
						borderRadius: "var(--r)",
						border: "1px solid var(--border)",
						marginTop: "40px",
					}}
				>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 800,
							marginBottom: 8,
							textAlign: "center",
						}}
					>
						Choose your role
					</h2>
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "12px",
							marginTop: 24,
						}}
					>
						<button
							onClick={() => confirmRole("parent")}
							className="submit-btn"
						>
							👪 Parent
						</button>
						<button
							onClick={() => confirmRole("caregiver")}
							className="submit-btn"
							style={{ background: "var(--cream2)", color: "var(--text)" }}
						>
							🍼 Caregiver
						</button>
						<button onClick={cancelRoleSelection} className="cancel-btn">
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (step === "join-create") {
		return (
			<div className="app" style={{ minHeight: "100vh", padding: "24px" }}>
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
					<div className="logo" style={{ fontSize: 30 }}>Alaiya 🌸</div>
					<button onClick={logout} className="cancel-btn" style={{ width: "auto", padding: "6px 16px" }}>Sign Out</button>
				</div>
				
				<div style={{ display: "flex", background: "var(--cream2)", borderRadius: "var(--r)", padding: 4, marginBottom: 20 }}>
					{["join", "create"].map((mode) => (
						<button key={mode} onClick={() => { setFamilyMode(mode); setJoinError(""); setIsScanning(false); }} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "var(--r2)", fontFamily: "inherit", fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "all 0.15s", background: familyMode === mode ? "var(--white)" : "transparent", color: familyMode === mode ? "var(--rose-dark)" : "var(--text3)", boxShadow: familyMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
							{mode === "join" ? "Join Family" : "Create New"}
						</button>
					))}
				</div>

				<div style={{ background: "var(--white)", padding: "24px", borderRadius: "var(--r)", boxShadow: "0 8px 32px rgba(0,0,0,0.04)" }}>
					{familyMode === "join" ? (
						<>
							{!isScanning ? (
								<>
									<input type="text" placeholder="8-Digit Code" value={joinCode} onChange={(e) => { setJoinCode(e.target.value); setJoinError(""); }} className="form-input" style={{ marginBottom: 16, textTransform: "uppercase", textAlign: "center", letterSpacing: 2, fontSize: 20 }} maxLength={8} />
									
									{joinError && <p style={{ color: "var(--rose-dark)", fontSize: 13, fontWeight: 700, marginBottom: 12, textAlign: "center" }}>{joinError}</p>}
									
									<button onClick={async () => { setJoining(true); const err = await joinFamily(joinCode); if (err) setJoinError(err); setJoining(false); }} className="submit-btn" disabled={joining || joinCode.length < 8} style={{ opacity: joinCode.length < 8 ? 0.5 : 1, marginBottom: 12 }}>
										{joining ? "Joining..." : "Continue"}
									</button>

									<div style={{ textAlign: "center", color: "var(--text3)", fontSize: 13, fontWeight: 700, margin: "16px 0" }}>OR</div>

									<button onClick={() => setIsScanning(true)} style={{ width: "100%", background: "var(--cream2)", color: "var(--text)", border: "none", padding: "16px", borderRadius: "var(--r2)", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
										📷 Scan QR Code
									</button>
								</>
							) : (
								<div className="fade-in" style={{ textAlign: "center" }}>
									<h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Position QR Code in frame</h3>
									<div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: 16 }}>
										<Scanner 
											onResult={async (text) => {
												setIsScanning(false);
												setJoinCode(text);
												setJoining(true); 
												const err = await joinFamily(text); 
												if (err) setJoinError(err); 
												setJoining(false);
											}} 
											onError={(error) => console.log(error?.message)} 
										/>
									</div>
									<button onClick={() => setIsScanning(false)} className="cancel-btn">
										Cancel Scanning
									</button>
								</div>
							)}
						</>
					) : (
						<>
							<input type="text" placeholder="Family Name (e.g. The Smiths)" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="form-input" style={{ marginBottom: 16 }} />
							<button onClick={() => createFamily(familyName)} className="submit-btn" disabled={!familyName.trim()} style={{ opacity: !familyName.trim() ? 0.5 : 1 }}>Create Family</button>
						</>
					)}
				</div>
			</div>
		);
	}

	if (step === "add-baby") {
		return (
			<div className="app" style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
				<div style={{ background: "var(--white)", padding: "24px", borderRadius: "var(--r)", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
					<div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>🍼</div>
					<h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>Add Your Baby</h2>
					
					<div className="type-btns" style={{ marginBottom: 16 }}>
						<button className={`type-btn ${babyGender === "girl" ? "selected" : ""}`} onClick={() => setBabyGender("girl")}>👧 Girl</button>
						<button className={`type-btn ${babyGender === "boy" ? "selected" : ""}`} onClick={() => setBabyGender("boy")}>👦 Boy</button>
					</div>

					<div className="form-group" style={{ marginBottom: 12 }}>
						<label className="form-label">Name</label>
						<input type="text" placeholder="e.g. Alaiya" value={babyName} onChange={(e) => setBabyName(e.target.value)} className="form-input" />
					</div>
					<div className="form-group" style={{ marginBottom: 12 }}>
						<label className="form-label">Date of Birth</label>
						<input type="date" value={babyDob} onChange={(e) => setBabyDob(e.target.value)} className="form-input" />
					</div>
					
					<div style={{ display: "flex", gap: "12px", marginBottom: 24 }}>
						<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
							<label className="form-label">Weight (kg)</label>
							<input type="number" step="0.01" placeholder="e.g. 3.5" value={babyWeight} onChange={(e) => setBabyWeight(e.target.value)} className="form-input" />
						</div>
						<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
							<label className="form-label">Height (cm)</label>
							<input type="number" step="0.1" placeholder="e.g. 50" value={babyHeight} onChange={(e) => setBabyHeight(e.target.value)} className="form-input" />
						</div>
					</div>

					<button onClick={() => addBaby({ name: babyName, dob: babyDob, weight: babyWeight, height: babyHeight, gender: babyGender })} className="submit-btn" disabled={!babyName || !babyDob} style={{ opacity: (!babyName || !babyDob) ? 0.5 : 1 }}>
						Save Profile
					</button>
				</div>
			</div>
		);
	}
	return null;
}
