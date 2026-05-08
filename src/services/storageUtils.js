import imageCompression from "browser-image-compression";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "./firebase"; // Make sure this points to your firebase config

const storage = getStorage(app);

export const uploadOptimizedImage = async (
	file,
	familyId,
	folder,
	filename,
) => {
	if (!file) return null;

	// Aggressive compression for profile pictures (max 50KB, 256x256)
	const options = {
		maxSizeMB: 0.05,
		maxWidthOrHeight: 256,
		useWebWorker: true,
		fileType: "image/jpeg",
	};

	try {
		const compressedFile = await imageCompression(file, options);
		const filePath = `families/${familyId}/${folder}/${filename}.jpg`;
		const storageRef = ref(storage, filePath);

		const snapshot = await uploadBytes(storageRef, compressedFile, {
			contentType: "image/jpeg",
			cacheControl: "public, max-age=31536000",
		});

		return await getDownloadURL(snapshot.ref);
	} catch (error) {
		console.error("Image upload failed:", error);
		throw error;
	}
};
