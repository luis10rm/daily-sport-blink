import { useNavigate } from "react-router-dom";

/**
 * Returns props for an <a> element that navigates via react-router without
 * the iOS Safari double-tap requirement (first tap = focus, second = click)
 * that affects <Link>. Respects Cmd/Ctrl/Shift for open-in-new-tab.
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
    onTouchEnd: (e: React.TouchEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      navigate(to);
    },
  });
};
