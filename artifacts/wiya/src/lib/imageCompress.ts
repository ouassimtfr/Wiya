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
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  maxSize = 1280,
  quality = 0.8
): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

    const img = await loadImage(file);
    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    // Fond blanc : sans ça, les parties transparentes d'un PNG deviennent noires en JPEG
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;
    // On garde l'original seulement s'il est déjà un JPEG plus léger
    if (file.type === "image/jpeg" && blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function compressImages(
  files: File[],
  maxSize = 1280,
  quality = 0.8
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, maxSize, quality)));
}

/**
 * Améliore une photo automatiquement, gratuitement, sans IA, directement sur le téléphone :
 * étire la luminosité (photo terne), éclaircit si elle est sombre,
 * renforce un peu les couleurs et la netteté.
 */
export async function enhanceImage(
  file: File,
  maxSize = 1280,
  quality = 0.88
): Promise<File> {
  try {
    const img = await loadImage(file);
    const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    const total = width * height;

    // 1. Histogramme de luminosité
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      hist[(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) | 0]++;
    }
    const percentile = (p: number) => {
      const target = total * p;
      let acc = 0;
      for (let v = 0; v < 256; v++) {
        acc += hist[v];
        if (acc >= target) return v;
      }
      return 255;
    };

    // 2. Étirement du contraste (on ignore les 1 % les plus extrêmes)
    let low = percentile(0.01);
    let high = percentile(0.99);
    if (high - low < 40) {
      // photo déjà très plate : on évite d'amplifier le bruit
      low = 0;
      high = 255;
    }
    const scale = 255 / (high - low);
    const stretch = (v: number) => Math.max(0, Math.min(255, (v - low) * scale));

    // 3. Éclaircissement doux si la photo est sombre
    let mean = 0;
    for (let v = 0; v < 256; v++) mean += hist[v] * stretch(v);
    mean = mean / total / 255;
    const gamma =
      mean < 0.48 ? Math.max(0.6, Math.log(0.48) / Math.log(Math.max(0.05, mean))) : 1;

    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      lut[v] = 255 * Math.pow(stretch(v) / 255, gamma);
    }

    // 4. Application + couleurs un peu plus vives
    const sat = 1.12;
    for (let i = 0; i < d.length; i += 4) {
      const r = lut[d[i]];
      const g = lut[d[i + 1]];
      const b = lut[d[i + 2]];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = gray + (r - gray) * sat;
      d[i + 1] = gray + (g - gray) * sat;
      d[i + 2] = gray + (b - gray) * sat;
    }

    // 5. Netteté légère
    const src = new Uint8ClampedArray(d);
    const a = 0.18;
    const row = width * 4;
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * row + x * 4;
        for (let c = 0; c < 3; c++) {
          const i = idx + c;
          d[i] = src[i] * (1 + 4 * a) - a * (src[i - 4] + src[i + 4] + src[i - row] + src[i + row]);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
