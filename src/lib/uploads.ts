// Lưu ảnh tải lên. Ảnh đã được trình duyệt nén sẵn (WEBP, cạnh dài 1600px — xem
// components/admin/compressImage.ts) nên server chỉ kiểm tra và cất đi.
//
// Nơi lưu, chọn tự động theo môi trường:
//   R2 binding  — trên Cloudflare Workers (binding MEDIA). Ảnh phục vụ qua /uploads/<tên>.
//   R2 qua S3   — có đủ biến R2_* (VD: chạy trên Vercel). Ảnh phục vụ thẳng từ R2_PUBLIC_URL.
//   Thư mục máy — còn lại: data/uploads. Ảnh phục vụ qua /uploads/<tên>.
import "server-only";
import { cloudflareEnv } from "./runtime";

export const MAX_UPLOAD_MB = 10;
const UPLOAD_PREFIX = "uploads/";
const LOCAL_DIR = "data/uploads";

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
};
export const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_TYPES).map(([mime, ext]) => [ext, mime]),
);

/** Tên file hợp lệ: uuid + đuôi ảnh — chặn đọc file ngoài thư mục ảnh */
export const isUploadName = (name: string) => /^[a-f0-9-]{36}\.(jpg|png|webp|avif|gif)$/.test(name);

interface MediaStore {
  readonly kind: "r2" | "r2-s3" | "local";
  put(name: string, body: ArrayBuffer, type: string): Promise<string>; // trả về URL
  delete(url: string): Promise<void>;
  /** Đọc ảnh để phục vụ qua /uploads/<tên> (R2 binding và thư mục máy) */
  get?(name: string): Promise<{ body: ReadableStream | Uint8Array; type: string } | null>;
}

const CACHE_HEADER = "public, max-age=31536000, immutable";

// ---------- R2 binding (Cloudflare Workers) ----------
function r2BindingStore(bucket: R2Bucket): MediaStore {
  return {
    kind: "r2",
    async put(name, body, type) {
      await bucket.put(UPLOAD_PREFIX + name, body, { httpMetadata: { contentType: type, cacheControl: CACHE_HEADER } });
      return `/${UPLOAD_PREFIX}${name}`;
    },
    async delete(url) {
      if (url.startsWith(`/${UPLOAD_PREFIX}`)) await bucket.delete(url.slice(1));
    },
    async get(name) {
      const obj = await bucket.get(UPLOAD_PREFIX + name);
      return obj ? { body: obj.body, type: obj.httpMetadata?.contentType ?? "application/octet-stream" } : null;
    },
  };
}

// ---------- R2 qua API S3 (khi chạy ngoài Cloudflare) ----------
function s3Config() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !R2_PUBLIC_URL) return null;
  return {
    bucket: R2_BUCKET,
    publicUrl: R2_PUBLIC_URL.replace(/\/+$/, ""),
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  };
}

function s3Store(cfg: NonNullable<ReturnType<typeof s3Config>>): MediaStore {
  // aws4fetch: ký request S3 bằng fetch — vài KB, thay cho AWS SDK nặng vài MB
  const client = async () => new (await import("aws4fetch")).AwsClient({ ...cfg.credentials, service: "s3", region: "auto" });
  const objectUrl = (key: string) => `${cfg.endpoint}/${cfg.bucket}/${key}`;
  const send = async (key: string, init: RequestInit) => {
    const res = await (await client()).fetch(objectUrl(key), init);
    if (!res.ok) throw new Error(`R2 trả lỗi ${res.status} khi xử lý ${key}`);
  };
  return {
    kind: "r2-s3",
    async put(name, body, type) {
      await send(UPLOAD_PREFIX + name, {
        method: "PUT",
        body,
        headers: { "Content-Type": type, "Cache-Control": CACHE_HEADER },
      });
      return `${cfg.publicUrl}/${UPLOAD_PREFIX}${name}`;
    },
    async delete(url) {
      if (!url.startsWith(`${cfg.publicUrl}/${UPLOAD_PREFIX}`)) return;
      await send(url.slice(cfg.publicUrl.length + 1), { method: "DELETE" });
    },
  };
}

// ---------- Thư mục trên máy ----------
function localStore(): MediaStore {
  const file = async (name: string) => (await import("node:path")).join(process.cwd(), LOCAL_DIR, name);
  return {
    kind: "local",
    async put(name, body) {
      const fs = await import("node:fs/promises");
      await fs.mkdir(LOCAL_DIR, { recursive: true });
      await fs.writeFile(await file(name), new Uint8Array(body));
      return `/${UPLOAD_PREFIX}${name}`;
    },
    async delete(url) {
      if (!url.startsWith(`/${UPLOAD_PREFIX}`)) return;
      const name = url.slice(UPLOAD_PREFIX.length + 1);
      if (isUploadName(name)) await (await import("node:fs/promises")).unlink(await file(name));
    },
    async get(name) {
      try {
        const data = await (await import("node:fs/promises")).readFile(await file(name));
        return { body: new Uint8Array(data), type: MIME_BY_EXT[name.slice(name.lastIndexOf("."))] ?? "application/octet-stream" };
      } catch {
        return null;
      }
    },
  };
}

export function mediaStore(): MediaStore {
  const bucket = cloudflareEnv()?.MEDIA;
  if (bucket) return r2BindingStore(bucket);
  const cfg = s3Config();
  return cfg ? s3Store(cfg) : localStore();
}

/** Lưu các file ảnh, trả về danh sách URL. Ném lỗi (tiếng Việt) nếu file không hợp lệ. */
export async function saveImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f && f.size > 0);
  for (const f of valid) {
    if (!IMAGE_TYPES[f.type]) throw new Error(`"${f.name}" không phải ảnh JPG/PNG/WEBP/AVIF/GIF.`);
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`"${f.name}" lớn hơn ${MAX_UPLOAD_MB}MB.`);
  }

  const store = mediaStore();
  const urls: string[] = [];
  try {
    for (const f of valid) {
      const name = `${crypto.randomUUID()}${IMAGE_TYPES[f.type]}`;
      urls.push(await store.put(name, await f.arrayBuffer(), f.type));
    }
  } catch (e) {
    await deleteImages(urls); // lỗi giữa chừng thì dọn các ảnh đã lưu
    throw e;
  }
  return urls;
}

/** Xoá file của các ảnh đã tải lên (bỏ qua ảnh link ngoài) */
export async function deleteImages(urls: string[]) {
  const store = mediaStore();
  for (const url of urls) {
    try {
      await store.delete(url);
    } catch (e) {
      // Ảnh đã bị xoá trước đó hoặc lỗi mạng — không chặn thao tác chính
      console.warn("Không xoá được ảnh", url, e);
    }
  }
}
