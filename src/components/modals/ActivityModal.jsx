import { useEffect, useState } from "react";
import {
	ACTIVITY_CONFIG,
	ENCOURAGEMENT_MESSAGES,
} from "../../constants/activities";
import { useApp } from "../../contexts/AppContext";

export default function ActivityModal() {
	const {
		modal,
		closeModal,
		addLog,
		updateLog,
		openModal,
		activeBaby,
		userRole,
		userParentType,
		isSuperAdmin,
		showEncouragement,
	} = useApp();
	const [isSaving, setIsSaving] = useState(false);
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

	useEffect(() => {
		if (modal.isOpen && modal.type !== "menu") {
			const targetDate = modal.payload
				? new Date(modal.payload.timestamp || Date.now())
				: new Date();
			const offset = targetDate.getTimezoneOffset() * 60000;
			const local = new Date(targetDate.getTime() - offset);
			if (modal.payload) {
				setFormState({
					amount: modal.payload.amount || 120,
					unit: modal.payload.unit || "ml",
					feedType: modal.payload.feedType || "direct",
					duration: modal.payload.duration || 15,
					breastSide: modal.payload.breastSide || "left",
					bottleType: modal.payload.bottleType || "breastmilk",
					diaperType: modal.payload.diaperType || "wet",
					name: modal.payload.name || "",
					note: modal.payload.text || "",
					logDate: local.toISOString().split("T")[0],
					logTime: local.toISOString().split("T")[1].substring(0, 5),
				});
			} else {
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
					logDate: local.toISOString().split("T")[0],
					logTime: local.toISOString().split("T")[1].substring(0, 5),
				});
			}
		}
	}, [modal.isOpen, modal.type, modal.payload]);

	if (!modal.isOpen) return null;

	const handleModalSubmit = async () => {
		if (!activeBaby) return;
		setIsSaving(true);
		let customTimestamp = Date.now();
		if (formState.logDate && formState.logTime) {
			const [year, month, day] = formState.logDate.split("-");
			const [hour, minute] = formState.logTime.split(":");
			customTimestamp = new Date(year, month - 1, day, hour, minute).getTime();
		}
		const logData = {
			type: modal.type,
			text: formState.note,
			timestamp: customTimestamp,
		};
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
			if (modal.payload?.id) {
				await updateLog(modal.payload.id, logData);
			} else {
				await addLog(logData);
				let pool = [];
				if (userRole === "parent" || isSuperAdmin) {
					const parentMessages =
						ENCOURAGEMENT_MESSAGES.parent[userParentType] ||
						ENCOURAGEMENT_MESSAGES.parent.general;
					if (modal.type === "milk" && formState.feedType === "direct")
						pool = parentMessages.direct || parentMessages.general || parentMessages;
					else if (modal.type === "pump")
						pool = parentMessages.pump || parentMessages.general || parentMessages;
					else pool = parentMessages.general || ENCOURAGEMENT_MESSAGES.parent.general;
				} else {
					pool = ENCOURAGEMENT_MESSAGES.caregiver;
				}
				const lastMessage = localStorage.getItem("bably_last_encouragement");
				const nextPool =
					pool.length > 1 ? pool.filter((msg) => msg !== lastMessage) : pool;
				const message = nextPool[Math.floor(Math.random() * nextPool.length)];
				localStorage.setItem("bably_last_encouragement", message);
				showEncouragement(message);
			}
			closeModal();
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
							{Object.entries(ACTIVITY_CONFIG).map(([type, config]) => {
								if (
									type === "pump" &&
									userRole !== "parent" &&
									!isSuperAdmin
								)
									return null;
								return (
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
								);
							})}
						</div>
					</>
				)}

				{modal.type === "pump" && (
					<>
						<div className="modal-title">💧 Pumping</div>
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
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: "8px",
										}}
									>
										<label className="form-label" style={{ marginBottom: 0 }}>
											Amount
										</label>
										<div
											style={{
												display: "flex",
												gap: "4px",
												background: "var(--cream2)",
												padding: "2px",
												borderRadius: "8px",
											}}
										>
											<button
												style={{
													padding: "4px 12px",
													border: "none",
													borderRadius: "6px",
													fontSize: "12px",
													fontWeight: 700,
													background:
														formState.unit === "ml"
															? "var(--white)"
															: "transparent",
													color:
														formState.unit === "ml"
															? "var(--rose-dark)"
															: "var(--text3)",
													cursor: "pointer",
												}}
												onClick={() => setUnit("ml")}
											>
												ml
											</button>
											<button
												style={{
													padding: "4px 12px",
													border: "none",
													borderRadius: "6px",
													fontSize: "12px",
													fontWeight: 700,
													background:
														formState.unit === "oz"
															? "var(--white)"
															: "transparent",
													color:
														formState.unit === "oz"
															? "var(--rose-dark)"
															: "var(--text3)",
													cursor: "pointer",
												}}
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
					<div className="modal-title">
						{modal.type === "sleep" ? "😴 Log Sleep" : "🛁 Log Bath"}
					</div>
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
							{isSaving
								? "Saving..."
								: modal.payload
									? "Update Activity"
									: "Save Activity"}
						</button>
						<button
							className="cancel-btn"
							onClick={closeModal}
							disabled={isSaving}
						>
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
