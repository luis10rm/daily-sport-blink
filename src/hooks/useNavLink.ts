import { useNavigate } from "@/lib/router-compat";

/**
 * Returns props for an <a> element that navigates client-side.
 *
 * The `href` is always rendered, so the link is clickable before hydration
 * (SSR) and supports Cmd/Ctrl/Shift/middle-click. We intentionally do NOT
 * navigate on `touchend`: that fires after a scroll gesture ends over the
 * element and caused accidental navigations on mobile.
 *
 * Usage:
 *   const navLink = useNavLink();
 *   <a {...navLink("/path")}>...</a>
 */
export const useNavLink = () => {
  const navigate = useNavigate();
  return (to: string) => ({
    href: to,
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      navigate(to);
    },
  });
};
