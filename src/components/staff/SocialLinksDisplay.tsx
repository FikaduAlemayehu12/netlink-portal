import { Globe } from "lucide-react";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORMS_BY_ID, normalizeUrl, type SocialPlatformId } from "@/lib/social-platforms";

interface Props {
  website?: string | null;
  socialLinks?: Record<string, string> | null;
  size?: "sm" | "md";
  className?: string;
}

export default function SocialLinksDisplay({ website, socialLinks, size = "md", className = "" }: Props) {
  const sizeClass = size === "sm" ? "w-7 h-7" : "w-9 h-9";
  const iconSize = size === "sm" ? 14 : 18;
  const links = socialLinks || {};

  const items = SOCIAL_PLATFORMS
    .map((p) => ({ p, url: (links[p.id] || "").trim() }))
    .filter((x) => x.url.length > 0);

  if (!website && items.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {website && (
        <a
          href={normalizeUrl(website)}
          target="_blank"
          rel="noopener noreferrer"
          title={website}
          className={`${sizeClass} rounded-full flex items-center justify-center bg-muted text-foreground/80 hover:bg-primary hover:text-primary-foreground transition-colors`}
        >
          <Globe size={iconSize} />
        </a>
      )}
      {items.map(({ p, url }) => (
        <a
          key={p.id}
          href={normalizeUrl(url)}
          target="_blank"
          rel="noopener noreferrer"
          title={p.label}
          aria-label={p.label}
          style={{ color: p.color }}
          className={`${sizeClass} rounded-full flex items-center justify-center bg-muted hover:bg-foreground/10 transition-all hover:scale-110`}
        >
          <span
            className="block"
            style={{ width: iconSize, height: iconSize }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: SOCIAL_PLATFORMS_BY_ID[p.id as SocialPlatformId].svg }}
          />
        </a>
      ))}
    </div>
  );
}
