import type { ComponentType } from "react";
import {
  Atom,
  BookOpen,
  Boxes,
  Brain,
  Braces,
  Camera,
  Cloud,
  Code,
  Compass,
  Cpu,
  Database,
  Flame,
  Flag,
  Gamepad2,
  GitBranch,
  Globe,
  GraduationCap,
  Layers,
  Lightbulb,
  MessageCircle,
  Monitor,
  Music,
  Network,
  Orbit,
  Palette,
  PenTool,
  Play,
  Puzzle,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Terminal,
  Video,
  Wand2,
  Wrench,
  Zap,
} from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

/**
 * Whitelist of icon identifiers that may come from the database.
 * Unknown identifiers always fall back to a safe default icon —
 * never render arbitrary SVG/HTML supplied by data (PRD §7).
 */
const ICONS: Record<string, IconComponent> = {
  atom: Atom,
  book: BookOpen,
  boxes: Boxes,
  brain: Brain,
  braces: Braces,
  camera: Camera,
  cloud: Cloud,
  code: Code,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  flame: Flame,
  flag: Flag,
  gamepad: Gamepad2,
  git: GitBranch,
  globe: Globe,
  graduation: GraduationCap,
  layers: Layers,
  lightbulb: Lightbulb,
  message: MessageCircle,
  monitor: Monitor,
  music: Music,
  network: Network,
  orbit: Orbit,
  palette: Palette,
  pen: PenTool,
  play: Play,
  puzzle: Puzzle,
  rocket: Rocket,
  server: Server,
  shield: Shield,
  smartphone: Smartphone,
  sparkle: Sparkles,
  star: Star,
  target: Target,
  terminal: Terminal,
  video: Video,
  wand: Wand2,
  wrench: Wrench,
  zap: Zap,
};

const DEFAULT_ICON = Sparkles;

export function iconFor(identifier: string | null | undefined): IconComponent {
  if (!identifier) return DEFAULT_ICON;
  return ICONS[identifier.trim().toLowerCase()] ?? DEFAULT_ICON;
}

/**
 * Renders the whitelisted icon for an identifier.
 *
 * Use this instead of `const Icon = iconFor(...)` + `<Icon />`, which the
 * `react-hooks/static-components` ESLint rule rejects (components must not be
 * created during render). The icon component itself is passed as a prop here,
 * so nothing is created in the render path.
 */
export function Glyph({
  icon: Icon,
  className,
}: {
  icon: IconComponent;
  className?: string;
}) {
  return <Icon className={className} aria-hidden="true" />;
}

/** Identifiers offered in admin forms, sorted for stable UI. */
export const ICON_CHOICES = Object.keys(ICONS).sort();

/** True when the stored icon is an uploaded image (inline data URL). */
export function isCustomIcon(
  icon: string | null | undefined,
): icon is string {
  return typeof icon === "string" && icon.startsWith("data:image/");
}

/**
 * Renders either the whitelisted glyph or an uploaded image. Custom
 * images are always circular; the caller's badge provides the size.
 * `className` styles the glyph, `imgClassName` the image.
 */
export function Icon({
  icon,
  className,
  imgClassName = "h-full w-full rounded-full object-cover",
}: {
  icon: string | null | undefined;
  className?: string;
  imgClassName?: string;
}) {
  if (isCustomIcon(icon)) {
    // Data URLs cannot go through next/image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" aria-hidden="true" className={imgClassName} />;
  }
  return <Glyph icon={iconFor(icon)} className={className} />;
}
