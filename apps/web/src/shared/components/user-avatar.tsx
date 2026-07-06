import { UserRound } from "lucide-react";
import type { AuthUser } from "@/src/shared/types/auth";

type UserAvatarProps = {
  user?: Pick<AuthUser, "firstName" | "lastName"> | null;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
};

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <span
      className={`${sizes[size]} grid shrink-0 place-items-center rounded-full bg-slate-950 font-semibold text-white dark:bg-slate-100 dark:text-slate-950`}
    >
      {initials || <UserRound className="size-1/2" aria-hidden />}
    </span>
  );
}
