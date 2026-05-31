import { deflateSync, inflateSync } from 'fflate';

async function hideTextInImage(imageUrl, text, compress = false) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  if (compress) {
    const encoded = new TextEncoder().encode(text);
    const compressedBytes = deflateSync(encoded, { level: 9 });

    // 4-byte big-endian length prefix
    const payload = new Uint8Array(4 + compressedBytes.length);
    const view = new DataView(payload.buffer);
    view.setUint32(0, compressedBytes.length, false);
    payload.set(compressedBytes, 4);

    if (canvas.width * canvas.height < 3 * payload.length) {
      const capacity = Math.floor(canvas.width * canvas.height / 3) - 4;
      return { success: false, error: `Image is too small to encode the given text (text is ${text.length} bytes long and image can only encode ~${capacity} bytes)` };
    }

    function encodeByteCompressed(byteVal, pixelOffset) {
      pixels[(pixelOffset + 0) * 4 + 0] = (pixels[(pixelOffset + 0) * 4 + 0] & ~1) | ((byteVal >>> 7) & 1);
      pixels[(pixelOffset + 1) * 4 + 0] = (pixels[(pixelOffset + 1) * 4 + 0] & ~1) | ((byteVal >>> 6) & 1);
      pixels[(pixelOffset + 2) * 4 + 0] = (pixels[(pixelOffset + 2) * 4 + 0] & ~1) | ((byteVal >>> 5) & 1);
      pixels[(pixelOffset + 0) * 4 + 1] = (pixels[(pixelOffset + 0) * 4 + 1] & ~1) | ((byteVal >>> 4) & 1);
      pixels[(pixelOffset + 1) * 4 + 1] = (pixels[(pixelOffset + 1) * 4 + 1] & ~1) | ((byteVal >>> 3) & 1);
      pixels[(pixelOffset + 2) * 4 + 1] = (pixels[(pixelOffset + 2) * 4 + 1] & ~1) | ((byteVal >>> 2) & 1);
      pixels[(pixelOffset + 0) * 4 + 2] = (pixels[(pixelOffset + 0) * 4 + 2] & ~1) | ((byteVal >>> 1) & 1);
      pixels[(pixelOffset + 1) * 4 + 2] = (pixels[(pixelOffset + 1) * 4 + 2] & ~1) | ((byteVal >>> 0) & 1);
      // pixel+2 B channel is unused (9th available bit)
    }

    for (let i = 0; i < payload.length; i++) {
      encodeByteCompressed(payload[i], 3 * i);
    }
  } else {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0 || code >= 128) {
        return { success: false, error: "Text must only contain ASCII characters and no null characters" };
      }
    }

    if (canvas.width * canvas.height < 3 * (text.length + 1)) {
      const capacity = Math.floor(canvas.width * canvas.height / 3) - 1;
      return { success: false, error: `Image is too small to encode the given text (text is ${text.length} bytes long and image can only encode ${capacity} bytes)` };
    }

    function encodeByte(byteVal, pixelOffset) {
      pixels[(pixelOffset + 0) * 4 + 0] = (pixels[(pixelOffset + 0) * 4 + 0] & ~1) | ((byteVal >>> 6) & 1);
      pixels[(pixelOffset + 1) * 4 + 0] = (pixels[(pixelOffset + 1) * 4 + 0] & ~1) | ((byteVal >>> 5) & 1);
      pixels[(pixelOffset + 2) * 4 + 0] = (pixels[(pixelOffset + 2) * 4 + 0] & ~1) | ((byteVal >>> 4) & 1);
      pixels[(pixelOffset + 0) * 4 + 1] = (pixels[(pixelOffset + 0) * 4 + 1] & ~1) | ((byteVal >>> 3) & 1);
      pixels[(pixelOffset + 1) * 4 + 1] = (pixels[(pixelOffset + 1) * 4 + 1] & ~1) | ((byteVal >>> 2) & 1);
      pixels[(pixelOffset + 2) * 4 + 1] = (pixels[(pixelOffset + 2) * 4 + 1] & ~1) | ((byteVal >>> 1) & 1);
      pixels[(pixelOffset + 0) * 4 + 2] = (pixels[(pixelOffset + 0) * 4 + 2] & ~1) | ((byteVal >>> 0) & 1);
    }

    for (let i = 0; i < text.length; i++) {
      encodeByte(text.charCodeAt(i), 3 * i);
    }
    // Null terminator
    encodeByte(0, 3 * text.length);
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { success: true, result: URL.createObjectURL(blob) };
}

/**
 * Hides the contents of a text file in an image using steganography.
 * @param {string} imageUrl - URL of the source image
 * @param {string} textFileUrl - URL of the text file containing the message to hide
 * @param {boolean} compress - Whether to compress the text before encoding
 * @returns {Object} - { success: boolean, result?: string, error?: string }
 */
async function hideFileInImage(imageUrl, textFileUrl, compress = false) {
  let text;
  try {
    const response = await fetch(textFileUrl);
    if (!response.ok) throw new Error();
    text = await response.text();
  } catch {
    return { success: false, error: "Error reading text file" };
  }
  return hideTextInImage(imageUrl, text, compress);
}

/**
 * Reads a steganographically hidden message from an image.
 * @param {string} imageUrl - URL of the image containing the hidden message
 * @param {boolean} compressed - Whether the hidden message was compressed
 * @returns {Object} - { success: boolean, message?: string, error?: string }
 */
async function readTextFromImage(imageUrl, compressed = false) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const pixelCount = canvas.width * canvas.height;

  if (compressed) {
    function decodeByteCompressed(pixelOffset) {
      let b = 0;
      b |= (pixels[(pixelOffset + 0) * 4 + 0] & 1) << 7;
      b |= (pixels[(pixelOffset + 1) * 4 + 0] & 1) << 6;
      b |= (pixels[(pixelOffset + 2) * 4 + 0] & 1) << 5;
      b |= (pixels[(pixelOffset + 0) * 4 + 1] & 1) << 4;
      b |= (pixels[(pixelOffset + 1) * 4 + 1] & 1) << 3;
      b |= (pixels[(pixelOffset + 2) * 4 + 1] & 1) << 2;
      b |= (pixels[(pixelOffset + 0) * 4 + 2] & 1) << 1;
      b |= (pixels[(pixelOffset + 1) * 4 + 2] & 1) << 0;
      return b;
    }

    if (pixelCount < 12) return { success: false, error: "No hidden message found" };

    const view = new DataView(new ArrayBuffer(4));
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, decodeByteCompressed(3 * i));
    }
    const byteLength = view.getUint32(0, false);

    if (pixelCount < 3 * (4 + byteLength)) {
      return { success: false, error: "No hidden message found" };
    }

    const compressedBytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      compressedBytes[i] = decodeByteCompressed(3 * (4 + i));
    }

    try {
      const decompressed = inflateSync(compressedBytes);
      return { success: true, message: new TextDecoder().decode(decompressed) };
    } catch {
      return { success: false, error: "Failed to decompress message" };
    }
  } else {
    function decodeByte(pixelOffset) {
      let b = 0;
      b |= (pixels[(pixelOffset + 0) * 4 + 0] & 1) << 6;
      b |= (pixels[(pixelOffset + 1) * 4 + 0] & 1) << 5;
      b |= (pixels[(pixelOffset + 2) * 4 + 0] & 1) << 4;
      b |= (pixels[(pixelOffset + 0) * 4 + 1] & 1) << 3;
      b |= (pixels[(pixelOffset + 1) * 4 + 1] & 1) << 2;
      b |= (pixels[(pixelOffset + 2) * 4 + 1] & 1) << 1;
      b |= (pixels[(pixelOffset + 0) * 4 + 2] & 1) << 0;
      return b;
    }

    let message = "";
    for (let i = 0; i + 2 < pixelCount; i += 3) {
      const b = decodeByte(i);
      if (b === 0) return { success: true, message };
      if (b >= 128) return { success: false, error: "No hidden message found" };
      message += String.fromCharCode(b);
    }
    return { success: false, error: "No hidden message found" };
  }
}

/**
 * Loads an image from a URL into an HTMLImageElement.
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export { hideTextInImage, hideFileInImage, readTextFromImage };