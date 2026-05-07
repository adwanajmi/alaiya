import { useState } from "react";
import { ACTIVITY_CONFIG } from "../../constants/activities"; // We'll create this file in step 5!
import { useApp } from "../../contexts/AppContext";

export default function ActivityModal() {
	const { modal, closeModal, addLog, openModal } = useApp();
	const [formState, setFormState] = useState({
		amount: 120,
		unit: "ml",
		feedType: "direct",
		duration: 15,
		breastSide: "both",
		diaperType: "wet",
		name: "",
		note: "",
	});

	if (!modal.isOpen) return null;

	const handleModalSubmit = () => {
		const logData = { type: modal.type, text: formState.note };
		if (modal.type === "milk") {
			logData.feedType = formState.feedType;
			if (formState.feedType === "bottle") {
				logData.amount = formState.amount;
				logData.unit = formState.unit;
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

		addLog(logData);
		closeModal();
		// Reset form for next time
		setFormState({
			amount: 120,
			unit: "ml",
			feedType: "direct",
			duration: 15,
			breastSide: "both",
			diaperType: "wet",
			name: "",
			note: "",
		});
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
		setFormState((prev) => {
			let newAmt = prev.amount;
			if (unit === "oz" && prev.amount >= 10)
				newAmt = Math.round((prev.amount / 30) * 2) / 2;
			if (unit === "ml" && prev.amount <= 15)
				newAmt = Math.round(prev.amount * 30);
			return { ...prev, unit, amount: newAmt };
		});
	};

	return (
		<div
			className="modal-overlay"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) closeModal();
			}}
		>
			<div className="modal">
				<div className="modal-handle"></div>

				{/* FULL MENU (More Button) */}
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

				{/* PUMP */}
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

				{/* MILK (Direct/Bottle) */}
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
									<label className="form-label">Amount</label>
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

				{/* DIAPER */}
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

				{/* SLEEP / BATH (Quick Loggers) */}
				{(modal.type === "sleep" || modal.type === "bath") && (
					<>
						<div className="modal-title">
							{modal.type === "sleep" ? "😴 Log Sleep" : "🛁 Log Bath"}
						</div>
						<div
							style={{
								background: "var(--cream2)",
								padding: 20,
								borderRadius: "var(--r2)",
								textAlign: "center",
								marginBottom: 20,
								fontWeight: 700,
								color: "var(--text2)",
							}}
						>
							Will be logged at{" "}
							{new Date().toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})}
						</div>
					</>
				)}

				{/* MEDS */}
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

				{/* Optional Notes for everything except Menu */}
				{modal.type !== "menu" && (
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
				)}

				{modal.type !== "menu" && (
					<>
						<button className="submit-btn" onClick={handleModalSubmit}>
							Save Activity
						</button>
						<button className="cancel-btn" onClick={closeModal}>
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
