export const formatTime = (ts) =>
	new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const timeSince = (ts) => {
	const mins = Math.floor((Date.now() - ts) / 60000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const h = Math.floor(mins / 60);
	return `${h}h ${mins % 60}m ago`;
};

export const getAgeString = (dobString) => {
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
