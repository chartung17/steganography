/**
 * Hides a message in an image using steganography.
 * @param {string} imageUrl - URL of the source image
 * @param {string} text - Message to hide (ASCII only, no null chars)
 * @returns {Object} - { success: boolean, result?: string, error?: string }
 */
export async function hideTextInImage(imageUrl, text) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data; // RGBA array

  if (canvas.width * canvas.height < 3 * (text.length + 1)) {
    return { success: false, error: "Image is too small to encode the given text" };
  }

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0 || code >= 128) {
      return { success: false, error: "Text must only contain ASCII characters and no null characters" };
    }
  }

  /**
   * Encodes one byte across 3 consecutive pixels using the LSB of each
   * R, G, and B channel. Each pixel carries one bit per channel (3 bits
   * total per pixel × 3 pixels = 9 bits), but only 7 are needed for ASCII.
   */
  function encodeByte(byteVal, pixelOffset) {
    pixels[(pixelOffset + 0) * 4 + 0] = (pixels[(pixelOffset + 0) * 4 + 0] & ~1) | ((byteVal >>> 6) & 1); // bit 6 → pixel+0 R
    pixels[(pixelOffset + 1) * 4 + 0] = (pixels[(pixelOffset + 1) * 4 + 0] & ~1) | ((byteVal >>> 5) & 1); // bit 5 → pixel+1 R
    pixels[(pixelOffset + 2) * 4 + 0] = (pixels[(pixelOffset + 2) * 4 + 0] & ~1) | ((byteVal >>> 4) & 1); // bit 4 → pixel+2 R
    pixels[(pixelOffset + 0) * 4 + 1] = (pixels[(pixelOffset + 0) * 4 + 1] & ~1) | ((byteVal >>> 3) & 1); // bit 3 → pixel+0 G
    pixels[(pixelOffset + 1) * 4 + 1] = (pixels[(pixelOffset + 1) * 4 + 1] & ~1) | ((byteVal >>> 2) & 1); // bit 2 → pixel+1 G
    pixels[(pixelOffset + 2) * 4 + 1] = (pixels[(pixelOffset + 2) * 4 + 1] & ~1) | ((byteVal >>> 1) & 1); // bit 1 → pixel+2 G
    pixels[(pixelOffset + 0) * 4 + 2] = (pixels[(pixelOffset + 0) * 4 + 2] & ~1) | ((byteVal >>> 0) & 1); // bit 0 → pixel+0 B
  }

  for (let i = 0; i < text.length; i++) {
    encodeByte(text.charCodeAt(i), 3 * i);
  }
  // Encode null terminator to mark end of message
  encodeByte(0, 3 * text.length);

  ctx.putImageData(imageData, 0, 0);

  // Export as PNG — lossless format is required to preserve encoded LSBs
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const outputUrl = URL.createObjectURL(blob);
  return { success: true, result: outputUrl };
}

/**
 * Hides the contents of a text file in an image using steganography.
 * @param {string} imageUrl - URL of the source image
 * @param {string} textFileUrl - URL of the text file containing the message to hide
 * @returns {Object} - { success: boolean, result?: string, error?: string }
 */
export async function hideFileInImage(imageUrl, textFileUrl) {
  let text;
  try {
    const response = await fetch(textFileUrl);
    if (!response.ok) throw new Error();
    text = await response.text();
  } catch {
    return { success: false, error: "Error reading text file" };
  }
  return hideTextInImage(imageUrl, text);
}

/**
 * Reads a steganographically hidden message from an image.
 * @param {string} imageUrl - URL of the image containing the hidden message
 * @returns {Object} - { success: boolean, message?: string, error?: string }
 */
export async function readTextFromImage(imageUrl) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const pixelCount = canvas.width * canvas.height;

  let message = "";

  for (let i = 0; i + 2 < pixelCount; i += 3) {
    // Reconstruct 7-bit ASCII character from LSBs across 3 pixels
    let b = 0;
    b |= (pixels[(i + 0) * 4 + 0] & 1) << 6;
    b |= (pixels[(i + 1) * 4 + 0] & 1) << 5;
    b |= (pixels[(i + 2) * 4 + 0] & 1) << 4;
    b |= (pixels[(i + 0) * 4 + 1] & 1) << 3;
    b |= (pixels[(i + 1) * 4 + 1] & 1) << 2;
    b |= (pixels[(i + 2) * 4 + 1] & 1) << 1;
    b |= (pixels[(i + 0) * 4 + 2] & 1) << 0;

    if (b === 0) return { success: true, message };
    if (b >= 128) return { success: false, error: "No hidden message found" };

    message += String.fromCharCode(b);
  }

  return { success: false, error: "No hidden message found" };
}

/**
 * Loads an image from a URL into an HTMLImageElement.
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // required for canvas pixel access on cross-origin images
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}