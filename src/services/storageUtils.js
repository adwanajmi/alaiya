import imageCompression from "browser-image-compression";
import {
	getDownloadURL,
	getStorage,
	ref,
	uploadBytesResumable,
} from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

const compressImage = (file) =>
	imageCompression(file, {
		maxSizeMB: 0.05,
		maxWidthOrHeight: 256,
		useWebWorker: true,
		fileType: "image/jpeg",
	});

const uploadImageAtPath = async (file, filePath, onProgress) => {
	const compressedFile = await compressImage(file);
	const storageRef = ref(storage, filePath);
	const task = uploadBytesResumable(storageRef, compressedFile, {
		contentType: "image/jpeg",
		cacheControl: "public, max-age=86400",
	});

	const snapshot = await new Promise((resolve, reject) => {
		task.on(
			"state_changed",
			(progressSnapshot) => {
				if (onProgress) {
					const pct = Math.round(
						(progressSnapshot.bytesTransferred / progressSnapshot.totalBytes) *
							100,
					);
					onProgress(pct);
				}
			},
			reject,
			() => resolve(task.snapshot),
		);
	});

	const url = await getDownloadURL(snapshot.ref);
	return `${url}&updated=${Date.now()}`;
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
		return await uploadImageAtPath(file, filePath, onProgress);
	} catch (error) {
		console.error("Image upload failed:", error);
		throw error;
	}
};

export const uploadUserProfileImage = async (file, uid, onProgress) => {
	if (!file) return null;

	try {
		const filePath = `users/${uid}/profile.jpg`;
		return await uploadImageAtPath(file, filePath, onProgress);
	} catch (error) {
		console.error("Profile image upload failed:", error);
		throw error;
	}
};
