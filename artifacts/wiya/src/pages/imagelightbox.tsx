import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const goNext = () => setIndex((i) => (i + 1) % images.length);
  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!images || images.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 50) goPrev();
    else if (deltaX < -50) goNext();
    setTouchStartX(null);
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex justify-end p-4 flex-shrink-0">
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-2 relative">
        {images.length > 1 && (
          <button onClick={goPrev} className="absolute left-2 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center z-10">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        <img src={images[index]} alt="" className="max-w-full max-h-full object-contain" />

        {images.length > 1 && (
          <button onClick={goNext} className="absolute right-2 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center z-10">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-6 pt-2 flex-shrink-0">
          {images.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
