import { useWallpaperContext } from "@/contexts/WallpaperContext";

/**
 * WallpaperBackground renders the premium takeover background
 * with clickable left/right wings. Only visible on wide screens
 * when an active wallpaper campaign is running.
 */
export function WallpaperBackground() {
  const { wallpaper, isTakeoverActive } = useWallpaperContext();

  // Don't render anything if takeover isn't active
  if (!isTakeoverActive || !wallpaper) {
    return null;
  }

  const handleWingClick = () => {
    if (wallpaper.click_url) {
      window.open(wallpaper.click_url, "_blank", "noopener,noreferrer");
    }
  };

  const hasBackgroundImage = !!wallpaper.background_image_url;
  const hasLeftWing = !!wallpaper.left_wing_url;
  const hasRightWing = !!wallpaper.right_wing_url;

  return (
    <>
      {/* Main background layer - fixed, behind everything */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: wallpaper.background_color,
          backgroundImage: hasBackgroundImage
            ? `url(${wallpaper.background_image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Left wing - clickable */}
      <div
        onClick={handleWingClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleWingClick();
          }
        }}
        className="fixed top-0 left-0 bottom-0 cursor-pointer z-[1]"
        style={{
          width: "calc((100vw - 1024px) / 2)",
          minWidth: "100px",
          backgroundImage: hasLeftWing
            ? `url(${wallpaper.left_wing_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label={`Reklama: ${wallpaper.name}`}
      />

      {/* Right wing - clickable */}
      <div
        onClick={handleWingClick}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleWingClick();
          }
        }}
        className="fixed top-0 right-0 bottom-0 cursor-pointer z-[1]"
        style={{
          width: "calc((100vw - 1024px) / 2)",
          minWidth: "100px",
          backgroundImage: hasRightWing
            ? `url(${wallpaper.right_wing_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label={`Reklama: ${wallpaper.name}`}
      />
    </>
  );
}
