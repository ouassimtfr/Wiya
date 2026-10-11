// Compresse une photo avant l'envoi : redimensionne et convertit en JPEG.
// Une photo d'iPhone de 4-6 Mo devient ~200-400 Ko, donc l'upload est beaucoup plus rapide.
// Si quelque chose échoue, on renvoie la photo d'origine (jamais d'erreur bloquante).

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

export async function compressImage(file: File, maxSize = 1280, quality = 0.8): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const img = await loadImage(file);
    const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * ratio);
    const height = Math.round(img.naturalHeight * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Fond blanc pour les PNG transparents (sinon ils deviennent noirs en JPEG)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function compressImages(files: File[], maxSize = 1280, quality = 0.8): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, maxSize, quality)));
}
