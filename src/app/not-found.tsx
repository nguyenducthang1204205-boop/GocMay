import { ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Layout";
import { routes } from "@/config/site";

export default function NotFound() {
  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-24 text-center">
      <div>
        <Eyebrow className="justify-center">Lỗi 404</Eyebrow>
        <p aria-hidden className="mt-6 font-serif text-[clamp(6rem,22vw,14rem)] leading-none tracking-tighter text-ink/10">
          404
        </p>
        <h1 className="-mt-6 font-serif text-4xl tracking-tight md:text-5xl">Khung hình này bị trống</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          Có thể photographer này không còn nhận lịch, hoặc đường dẫn bị sai.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href={routes.photographers} icon="arrowRight">
            Xem danh sách photographer
          </ButtonLink>
          <ButtonLink href={routes.home} variant="outline">
            Về trang chủ
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
