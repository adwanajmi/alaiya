import { useState, useEffect } from "react";
import { ACTIVITY_CONFIG } from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";

export default function ActivityModal() {
	const { modal, closeModal, addLog, openModal, activeBaby } = useApp();
	const [formState, setFormState] = useState({
		amount: 120,
		unit: "ml",
		feedType: "direct",
		duration: 15,
		breastSide: "left",
		bottleType: "breastmilk",
		diaperType: "wet",
		name: "",
		note: "",
		logDate: "",
		logTime: "",
	});
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (modal.isOpen && modal.type !== "menu") {
			const d = new Date();
			const offset = d.getTimezoneOffset() * 60000;
			const local = new Date(d.getTime() - offset);
			setFormState((prev) => ({
				...prev,
				logDate: local.toISOString().split("T")[0],
				logTime: local.toISOString().split("T")[1].substring(0, 5),
			}));
		}
	}, [modal.isOpen, modal.type]);

	if (!modal.isOpen) return null;

	const handleModalSubmit = async () => {
		if (!activeBaby) {
			alert("Error: No active baby profile found.");
			return;
		}

		setIsSaving(true);
		
		let customTimestamp = Date.now();
		if (formState.logDate && formState.logTime) {
			const [year, month, day] = formState.logDate.split("-");
			const [hour, minute] = formState.logTime.split(":");
			customTimestamp = new Date(year, month - 1, day, hour, minute).getTime();
		}

		const logData = { type: modal.type, text: formState.note, timestamp: customTimestamp };
		
		if (modal.type === "milk") {
			logData.feedType = formState.feedType;
			if (formState.feedType === "bottle") {
				logData.amount = formState.amount;
				logData.unit = formState.unit;
				logData.bottleType = formState.bottleType;
			} else {
				logData.duration = formState.duration;
				logData.breastSide = formState.breastSide;
			}
		}
		if (modal.type === "pump") {
			logData.amount = formState.amount;
			logData.unit = formState.unit;
			logData.breastSide = formState.breastSide;
		}
		if (modal.type === "diaper") logData.diaperType = formState.diaperType;
		if (modal.type === "meds") logData.name = formState.name || "Medication";
		if (modal.type === "sleep") logData.isSleeping = true;

		try {
			await addLog(logData);
			
			setFormState({
				amount: 120,
				unit: "ml",
				feedType: "direct",
				duration: 15,
				breastSide: "left",
				bottleType: "breastmilk",
				diaperType: "wet",
				name: "",
				note: "",
				logDate: "",
				logTime: "",
			});
			closeModal();
		} catch (error) {
			console.error("Save Error:", error);
			alert("Failed to save. Check browser console.");
		} finally {
			setIsSaving(false);
		}
	};

	const adjAmount = (delta) => {
		const step = formState.unit === "oz" ? 0.5 : 10;
		const min = formState.unit === "oz" ? 0.5 : 10;
		setFormState((prev) => ({
			...prev,
			amount: Math.max(min, prev.amount + delta * step),
		}));
	};

	const adjDuration = (delta) =>
		setFormState((prev) => ({
			...prev,
			duration: Math.max(1, prev.duration + delta * 5),
		}));

	const setUnit = (unit) => {
		if (formState.unit === unit) return;
		setFormState((prev) => {
			let newAmt = prev.amount;
			if (unit === "oz") newAmt = Math.round((prev.amount / 30) * 2) / 2;
			if (unit === "ml") newAmt = Math.round(prev.amount * 30);
			return { ...prev, unit, amount: newAmt };
		});
	};

	return (
		<div
			className="modal-overlay"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget && !isSaving) closeModal();
			}}
		>
			<div className="modal">
				<div className="modal-handle"></div>

				{modal.type === "menu" && (
					<>
						<div className="modal-title">Log Activity</div>
						<div className="quick-btns-grid">
							{Object.entries(ACTIVITY_CONFIG).map(([type, config]) => (
								<button
									key={type}
									className="grid-btn"
									onClick={() => openModal(type)}
								>
									<div className={`grid-icon ${config.color}`}>
										{config.emoji}
									</div>
									<div className="grid-label">{config.title}</div>
								</button>
							))}
						</div>
					</>
				)}

				{modal.type === "pump" && (
					<>
						<div className="modal-title">💧 Breast Pump</div>
						<div className="form-group">
							<label className="form-label">Side</label>
							<div className="type-btns">
								{["left", "both", "right"].map((side) => (
									<button
										key={side}
										onClick={() =>
											setFormState({ ...formState, breastSide: side })
										}
										className={`type-btn ${formState.breastSide === side ? "selected" : ""}`}
										style={{ textTransform: "capitalize" }}
									>
										{side}
									</button>
								))}
							</div>
						</div>
						<div className="form-group">
							<label className="form-label">Unit</label>
							<div className="type-btns">
								<button
									className={`type-btn ${formState.unit === "ml" ? "selected" : ""}`}
									onClick={() => setUnit("ml")}
								>
									ml
								</button>
								<button
									className={`type-btn ${formState.unit === "oz" ? "selected" : ""}`}
									onClick={() => setUnit("oz")}
								>
									oz
								</button>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label">Total Amount</label>
							<div className="amount-row">
								<button className="amount-btn" onClick={() => adjAmount(-1)}>
									−
								</button>
								<span className="amount-val">{formState.amount}</span>
								<span className="amount-unit">{formState.unit}</span>
								<button className="amount-btn" onClick={() => adjAmount(1)}>
									+
								</button>
							</div>
						</div>
					</>
				)}

				{modal.type === "milk" && (
					<>
						<div className="modal-title">🍼 Feed Baby</div>
						<div className="form-group">
							<label className="form-label">Method</label>
							<div className="type-btns">
								<button
									className={`type-btn ${formState.feedType === "direct" ? "selected" : ""}`}
									onClick={() =>
										setFormState({ ...formState, feedType: "direct" })
									}
								>
									🤱 Direct
								</button>
								<button
									className={`type-btn ${formState.feedType === "bottle" ? "selected" : ""}`}
									onClick={() =>
										setFormState({ ...formState, feedType: "bottle" })
									}
								>
									🍼 Bottle
								</button>
							</div>
						</div>
						{formState.feedType === "direct" ? (
							<>
								<div className="form-group">
									<label className="form-label">Side</label>
									<div className="type-btns">
										{["left", "right"].map((side) => (
											<button
												key={side}
												onClick={() =>
													setFormState({ ...formState, breastSide: side })
												}
												className={`type-btn ${formState.breastSide === side ? "selected" : ""}`}
												style={{ textTransform: "capitalize" }}
											>
												{side}
											</button>
										))}
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Duration</label>
									<div className="amount-row">
										<button
											className="amount-btn"
											onClick={() => adjDuration(-1)}
										>
											−
										</button>
										<span className="amount-val">{formState.duration}</span>
										<span className="amount-unit">mins</span>
										<button
											className="amount-btn"
											onClick={() => adjDuration(1)}
										>
											+
										</button>
									</div>
								</div>
							</>
						) : (
							<>
								<div className="form-group">
									<label className="form-label">Milk Type</label>
									<div className="type-btns">
										<button
											className={`type-btn ${formState.bottleType === "breastmilk" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, bottleType: "breastmilk" })
											}
										>
											Breast Milk
										</button>
										<button
											className={`type-btn ${formState.bottleType === "formula" ? "selected" : ""}`}
											onClick={() =>
												setFormState({ ...formState, bottleType: "formula" })
											}
										>
											Formula
										</button>
									</div>
								</div>
								<div className="form-group">
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
										<label className="form-label" style={{ marginBottom: 0 }}>Amount</label>
										<div style={{ display: "flex", gap: "4px", background: "var(--cream2)", padding: "2px", borderRadius: "8px" }}>
											<button
												style={{ padding: "4px 12px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: formState.unit === "ml" ? "var(--white)" : "transparent", color: formState.unit === "ml" ? "var(--rose-dark)" : "var(--text3)", boxShadow: formState.unit === "ml" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", cursor: "pointer" }}
												onClick={() => setUnit("ml")}
											>
												ml
											</button>
											<button
												style={{ padding: "4px 12px", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, background: formState.unit === "oz" ? "var(--white)" : "transparent", color: formState.unit === "oz" ? "var(--rose-dark)" : "var(--text3)", boxShadow: formState.unit === "oz" ? "0 2px 4px rgba(0,0,0,0.05)" : "none", cursor: "pointer" }}
												onClick={() => setUnit("oz")}
											>
												oz
											</button>
										</div>
									</div>
									<div className="amount-row">
										<button
											className="amount-btn"
											onClick={() => adjAmount(-1)}
										>
											−
										</button>
										<span className="amount-val">{formState.amount}</span>
										<span className="amount-unit">{formState.unit}</span>
										<button className="amount-btn" onClick={() => adjAmount(1)}>
											+
										</button>
									</div>
								</div>
							</>
						)}
					</>
				)}

				{modal.type === "diaper" && (
					<>
						<div className="modal-title">🧷 Diaper Change</div>
						<div className="form-group">
							<label className="form-label">Type</label>
							<div className="type-btns">
								{[
									{ val: "wet", label: "💧 Wet" },
									{ val: "dirty", label: "💩 Dirty" },
									{ val: "both", label: "Both" },
								].map(({ val, label }) => (
									<button
										key={val}
										className={`type-btn ${formState.diaperType === val ? "selected" : ""}`}
										onClick={() =>
											setFormState({ ...formState, diaperType: val })
										}
									>
										{label}
									</button>
								))}
							</div>
						</div>
					</>
				)}

				{(modal.type === "sleep" || modal.type === "bath") && (
					<>
						<div className="modal-title">
							{modal.type === "sleep" ? "😴 Log Sleep" : "🛁 Log Bath"}
						</div>
					</>
				)}

				{modal.type === "meds" && (
					<>
						<div className="modal-title">💊 Medication</div>
						<div className="form-group">
							<label className="form-label">Medication Name</label>
							<input
								className="form-input"
								placeholder="e.g. Vitamin D drops"
								value={formState.name}
								onChange={(e) =>
									setFormState({ ...formState, name: e.target.value })
								}
							/>
						</div>
					</>
				)}

				{modal.type !== "menu" && (
					<>
						<div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Date</label>
								<input
									type="date"
									value={formState.logDate}
									onChange={(e) =>
										setFormState({ ...formState, logDate: e.target.value })
									}
									className="form-input"
								/>
							</div>
							<div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
								<label className="form-label">Time</label>
								<input
									type="time"
									value={formState.logTime}
									onChange={(e) =>
										setFormState({ ...formState, logTime: e.target.value })
									}
									className="form-input"
								/>
							</div>
						</div>
						<div className="form-group">
							<label className="form-label">Notes (Optional)</label>
							<input
								className="form-input"
								placeholder="e.g. Fussy today"
								value={formState.note}
								onChange={(e) =>
									setFormState({ ...formState, note: e.target.value })
								}
							/>
						</div>
						<button 
							className="submit-btn" 
							onClick={handleModalSubmit}
							disabled={isSaving}
							style={{ opacity: isSaving ? 0.7 : 1 }}
						>
							{isSaving ? "Saving..." : "Save Activity"}
						</button>
						<button className="cancel-btn" onClick={closeModal} disabled={isSaving}>
							Cancel
						</button>
					</>
				)}

				{modal.type === "menu" && (
					<button
						className="cancel-btn"
						onClick={closeModal}
						style={{ marginTop: 12 }}
					>
						Close
					</button>
				)}
			</div>
		</div>
	);
}