import type { ForestThemeConfig } from "./themes";

type SeasonThemeIconProps = {
  config: Pick<ForestThemeConfig, "icon" | "iconSrc" | "label">;
  className?: string;
  /** Pixel size for image icons */
  size?: number;
};

/** Renders theme icon — Nora uses logo image; seasons use emoji. */
export function SeasonThemeIcon({
  config,
  className = "",
  size = 18,
}: SeasonThemeIconProps) {
  if (config.iconSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={config.iconSrc}
        alt={config.label}
        width={size}
        height={size}
        draggable={false}
        className={`object-contain ${className}`}
        style={{ width: size, height: size, maxWidth: size, maxHeight: size }}
      />
    );
  }

  return (
    <span className={className} aria-hidden>
      {config.icon}
    </span>
  );
}
