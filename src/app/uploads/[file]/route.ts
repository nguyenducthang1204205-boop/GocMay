// Phục vụ ảnh đã tải lên: từ R2 (trên Cloudflare) hoặc thư mục data/uploads (trên máy).
import { isUploadName, mediaStore } from "@/lib/uploads";

export async function GET(_req: Request, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params;
  if (!isUploadName(file)) return new Response("Not found", { status: 404 });

  const obj = await mediaStore().get?.(file);
  if (!obj) return new Response("Not found", { status: 404 });

  return new Response(obj.body as BodyInit, {
    headers: {
      "Content-Type": obj.type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
