// Nhận biết web đang chạy ở đâu để chọn chỗ lưu dữ liệu/ảnh phù hợp.
//
// - Trên Cloudflare Workers: có `env` chứa các binding khai báo trong wrangler.jsonc
//   (DB = database D1, MEDIA = kho ảnh R2).
// - Trên máy (npm run dev), lúc build, hoặc trên Vercel: không có → trả về null.
import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function cloudflareEnv(): CloudflareEnv | null {
  try {
    return getCloudflareContext().env;
  } catch {
    return null; // không chạy trên Cloudflare
  }
}
