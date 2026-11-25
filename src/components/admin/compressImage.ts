// Nén ảnh ngay trên trình duyệt trước khi tải lên: xoay đúng chiều theo EXIF,
// thu nhỏ cạnh dài về 1600px, chuyển sang WEBP. Nhờ vậy server không cần thư viện
// xử lý ảnh (sharp không chạy được trên Cloudflare Workers) và tải lên nhanh hơn.

export const MAX_SIDE = 1600;
const QUALITY = 0.82;

/** Trả về file đã nén. Lỗi hoặc không nén được thì trả về file gốc. */
export async function compressImage(file: File): Promise<File> {
  // GIF động sẽ mất chuyển động nếu vẽ lại — giữ nguyên
  if (file.type === "image/gif" || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    // Safari cũ không xuất được WEBP → tự rơi về JPEG
    let blob = await toBlob(canvas, "image/webp");
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
    if (!blob) return file;

    // Ảnh vốn đã nhỏ và không cần thu nhỏ → giữ bản gốc nếu bản gốc nhẹ hơn
    if (scale === 1 && blob.size >= file.size) return file;

    const ext = blob.type === "image/webp" ? ".webp" : ".jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + ext;
    return new File([blob], name, { type: blob.type, lastModified: Date.now() });
  } catch {
    return file;
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Nén nhiều ảnh và trả về FileList mới để gán lại cho <input type="file">. */
export async function compressFileList(files: FileList): Promise<FileList> {
  const out = await Promise.all(Array.from(files).map(compressImage));
  const dt = new DataTransfer();
  out.forEach((f) => dt.items.add(f));
  return dt.files;
}
