/** Ghép className, bỏ qua giá trị rỗng/false. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
