// Soạn tin nhắn đặt lịch gửi qua Zalo/Messenger — hàm thuần, dễ sửa câu chữ.

export type BookingRequest = {
  /** Tên thương hiệu (từ cài đặt) */
  brand: string;
  /** Tên photographer — bỏ trống nếu nhắn cho studio nhờ tư vấn */
  recipient?: string;
  kind: string;
  /** yyyy-mm-dd từ <input type="date">, có thể rỗng */
  date: string;
  people: string;
  place: string;
  school?: string;
  note?: string;
};

export function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

export function buildBookingMessage(r: BookingRequest) {
  const greeting = r.recipient
    ? `Chào ${r.recipient}, mình xem portfolio trên web ${r.brand} và muốn đặt lịch chụp ạ.`
    : `Chào ${r.brand}, mình muốn đặt lịch chụp và nhờ studio tư vấn photographer phù hợp ạ.`;
  const closing = r.recipient
    ? `${r.recipient} còn lịch không và báo giá giúp mình nhé!`
    : "Studio gợi ý giúp mình photographer và báo giá nhé!";

  return [
    greeting,
    `• Loại chụp: ${r.kind}`,
    `• Ngày chụp: ${formatDate(r.date) || "(chưa chốt)"}`,
    `• Số người: ${r.people || "1"}`,
    `• Khu vực: ${r.place}${r.school?.trim() ? ` – ${r.school.trim()}` : ""}`,
    r.note?.trim() ? `• Ghi chú: ${r.note.trim()}` : "",
    closing,
  ]
    .filter(Boolean)
    .join("\n");
}
