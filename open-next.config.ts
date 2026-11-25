// Cấu hình OpenNext — cách Next.js lưu cache khi chạy trên Cloudflare.
//   incrementalCache: trang và kết quả "use cache" lưu trong R2 (NEXT_INC_CACHE_R2_BUCKET)
//   tagCache: thời điểm làm mới từng tag lưu trong D1 (NEXT_TAG_CACHE_D1) —
//             trang quản trị gọi updateTag("content") là web cập nhật ngay
//   queue: làm mới trang theo thời gian, gom trùng trong bộ nhớ (đủ cho web nhỏ)
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
});
