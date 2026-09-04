import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { AreaPath } from "@/lib/nav";

export function DashLink({
  to,
  tab,
  className,
  children,
  onClick,
}: {
  to: AreaPath;
  tab?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link to={to} search={tab ? { tab } : undefined} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
