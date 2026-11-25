import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents tạm tắt: chưa chạy ổn định trên Cloudflare Workers (OpenNext),
  // xem https://github.com/opennextjs/opennextjs-cloudflare/pull/1318.
  // Dữ liệu được cache bằng unstable_cache + tag (lib/content.ts).

  // Đóng gói thẳng thư viện Turso (bản web, JS thuần) vào code server thay vì để ngoài.
  // Next.js mặc định để @libsql/client ở ngoài → khi build cho Cloudflare phải tạo symlink,
  // mà Windows chặn tạo symlink nếu chưa bật Developer Mode.
  transpilePackages: ["@libsql/client"],
  experimental: {
    serverActions: {
      // Cho phép tải nhiều ảnh cùng lúc trong trang quản trị
      bodySizeLimit: "60mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
