import { useEffect, useRef, useState } from "react";
import { useApp } from "../../contexts/AppContext";

export default function ImageViewer() {
	const { viewedImage, closeImageViewer } = useApp();
	const [isVisible, setIsVisible] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const overlayRef = useRef(null);

	useEffect(() => {
		if (viewedImage) {
			setIsVisible(true);
			setIsClosing(false);
			setImageLoaded(false);
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [viewedImage]);

	const handleClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			setIsVisible(false);
			setIsClosing(false);
			closeImageViewer();
		}, 280);
	};

	const handleOverlayClick = (e) => {
		if (e.target === overlayRef.current) {
			handleClose();
		}
	};

	const handleDownload = async () => {
		const url = typeof viewedImage === "string" ? viewedImage : viewedImage?.url;
		if (!url) return;
		try {
			const response = await fetch(url);
			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = blobUrl;
			a.download = `photo_${Date.now()}.jpg`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(blobUrl);
		} catch {
			window.open(url, "_blank");
		}
	};

	if (!viewedImage && !isVisible) return null;

	const imageUrl = typeof viewedImage === "string" ? viewedImage : viewedImage?.url;
	const imageLabel = typeof viewedImage === "object" ? viewedImage?.label : null;

	return (
		<div
			ref={overlayRef}
			className={`image-viewer-overlay ${isClosing ? "image-viewer-closing" : ""}`}
			onClick={handleOverlayClick}
			role="dialog"
			aria-modal="true"
			aria-label="Image preview"
		>
			{/* Top bar */}
			<div className="image-viewer-topbar">
				<button
					className="image-viewer-action-btn"
					onClick={handleClose}
					aria-label="Close preview"
				>
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<line x1="18" y1="6" x2="6" y2="18" />
						<line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>

				{imageLabel && (
					<div className="image-viewer-label">{imageLabel}</div>
				)}

				<button
					className="image-viewer-action-btn"
					onClick={handleDownload}
					aria-label="Download image"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
						<polyline points="7 10 12 15 17 10" />
						<line x1="12" y1="15" x2="12" y2="3" />
					</svg>
				</button>
			</div>

			{/* Image container */}
			<div className="image-viewer-content">
				{!imageLoaded && (
					<div className="image-viewer-spinner">
						<div className="image-viewer-spinner-ring" />
					</div>
				)}
				<img
					src={imageUrl}
					alt={imageLabel || "Preview"}
					className={`image-viewer-img ${imageLoaded ? "image-viewer-img-loaded" : ""}`}
					onClick={(e) => e.stopPropagation()}
					onLoad={() => setImageLoaded(true)}
					draggable={false}
				/>
			</div>

			{/* Bottom hint */}
			<div className="image-viewer-hint">
				Tap outside to close
			</div>
		</div>
	);
}