import imageCompression from "browser-image-compression";
import {
	getDownloadURL,
	ref,
	uploadBytes,
	uploadBytesResumable,
} from "firebase/storage";
import { storage, storageBucket } from "./firebase";

const UPLOAD_TIMEOUT_MS = 45000;

const compressImage = (file) =>
	imageCompression(file, {
		maxSizeMB: 0.2,
		maxWidthOrHeight: 512,
		useWebWorker: false,
		fileType: "image/jpeg",
	});

const describeUploadError = (error) => {
	if (!storageBucket) {
		return "Firebase Storage bucket is missing. Check VITE_FIREBASE_STORAGE_BUCKET.";
	}
	if (error?.code === "storage/unauthorized") {
		return "Upload blocked by Firebase Storage rules. Please deploy the latest storage.rules.";
	}
	if (error?.code === "storage/canceled") {
		return "Upload was canceled. Please try again.";
	}
	if (error?.code === "storage/retry-limit-exceeded") {
		return "Upload could not reach Firebase Storage. Check connection or CORS settings.";
	}
	return error?.message || "Upload failed. Please try again.";
};

const emitProgress = (onProgress, payload) => {
	if (onProgress) onProgress(payload);
};

const uploadImageAtPath = async (file, filePath, onProgress) => {
	if (!storageBucket) {
		throw new Error("Firebase Storage bucket is missing.");
	}
	emitProgress(onProgress, { stage: "compressing", progress: 1 });
	const compressedFile = await compressImage(file);
	emitProgress(onProgress, { stage: "uploading", progress: 3 });
	const storageRef = ref(storage, filePath);
	const task = uploadBytesResumable(storageRef, compressedFile, {
		contentType: "image/jpeg",
		cacheControl: "public, max-age=3600",
	});

	const snapshot = await new Promise((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			task.cancel();
			reject(new Error("Upload timed out before Firebase reported progress."));
		}, UPLOAD_TIMEOUT_MS);

		task.on(
			"state_changed",
			(progressSnapshot) => {
				const pct = progressSnapshot.totalBytes
					? Math.max(
							3,
							Math.round(
								(progressSnapshot.bytesTransferred /
									progressSnapshot.totalBytes) *
									100,
							),
						)
					: 3;
				emitProgress(onProgress, { stage: "uploading", progress: pct });
			},
			(error) => {
				window.clearTimeout(timeout);
				reject(error);
			},
			() => {
				window.clearTimeout(timeout);
				resolve(task.snapshot);
			},
		);
	});

	emitProgress(onProgress, { stage: "saving", progress: 100 });
	const url = await getDownloadURL(snapshot.ref);
	return `${url}&updated=${Date.now()}`;
};

const uploadImageWithFallback = async (file, filePath, onProgress) => {
	try {
		return await uploadImageAtPath(file, filePath, onProgress);
	} catch (error) {
		if (error?.code === "storage/unauthorized") throw error;
		emitProgress(onProgress, { stage: "uploading", progress: 8 });
		const compressedFile = await compressImage(file);
		const storageRef = ref(storage, filePath);
		const snapshot = await uploadBytes(storageRef, compressedFile, {
			contentType: "image/jpeg",
			cacheControl: "public, max-age=3600",
		});
		emitProgress(onProgress, { stage: "saving", progress: 100 });
		const url = await getDownloadURL(snapshot.ref);
		return `${url}&updated=${Date.now()}`;
	}
};

export const uploadOptimizedImage = async (
	file,
	_familyId,
	_folder,
	babyId,
	onProgress,
) => {
	if (!file) return null;

	try {
		const filePath = `babies/${babyId}/profile.jpg`;
		return await uploadImageWithFallback(file, filePath, onProgress);
	} catch (error) {
		console.error("Image upload failed:", error);
		throw new Error(describeUploadError(error), { cause: error });
	}
};

export const uploadUserProfileImage = async (file, uid, onProgress) => {
	if (!file) return null;

	try {
		const filePath = `users/${uid}/profile.jpg`;
		return await uploadImageWithFallback(file, filePath, onProgress);
	} catch (error) {
		console.error("Profile image upload failed:", error);
		throw new Error(describeUploadError(error), { cause: error });
	}
};
