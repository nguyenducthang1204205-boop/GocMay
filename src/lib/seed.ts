// Dữ liệu mẫu nạp vào database ở lần chạy đầu tiên (khi database còn trống).
// Sau đó mọi thay đổi làm trong trang quản trị /admin.
import type { Addon, Package, Photographer, Province, School, Settings, Tier } from "./constants";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/1067`;
const photos = (key: string, n = 7) => Array.from({ length: n }, (_, i) => img(`${key}-${i + 1}`));
const ALL = ["Kỷ yếu Đại học", "Kỷ yếu THPT", "Chụp nhóm", "Chụp cá nhân", "Nhận đi tỉnh"];
const svc = (effects: boolean, lighting: boolean, styling: boolean, assistant: boolean, raw: boolean) => ({
  effects,
  lighting,
  styling,
  assistant,
  raw,
});

export const SEED_SETTINGS: Settings = {
  name: "GÓC MÁY",
  tagline: "Chọn photographer theo gu",
  city: "Hà Nội",
  zalo: "https://zalo.me/0900000000",
  messenger: "https://m.me/gocmay.studio",
  instagram: "https://instagram.com/gocmay.studio",
  depositPolicy: "Cọc 30% để giữ lịch. Hoàn cọc 100% nếu báo huỷ trước 7 ngày, đổi lịch miễn phí 1 lần.",
};

export const SEED_TIERS: Omit<Tier, "sort">[] = [
  { key: "signature", label: "Signature", priceFrom: 3_500_000, description: "Photographer kinh nghiệm lâu năm, phong cách riêng rõ nét, chỉnh màu kỹ từng ảnh." },
  { key: "pro", label: "Pro", priceFrom: 2_400_000, description: "Đã chụp hàng trăm buổi, xử lý tốt cả nhóm đông lẫn chụp cá nhân, giao ảnh đúng hẹn." },
  { key: "rising", label: "Rising", priceFrom: 1_600_000, description: "Photographer trẻ, bắt trend nhanh, giá mềm và vận hành theo cùng tiêu chuẩn của studio." },
];

type P = Omit<Photographer, "id" | "sort" | "albumUrl" | "city" | "featured" | "zalo" | "messenger" | "instagram" | "zaloQr" | "bookedDates"> & {
  featured?: boolean;
};
const P_LIST: P[] = [
  { slug: "sen", name: "Sen", tier: "signature", rating: 5, sessions: 214, priceFrom: 3_800_000, vibes: ["Film", "Cổ điển"], categories: ALL, services: svc(true, true, true, true, true), availability: "Còn lịch cuối tuần này", bio: "Màu film trầm, ưu tiên ánh sáng tự nhiên buổi sớm. Rất hợp áo dài và kỷ yếu cổ điển.", photos: photos("sen"), featured: true },
  { slug: "cuc", name: "Cúc", tier: "pro", rating: 5, sessions: 156, priceFrom: 2_600_000, vibes: ["Trong trẻo", "Nắng ấm"], categories: ALL, services: svc(true, true, false, false, false), availability: "Còn buổi chiều hôm nay", bio: "Ảnh sáng, da đẹp tự nhiên, bắt khoảnh khắc cười rất duyên. Nhóm đông vẫn đều tay.", photos: photos("cuc"), featured: true },
  { slug: "lan", name: "Lan", tier: "pro", rating: 4.9, sessions: 131, priceFrom: 2_400_000, vibes: ["Cá tính", "Film"], categories: ["Kỷ yếu Đại học", "Chụp nhóm", "Chụp cá nhân"], services: svc(true, true, false, true, false), availability: "Còn buổi sáng hôm nay", bio: "Góc máy lạ, bố cục táo bạo, hợp với các bạn muốn bộ ảnh khác biệt.", photos: photos("lan"), featured: true },
  { slug: "dao", name: "Đào", tier: "rising", rating: 5, sessions: 88, priceFrom: 1_700_000, vibes: ["Trong trẻo", "Năng động"], categories: ALL, services: svc(true, false, false, false, false), availability: "Còn lịch hôm nay", bio: "Năng lượng cao, chỉ dáng nhiệt tình, hợp lớp đông và các concept vui nhộn.", photos: photos("dao"), featured: true },
  { slug: "mai", name: "Mai", tier: "signature", rating: 5, sessions: 241, priceFrom: 3_500_000, vibes: ["Cổ điển", "Nắng ấm"], categories: ALL, services: svc(true, true, true, true, true), availability: "Kín lịch tuần này", bio: "Tông vàng ấm, chăm chút từng chi tiết trang phục. Thường được đặt trước 2–3 tuần.", photos: photos("mai") },
  { slug: "quynh", name: "Quỳnh", tier: "pro", rating: 4.9, sessions: 119, priceFrom: 2_500_000, vibes: ["Film", "Trong trẻo"], categories: ["Kỷ yếu THPT", "Chụp nhóm", "Chụp cá nhân", "Nhận đi tỉnh"], services: svc(false, true, true, false, false), availability: "Còn lịch cuối tuần này", bio: "Màu film nhẹ, trong veo, rất hợp đồng phục và chụp cá nhân chân dung.", photos: photos("quynh") },
  { slug: "phuong", name: "Phượng", tier: "rising", rating: 4.8, sessions: 64, priceFrom: 1_600_000, vibes: ["Năng động", "Cá tính"], categories: ["Kỷ yếu THPT", "Chụp nhóm", "Nhận đi tỉnh"], services: svc(true, false, false, false, false), availability: "Còn lịch hôm nay", bio: "Chuyên lớp đông, có sẵn kịch bản tạo dáng nhóm và trò chơi phá băng.", photos: photos("phuong") },
  { slug: "tra", name: "Trà", tier: "pro", rating: 5, sessions: 142, priceFrom: 2_400_000, vibes: ["Nắng ấm", "Cổ điển"], categories: ALL, services: svc(true, true, false, false, true), availability: "Còn buổi chiều hôm nay", bio: "Mê ánh nắng cuối ngày, bộ ảnh có chiều sâu và cảm xúc.", photos: photos("tra") },
  { slug: "hue", name: "Huệ", tier: "rising", rating: 4.9, sessions: 52, priceFrom: 1_600_000, vibes: ["Trong trẻo", "Film"], categories: ["Kỷ yếu Đại học", "Chụp cá nhân"], services: svc(false, false, true, false, false), availability: "Còn lịch cuối tuần này", bio: "Nhẹ nhàng, kiên nhẫn, hợp với các bạn ngại ống kính lần đầu chụp.", photos: photos("hue") },
  { slug: "bang-lang", name: "Bằng Lăng", tier: "signature", rating: 5, sessions: 198, priceFrom: 3_600_000, vibes: ["Cá tính", "Cổ điển"], categories: ALL, services: svc(true, true, true, true, true), availability: "Còn 2 buổi tuần sau", bio: "Concept dàn dựng kỹ, ánh sáng studio ngoài trời, hợp bộ ảnh editorial.", photos: photos("banglang") },
  { slug: "sua", name: "Sữa", tier: "rising", rating: 4.9, sessions: 71, priceFrom: 1_700_000, vibes: ["Năng động", "Nắng ấm"], categories: ["Kỷ yếu THPT", "Chụp nhóm", "Chụp cá nhân", "Nhận đi tỉnh"], services: svc(true, false, false, false, false), availability: "Còn buổi sáng hôm nay", bio: "Vui tính, chụp nhanh, giao ảnh preview ngay trong ngày.", photos: photos("sua") },
  { slug: "moc", name: "Mộc", tier: "pro", rating: 4.9, sessions: 103, priceFrom: 2_500_000, vibes: ["Film", "Nắng ấm"], categories: ["Kỷ yếu Đại học", "Chụp nhóm", "Chụp cá nhân", "Nhận đi tỉnh"], services: svc(false, true, false, true, false), availability: "Còn lịch hôm nay", bio: "Màu mộc, chân thật, thiên về khoảnh khắc tự nhiên hơn là tạo dáng.", photos: photos("moc") },
];

export const SEED_PHOTOGRAPHERS: Omit<Photographer, "id" | "sort">[] = P_LIST.map((p) => ({
  ...p,
  city: "Hà Nội",
  albumUrl: "",
  featured: !!p.featured,
  zalo: "",
  messenger: "",
  instagram: "",
  zaloQr: "",
  bookedDates: [],
}));

export const SEED_PACKAGES: Omit<Package, "id" | "sort">[] = [
  { name: "Gói cá nhân", category: "Chụp cá nhân", price: 1_600_000, description: "Bộ ảnh chân dung riêng cho bạn, 1 trang phục, 1 địa điểm.", includes: ["2 giờ chụp", "40 ảnh chỉnh màu", "5 ảnh retouch kỹ"], image: img("pkg-solo"), featured: false },
  { name: "Gói kỷ yếu nhóm nhỏ", category: "Chụp nhóm", price: 3_200_000, description: "Cho nhóm bạn thân 3–8 người, có chụp cá nhân từng người.", includes: ["3 giờ chụp", "2 địa điểm", "Ảnh nhóm + ảnh cá nhân", "Bong bóng & khói màu"], image: img("pkg-group"), featured: true },
  { name: "Gói kỷ yếu cả lớp", category: "Kỷ yếu THPT", price: 6_500_000, description: "Trọn gói cho lớp 30–45 bạn, 2 photographer, kịch bản tạo dáng sẵn.", includes: ["4 giờ chụp", "2 photographer", "Flycam 15 phút", "Video highlight 1 phút"], image: img("pkg-class"), featured: false },
];

export const SEED_ADDONS: Omit<Addon, "id" | "sort">[] = [
  { name: "Album in 20x20", price: 450_000, description: "20 trang, bìa cứng, giấy lụa mờ.", image: img("addon-album") },
  { name: "Ảnh in khung gỗ A4", price: 180_000, description: "In ảnh chất lượng cao, khung gỗ sồi.", image: img("addon-frame") },
  { name: "Thêm 1 giờ chụp", price: 400_000, description: "Kéo dài buổi chụp thêm 60 phút.", image: img("addon-hour") },
];

export const SEED_SCHOOLS: Omit<School, "id" | "sort">[] = [
  { slug: "nhan-van", name: "ĐH Khoa học Xã hội & Nhân văn", short: "USSH", type: "Đại học", photos: photos("ussh", 6), photographers: ["sen", "cuc", "tra"] },
  { slug: "bach-khoa", name: "ĐH Bách khoa Hà Nội", short: "HUST", type: "Đại học", photos: photos("hust", 6), photographers: ["lan", "moc", "bang-lang"] },
  { slug: "ngoai-thuong", name: "ĐH Ngoại thương", short: "FTU", type: "Đại học", photos: photos("ftu", 6), photographers: ["mai", "cuc", "hue"] },
  { slug: "kinh-te-quoc-dan", name: "ĐH Kinh tế Quốc dân", short: "NEU", type: "Đại học", photos: photos("neu", 6), photographers: ["tra", "lan", "dao"] },
  { slug: "chu-van-an", name: "THPT Chu Văn An", short: "CVA", type: "THPT", photos: photos("cva", 6), photographers: ["quynh", "phuong", "sua"] },
  { slug: "viet-duc", name: "THPT Việt Đức", short: "VĐ", type: "THPT", photos: photos("vietduc", 6), photographers: ["dao", "phuong", "cuc"] },
];

export const SEED_PROVINCES: Omit<Province, "id" | "sort">[] = [
  ["Hà Nội (nội thành)", 0], ["Hà Nội (ngoại thành)", 200_000], ["Bắc Ninh", 300_000], ["Hưng Yên", 300_000],
  ["Vĩnh Phúc", 350_000], ["Hà Nam", 350_000], ["Hải Dương", 400_000], ["Thái Nguyên", 400_000],
  ["Bắc Giang", 400_000], ["Phú Thọ", 450_000], ["Nam Định", 450_000], ["Ninh Bình", 500_000],
  ["Hải Phòng", 600_000], ["Thái Bình", 550_000], ["Quảng Ninh", 800_000], ["Lạng Sơn", 800_000],
  ["Thanh Hoá", 900_000], ["Tuyên Quang", 800_000], ["Lào Cai", 1_200_000], ["Sơn La", 1_200_000],
  ["Nghệ An", 1_400_000], ["Hà Giang", 1_500_000],
].map(([name, fee]) => ({ name: name as string, fee: fee as number }));
