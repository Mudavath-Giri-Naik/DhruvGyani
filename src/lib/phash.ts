/**
 * Browser-side perceptual hash (dHash, 64 bits → 16 hex chars). Computed on
 * the client so the server needs no native image libraries. Near-duplicate
 * photos have a small Hamming distance between hashes.
 */
export async function dHash(file: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 9;
    canvas.height = 8;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, 9, 8);
    const { data } = ctx.getImageData(0, 0, 9, 8);
    const gray = (x: number, y: number) => {
      const i = (y * 9 + x) * 4;
      return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    };
    let bits = "";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += gray(x, y) > gray(x + 1, y) ? "1" : "0";
    let hex = "";
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch {
    return null;
  }
}
