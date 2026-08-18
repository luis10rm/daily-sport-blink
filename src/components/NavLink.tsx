import { Link, useLocation } from "@/lib/router-compat";
import { forwardRef } from "react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName: _pendingClassName, to, ...props }, ref) => {
    const location = useLocation();
    const toPath = typeof to === "string" ? to : "";
    const isActive =
      toPath.length > 0 &&
      (location.pathname === toPath ||
        (toPath !== "/" && location.pathname.startsWith(`${toPath}/`)));
    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
