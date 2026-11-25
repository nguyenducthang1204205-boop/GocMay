// Nội dung chữ cố định của web (quy trình, câu hỏi thường gặp).
// Tách khỏi component để sửa chữ không phải đụng vào giao diện.

export const PROCESS_STEPS = [
  {
    title: "Chọn photographer",
    body: "Xem portfolio, vibe màu ảnh và giá — chọn người hợp gu bạn nhất.",
  },
  {
    title: "Nhắn trực tiếp",
    body: "Gửi ngày chụp, địa điểm và số người qua Zalo hoặc Messenger. Web soạn sẵn tin nhắn cho bạn.",
  },
  {
    title: "Cọc giữ lịch",
    body: "Photographer xác nhận lịch trống và gửi thông tin cọc theo chính sách của studio.",
  },
  {
    title: "Chụp & nhận ảnh",
    body: "Lập nhóm trao đổi moodboard trước buổi chụp, nhận ảnh đã chỉnh đúng hẹn.",
  },
] as const;

export const FAQ = [
  {
    q: "Giá trên web đã là giá cuối chưa?",
    a: "Đó là giá khởi điểm cho 1 buổi tại nội thành. Nhóm đông, concept phức tạp hoặc đi tỉnh, photographer sẽ báo giá chính xác khi bạn nhắn.",
  },
  {
    q: "Lịch trống trên web có chính xác không?",
    a: "Lịch được cập nhật thường xuyên nhưng có thể chưa kịp. Bạn cứ nhắn photographer để xác nhận ngày giờ chính xác nhất.",
  },
  {
    q: "Phụ phí đi tỉnh tính thế nào?",
    a: "Phụ phí tính cho cả buổi, không tính theo đầu người — nhóm càng đông, mỗi bạn góp càng ít. Xem bảng phụ phí chi tiết ở trang Bảng giá.",
  },
  {
    q: "Bao lâu thì nhận được ảnh?",
    a: "Thông thường 7–14 ngày tuỳ số lượng ảnh và hạng photographer. Nhiều photographer gửi ảnh preview ngay trong ngày chụp.",
  },
  {
    q: "Mình chưa biết chọn ai, có được tư vấn không?",
    a: "Được. Nhắn thẳng cho studio, kể concept và ngân sách — studio gợi ý 2–3 photographer hợp nhất với bạn.",
  },
] as const;
