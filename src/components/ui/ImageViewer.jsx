import { useApp } from "../../contexts/AppContext";

export default function ImageViewer() {
	const { viewedImage, closeImageViewer } = useApp();

	if (!viewedImage) return null;

	return (
		<div className="image-viewer-overlay fade-in" onClick={closeImageViewer}>
			<button className="image-viewer-close" onClick={closeImageViewer}>
				✕
			</button>
			<img
				src={viewedImage}
				alt="Preview"
				className="image-viewer-img"
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}