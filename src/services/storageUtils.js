import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

const uploadImageAtPath = (file, filePath, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, filePath);
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "image/jpeg",
      cacheControl: "public, max-age=86400",
    });

    task.on(
      "state_changed",
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(`${url}?t=${Date.now()}`);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const uploadOptimizedImage = async (file, _familyId, _folder, babyId, onProgress) => {
  if (!file) return null;
  return uploadImageAtPath(file, `babies/${babyId}/profile.jpg`, onProgress);
};

export const uploadUserProfileImage = async (file, uid, onProgress) => {
  if (!file) return null;
  return uploadImageAtPath(file, `users/${uid}/profile.jpg`, onProgress);
};