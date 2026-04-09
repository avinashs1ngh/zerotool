export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the react-easy-crop's docs.
 */
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central point to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(data, 0, 0);

  // As Base64 string
  // return canvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      resolve(file);
    }, 'image/jpeg');
  });
}

export async function generatePrintGrid(
  croppedImgUrl: string,
  targetWidthMm: number,
  targetHeightMm: number,
  paperWidthInch = 6,
  paperHeightInch = 4,
  customCols?: number,
  customRows?: number
): Promise<Blob | null> {
  const image = await createImage(croppedImgUrl);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // DPI for high quality prints
  const DPI = 300;
  canvas.width = paperWidthInch * DPI;
  canvas.height = paperHeightInch * DPI;

  // background white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Convert mm to pixels
  const mmToPx = (mm: number) => (mm / 25.4) * DPI;
  const itemWidthPx = mmToPx(targetWidthMm);
  const itemHeightPx = mmToPx(targetHeightMm);

  const marginMm = 5;
  const marginPx = mmToPx(marginMm);
  const paddingPx = mmToPx(2); // padding between photos

  if (customCols && customRows) {
    // Pre-calculate required size to fit all photos
    const gridWidth = customCols * itemWidthPx + (customCols - 1) * paddingPx;
    const gridHeight = customRows * itemHeightPx + (customRows - 1) * paddingPx;
    
    // Ensure canvas is large enough for the grid + small outer margin
    const requiredWidth = gridWidth + (marginPx * 2);
    const requiredHeight = gridHeight + (marginPx * 2);
    
    // Resize canvas if necessary (but keep at least 6x4 paper size)
    canvas.width = Math.max(requiredWidth, paperWidthInch * DPI);
    canvas.height = Math.max(requiredHeight, paperHeightInch * DPI);

    // Re-fill background after resize
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center the custom grid in the (potentially resized) canvas
    let startX = (canvas.width - gridWidth) / 2;
    let startY = (canvas.height - gridHeight) / 2;

    for (let r = 0; r < customRows; r++) {
      for (let c = 0; c < customCols; c++) {
        const x = startX + c * (itemWidthPx + paddingPx);
        const y = startY + r * (itemHeightPx + paddingPx);
        ctx.drawImage(image, x, y, itemWidthPx, itemHeightPx);
      }
    }
  } else {
    // Auto-fill logic
    let currentX = marginPx;
    let currentY = marginPx;

    while (currentY + itemHeightPx <= canvas.height - marginPx) {
      while (currentX + itemWidthPx <= canvas.width - marginPx) {
        ctx.drawImage(image, currentX, currentY, itemWidthPx, itemHeightPx);
        currentX += itemWidthPx + paddingPx;
      }
      currentX = marginPx;
      currentY += itemHeightPx + paddingPx;
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
  });
}

/**
 * Iteratively compresses an image to reach a target file size (in KB)
 */
export async function compressToTargetSize(
  file: File,
  targetKb: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const image = await createImage(URL.createObjectURL(file));
  let quality = 0.9;
  let scale = 1.0;
  let blob: Blob | null = null;
  let size = file.size;
  let iterations = 0;
  const maxIterations = 8; // Prevent infinite loops

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Canvas context not available');

  while (size > targetKb * 1024 && iterations < maxIterations) {
    iterations++;
    onProgress?.(iterations / maxIterations);

    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    blob = await new Promise((resolve) => 
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );

    if (!blob) break;
    size = blob.size;

    // Adjust parameters for next iteration
    if (size > targetKb * 1024) {
      // If still too big, drop quality first
      if (quality > 0.5) {
        quality -= 0.15;
      } else {
        // Then start dropping scale
        scale *= 0.8;
      }
    }
  }

  return blob || new Blob([await file.arrayBuffer()], { type: file.type });
}
