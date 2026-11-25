import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./Icon";

const VARIANTS = {
  /** Hành động chính trên nền sáng */
  primary: "bg-ink text-canvas hover:bg-ink-soft",
  /** Hành động nhấn mạnh (đặt lịch) */
  accent: "bg-accent text-white hover:brightness-110",
  /** Hành động phụ trên nền sáng */
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink/[0.03]",
  /** Hành động chính trên nền tối */
  inverse: "bg-canvas text-ink hover:bg-white",
  /** Hành động phụ trên nền tối */
  "outline-inverse": "border border-canvas/30 text-canvas hover:border-canvas hover:bg-canvas/5",
  /** Link dạng chữ */
  ghost: "text-ink hover:bg-ink/5",
} as const;

const SIZES = {
  sm: "min-h-10 px-4 text-sm gap-1.5",
  md: "min-h-12 px-6 text-[15px] gap-2",
  lg: "min-h-14 px-8 text-base gap-2.5",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

type StyleProps = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

/** Trả về class của nút — dùng khi cần style nút cho phần tử khác. */
export function buttonStyles({ variant = "primary", size = "md", block }: StyleProps = {}) {
  return cn(
    "group/btn inline-flex cursor-pointer items-center justify-center rounded-full font-semibold tracking-tight",
    "transition-[background-color,border-color,color,filter,transform] duration-200 active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
  );
}

type ContentProps = { icon?: IconName; iconLeft?: IconName; children: ReactNode };

function Content({ icon, iconLeft, children }: ContentProps) {
  return (
    <>
      {iconLeft && <Icon name={iconLeft} className="h-[1.1em] w-[1.1em]" />}
      <span>{children}</span>
      {icon && (
        <Icon
          name={icon}
          className="h-[1.1em] w-[1.1em] transition-transform duration-300 ease-(--ease-out-expo) group-hover/btn:translate-x-0.5"
        />
      )}
    </>
  );
}

export function Button({
  variant,
  size,
  block,
  icon,
  iconLeft,
  className,
  children,
  type = "button",
  ...rest
}: StyleProps & ContentProps & Omit<ComponentProps<"button">, "children">) {
  return (
    <button type={type} className={cn(buttonStyles({ variant, size, block }), className)} {...rest}>
      <Content icon={icon} iconLeft={iconLeft}>
        {children}
      </Content>
    </button>
  );
}

/** Nút dạng link. Link ngoài (http…) tự mở tab mới an toàn. */
export function ButtonLink({
  href,
  variant,
  size,
  block,
  icon,
  iconLeft,
  className,
  children,
  ...rest
}: StyleProps & ContentProps & { href: string; className?: string } & Omit<ComponentProps<"a">, "href" | "children">) {
  const classes = cn(buttonStyles({ variant, size, block }), className);
  const content = (
    <Content icon={icon} iconLeft={iconLeft}>
      {children}
    </Content>
  );
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...rest}>
      {content}
    </Link>
  );
}

export function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}
