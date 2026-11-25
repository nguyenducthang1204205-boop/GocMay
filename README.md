# Website chọn photographer

Website Next.js cho studio có nhiều photographer: khách xem portfolio, lọc theo phong cách/giá, rồi nhắn Zalo/Messenger để đặt lịch. Có trang quản trị để tự cập nhật nội dung.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000 — trang quản trị ở http://localhost:3000/admin

## Đăng nhập quản trị

Mật khẩu nằm trong file `.env.local` (dòng `ADMIN_PASSWORD`). Muốn đổi mật khẩu: sửa dòng đó rồi chạy lại `npm run dev`.
Nếu chưa có file `.env.local`, sao chép từ `.env.example` và điền giá trị.

## Quản trị được gì

| Mục | Hiển thị ở đâu trên web |
| --- | --- |
| Ảnh trang chủ (collage đầu trang, dải ảnh chạy ngang, ảnh bìa từng vibe — để trống thì tự lấy ảnh portfolio) | Trang chủ |
| Photographer (thêm/sửa/xoá, ảnh, hạng, giá, phong cách, dịch vụ, lịch, Zalo/Messenger/Instagram/mã QR riêng) | Trang chủ, /photographer |
| Gói chụp | /bang-gia (mục Gói chụp) |
| Đồ bán kèm | /bang-gia (mục Đồ bán kèm) |
| Trường & ảnh tại trường | /truong |
| Hạng giá & phụ phí tỉnh | /bang-gia, trang chủ |
| Cài đặt chung (tên thương hiệu, slogan, Zalo, Messenger, Instagram, chính sách cọc) | Toàn bộ web |

Mọi thay đổi hiện ra trên web ngay sau khi bấm Lưu. Ảnh tải lên được tự nén về WEBP, cạnh dài tối đa 1600px.

## Dữ liệu được lưu ở đâu

Web tự chọn chỗ lưu theo nơi đang chạy (trang Tổng quan của quản trị cho biết đang dùng chỗ nào):

| | Trên Cloudflare | Có khoá trong `.env.local` (VD: Vercel) | Chạy trên máy |
| --- | --- | --- | --- |
| Dữ liệu | Cloudflare D1 (binding `DB`) | Turso (`TURSO_*`) | file `data/app.db` |
| Ảnh | Cloudflare R2 (binding `MEDIA`) | Cloudflare R2 qua API (`R2_*`) | thư mục `data/uploads` |

Ảnh được **nén ngay trên trình duyệt** (WEBP, cạnh dài 1600px) trước khi tải lên, nên server không cần thư viện xử lý ảnh.
Lần chạy đầu tiên trên máy với database trống, web tự nạp dữ liệu mẫu (`src/lib/seed.ts`).

---

## Triển khai lên Cloudflare (khuyên dùng)

Chạy trên Cloudflare Workers qua [OpenNext](https://opennext.js.org/cloudflare), dữ liệu ở D1, ảnh ở R2 — chỉ cần một tài khoản Cloudflare, không phải sao chép khoá bí mật nào. Gói Workers miễn phí giới hạn 10ms CPU mỗi request; trang quản trị có thể vượt mức này, nên dùng gói **Workers Paid** (5 USD/tháng) khi chạy thật.

### Lần đầu

```bash
npx wrangler login       # đăng nhập Cloudflare (mở trình duyệt)
npm run cf:setup         # tạo database D1 + 2 kho R2, lưu ADMIN_PASSWORD / SESSION_SECRET lên Cloudflare
npm run cf:db:push       # đẩy dữ liệu + ảnh đang có trên máy lên Cloudflare
npm run cf:deploy        # build và đưa web lên — link *.workers.dev hiện ở cuối
```

Sau khi có link, ghi tên miền vào file `.env.production` (`NEXT_PUBLIC_SITE_URL=https://…`) rồi deploy lại để sitemap/ảnh chia sẻ dùng đúng địa chỉ.

### Tự deploy từ GitHub (Cloudflare Workers Builds)

Cloudflare tự lấy code từ GitHub và chạy `npm run cf:deploy` mỗi khi có code mới trên nhánh `main` — không cần tạo token hay khoá nào.

Cài một lần: Cloudflare → **Workers & Pages** → worker **gocmay** → **Settings** → **Build** → **Connect** → chọn repo GitHub, rồi:

| Ô | Giá trị |
| --- | --- |
| Branch | `main` |
| Build command | *(để trống)* |
| Deploy command | `npm run cf:deploy` |
| Builds for non-production branches | tắt |

Xem tiến trình ở tab **Deployments** của worker. Node.js 24 được chọn qua file `.node-version`; link web lấy từ `.env.production`.
Mật khẩu quản trị vẫn nằm trong secret của worker, không có trên GitHub.

### Deploy bằng tay từ máy

```bash
npm run cf:deploy        # deploy code mới — nội dung sửa trong /admin được giữ nguyên
npm run cf:preview       # chạy thử bản Cloudflare trên máy tại http://localhost:8787
```

- `cf:deploy` tự tải dữ liệu đang có trên D1 về để dựng sẵn trang, nên deploy lại **không** làm web hiện dữ liệu cũ trên máy.
- `cf:db:push` **ghi đè** dữ liệu trên Cloudflare bằng dữ liệu trên máy — chỉ dùng lần đầu (lệnh tự dừng nếu Cloudflare đã có dữ liệu, thêm `-- --yes` để ép).
- Đổi mật khẩu quản trị: `npx wrangler secret put ADMIN_PASSWORD`.
- Mật khẩu trong `.env.local` không bao giờ bị đóng gói vào code worker: script tạm ẩn file này khi build.

### Cấu hình liên quan

- `wrangler.jsonc` — tên worker, binding D1/R2
- `open-next.config.ts` — cache trang (R2) và tag cache (D1)
- `scripts/cloudflare.mjs` — các lệnh `cf:*`
- `cloudflare-env.d.ts` — kiểu TypeScript của binding, tạo lại bằng `npm run cf:typegen` khi sửa `wrangler.jsonc`

> **Lưu ý kỹ thuật:** `cacheComponents` của Next.js đang tắt vì chưa chạy ổn định trên Cloudflare
> ([opennextjs-cloudflare#1318](https://github.com/opennextjs/opennextjs-cloudflare/pull/1318)). Dữ liệu được cache bằng `unstable_cache` + tag trong `src/lib/content.ts`.

---

## Cách khác: Vercel + Turso + Cloudflare R2

### Bước 1 — Tạo database Turso

1. Đăng ký tại https://turso.tech (đăng nhập bằng GitHub được).
2. Vào **Databases → Create Database**, đặt tên (vd. `gocmay`), chọn vùng gần Việt Nam nhất (Singapore/Tokyo nếu có).
3. Mở database vừa tạo:
   - Copy **URL** (dạng `libsql://gocmay-tenban.turso.io`) → điền vào `TURSO_DATABASE_URL`
   - Bấm **Create Token** (quyền Read & Write) → copy → điền vào `TURSO_AUTH_TOKEN`

### Bước 2 — Tạo kho ảnh Cloudflare R2

1. Đăng ký tại https://dash.cloudflare.com, vào mục **R2 Object Storage** và bật R2 (có thể phải gắn thẻ dù dùng gói miễn phí).
2. **Create bucket**, đặt tên (vd. `gocmay-anh`) → điền vào `R2_BUCKET`.
3. Mở bucket → **Settings → Public access → R2.dev subdomain → Allow**. Copy link dạng `https://pub-xxxx.r2.dev` → điền vào `R2_PUBLIC_URL` (không có dấu `/` ở cuối).
   *(Nếu có tên miền riêng trên Cloudflare, có thể gắn Custom Domain thay cho r2.dev.)*
4. Quay lại trang R2 → **Manage R2 API Tokens → Create API token**, quyền **Object Read & Write**, chỉ cho bucket vừa tạo. Sau khi tạo:
   - **Access Key ID** → `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → `R2_SECRET_ACCESS_KEY` (chỉ hiện một lần — lưu lại ngay)
5. **Account ID** (ở trang R2 Overview, cột bên phải) → `R2_ACCOUNT_ID`.

### Bước 3 — Chuyển dữ liệu đang có lên mây

Sau khi đã điền đủ các khoá vào `.env.local`:

```bash
npm run migrate:cloud
```

Script chép toàn bộ dữ liệu trong `data/app.db` lên Turso và ảnh trong `data/uploads` lên R2 (tự đổi đường dẫn ảnh). Nếu Turso đã có dữ liệu, script dừng lại — thêm `-- --overwrite` để ghi đè.

Rồi chạy lại `npm run dev` — trang Tổng quan sẽ hiện **☁ Turso** và **☁ Cloudflare R2**.

### Bước 4 — Đưa web lên Vercel

1. Đưa code lên GitHub, rồi vào https://vercel.com → **Add New Project** → chọn repo.
2. Ở **Environment Variables**, thêm đủ các biến trong `.env.local`: `ADMIN_PASSWORD`, `SESSION_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, và 5 biến `R2_*`.
3. Bấm **Deploy**.

> Giữ bí mật các khoá trong `.env.local` — file này đã được loại khỏi git, đừng gửi nó cho ai hay dán lên mạng.

---

## Cấu trúc code

```
src/
├─ app/                     # Chỉ định tuyến — mỗi page chỉ lấy dữ liệu và lắp ghép section
│  ├─ (site)/               # Web công khai: /, /photographer, /truong, /bang-gia, /lien-he
│  ├─ admin/                # Trang quản trị (actions.ts chứa toàn bộ thao tác lưu/xoá)
│  ├─ globals.css           # DESIGN TOKENS: màu, font, chuyển động — đổi ở đây là cả web đổi
│  ├─ sitemap.ts, robots.ts # SEO
├─ config/
│  ├─ site.ts               # Đường dẫn (routes), menu, URL gốc
│  └─ copy.ts               # Chữ cố định: quy trình 4 bước, câu hỏi thường gặp
├─ components/
│  ├─ ui/                   # Khối dựng dùng chung: Button, Section, Photo, Tag, Dialog, Icon…
│  ├─ layout/               # Header, Footer, Logo
│  ├─ media/                # Lưới ảnh + Lightbox xem ảnh toàn màn hình
│  └─ admin/                # Thành phần riêng của trang quản trị
├─ features/                # Mỗi tính năng một thư mục
│  ├─ home/                 # Các section của trang chủ
│  ├─ photographers/        # Thẻ, lưới, bộ lọc (filters.ts = logic thuần, lưu trên URL)
│  ├─ booking/              # Form soạn tin nhắn Zalo/Messenger (message.ts = câu chữ tin nhắn)
│  └─ pricing/              # Thẻ hạng giá, ước tính chi phí, bảng phụ phí
└─ lib/                     # Dữ liệu: db.ts, content.ts (cache), uploads.ts, auth.ts, constants.ts (kiểu)
```

### Quy ước khi sửa / mở rộng

- **Màu sắc**: chỉ dùng tên ngữ nghĩa (`bg-canvas`, `text-ink`, `text-muted`, `bg-accent`…). Muốn đổi màu thương hiệu → sửa `@theme` trong `globals.css`.
- **Font**: Playfair Display (tiêu đề) · Be Vietnam Pro (nội dung) · JetBrains Mono (nhãn nhỏ) — khai báo ở `app/layout.tsx`.
- **Đường dẫn**: luôn dùng `routes.*` trong `config/site.ts`, không gõ cứng `"/photographer"`.
- **Thêm section trang chủ**: tạo file trong `features/home/`, dùng `Section` + `SectionHeader`, rồi thêm vào `app/(site)/page.tsx`.
- **Thêm tiêu chí lọc photographer**: sửa `features/photographers/filters.ts` (parse/serialize URL + `applyFilters`), rồi thêm nút trong `PhotographerExplorer.tsx`.
- **Đổi câu chữ tin nhắn đặt lịch**: `features/booking/message.ts`.
- **Thêm cột / bảng vào database**: thêm một mục vào CUỐI `src/lib/migrations.ts` (không sửa mục cũ), sửa `db.ts` cho cột mới. Trên máy web tự áp dụng; trên Cloudflare `npm run cf:deploy` tự áp dụng trước khi build.
- **Hiệu ứng hiện dần khi cuộn**: thêm class `reveal` (CSS thuần, tự tắt khi người dùng chọn giảm chuyển động).
