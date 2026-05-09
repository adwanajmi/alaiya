import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Compress/resize an image using canvas.
 * Falls back to the original file if anything goes wrong.
 */
const compressImage = (file, maxSize = 512, quality = 0.85) => {
  return new Promise((resolve) => {
    // If the file is already small enough, skip compression
    if (file.size <= 150 * 1024) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let { width, height } = img;

        // Scale down if needed
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        // White background (handles transparent PNGs)
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size < 100) {
              // Compression produced invalid output, use original
              resolve(file);
              return;
            }
            // Return as a proper File object so Firebase gets a valid upload
            const compressedFile = new File([blob], "profile.jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          quality,
        );
      } catch {
        // Canvas error — use original
        resolve(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Can't decode image — use original file as-is
      resolve(file);
    };

    img.src = url;
  });
};

const uploadImageAtPath = async (file, filePath, onProgress) => {
  const compressedFile = await compressImage(file);
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, filePath);
    const task = uploadBytesResumable(storageRef, compressedFile, {
      contentType: "image/jpeg",
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
          resolve(`${url}&t=${Date.now()}`);
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