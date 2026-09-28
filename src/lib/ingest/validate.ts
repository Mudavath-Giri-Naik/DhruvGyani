import { UPLOAD_LIMITS } from "@/lib/constants";

export type FileKind = "pdf" | "csv" | "image" | "video" | "docx";

/** Validate declared MIME, size and magic bytes. Returns the file kind or an error. */
export async function validateUpload(file: File): Promise<{ kind: FileKind; bytes: ArrayBuffer } | { error: string }> {
  if (file.size === 0) return { error: "The file is empty." };
  if (file.size > UPLOAD_LIMITS.maxBytes) return { error: `File is larger than ${UPLOAD_LIMITS.maxBytes / 1024 / 1024} MB.` };
  const name = file.name.toLowerCase();
  const mime = file.type || (name.endsWith(".csv") ? "text/csv" : "");
  if (!(UPLOAD_LIMITS.mime as readonly string[]).includes(mime)) return { error: `File type not allowed (${mime || "unknown"}). Use PDF, CSV, JPG/PNG/WebP, MP4 or DOCX.` };
  const bytes = await file.arrayBuffer();
  const head = new Uint8Array(bytes.slice(0, 12));
  const ascii = String.fromCharCode(...head);
  const is = {
    pdf: ascii.startsWith("%PDF"),
    png: head[0] === 0x89 && ascii.slice(1, 4) === "PNG",
    jpg: head[0] === 0xff && head[1] === 0xd8,
    webp: ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP",
    mp4: ascii.slice(4, 8) === "ftyp",
    zip: ascii.startsWith("PK"),
  };
  if (mime === "application/pdf") return is.pdf ? { kind: "pdf", bytes } : { error: "This doesn't look like a valid PDF." };
  if (mime.startsWith("image/")) return is.png || is.jpg || is.webp ? { kind: "image", bytes } : { error: "This doesn't look like a valid image." };
  if (mime === "video/mp4") return is.mp4 ? { kind: "video", bytes } : { error: "This doesn't look like a valid MP4 video." };
  if (mime.includes("wordprocessingml")) return is.zip ? { kind: "docx", bytes } : { error: "This doesn't look like a valid DOCX file." };
  // CSV: must decode as UTF-8 text with a header row
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.slice(0, 65536));
    if (!text.includes(",") && !text.includes("\n")) return { error: "CSV has no columns." };
    return { kind: "csv", bytes };
  } catch {
    return { error: "CSV must be UTF-8 text." };
  }
}

export function hamming(a: string, b: string): number {
  if (a.length !== b.length) return 64;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

export function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "").slice(-80) || "file";
}
