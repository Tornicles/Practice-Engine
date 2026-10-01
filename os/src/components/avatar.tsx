import { AVATAR_STAGES } from "@/lib/types";
import type { AvatarSpec, AvatarStage } from "@/lib/types";
import { cn } from "@/lib/utils";

// Evolving identity: the avatar visibly levels up with training.
// Stages: spark → ember → forge → titan. Pure SVG, no assets.

const STAGE_META: Record<AvatarStage, { ring: string; glow: string; label: string }> = {
  spark: { ring: "#8a93a0", glow: "none", label: "Spark" },
  ember: { ring: "#e0a35c", glow: "#e0a35c33", label: "Ember" },
  forge: { ring: "#c9a84e", glow: "#c9a84e44", label: "Forge" },
  titan: { ring: "#4fd18b", glow: "#4fd18b44", label: "Titan" },
};

export function AvatarFigure({
  spec,
  stage,
  size = 64,
  className,
}: {
  spec: AvatarSpec;
  stage: AvatarStage;
  size?: number;
  className?: string;
}) {
  const meta = STAGE_META[stage];
  const id = `ag-${spec.style}-${stage}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={`Avatar, ${meta.label} stage`}
    >
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={meta.glow === "none" ? "transparent" : meta.glow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#${id})`} />
      <circle cx="32" cy="32" r="27" fill="#141a21" stroke={meta.ring} strokeWidth="2" />
      {/* head */}
      <circle cx="32" cy="25" r="9" fill={spec.skin} />
      {/* hair / style */}
      {spec.style === "bolt" ? (
        <path d="M23 22 Q32 10 41 22 L39 25 Q32 17 25 25 Z" fill="#2b3440" />
      ) : spec.style === "wave" ? (
        <path d="M23 24 Q27 12 32 16 Q37 12 41 24 L40 20 Q32 14 24 20 Z" fill="#2b3440" />
      ) : (
        <circle cx="32" cy="17" r="4" fill="#2b3440" />
      )}
      {/* torso */}
      <path d="M18 52 Q18 40 32 40 Q46 40 46 52 L46 56 L18 56 Z" fill={spec.color} />
      {/* stage accessories */}
      {stage === "ember" || stage === "forge" || stage === "titan" ? (
        <path d="M24 21 Q32 18 40 21" stroke={meta.ring} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      ) : null}
      {stage === "forge" || stage === "titan" ? (
        <circle cx="46" cy="46" r="5" fill="#0b0d10" stroke={meta.ring} strokeWidth="1.5" />
      ) : null}
      {stage === "titan" ? (
        <path d="M14 12 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" fill={meta.ring} />
      ) : null}
    </svg>
  );
}

export function AvatarStageBadge({ stage, xp }: { stage: AvatarStage; xp: number }) {
  const idx = AVATAR_STAGES.findIndex((s) => s.id === stage);
  const next = AVATAR_STAGES[idx + 1];
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider"
        style={{ borderColor: STAGE_META[stage].ring, color: STAGE_META[stage].ring }}
      >
        {STAGE_META[stage].label}
      </span>
      <span className="font-mono text-[0.625rem] text-muted-foreground">
        {xp} XP{next ? ` · ${next.xp - xp} to ${next.label}` : " · max"}
      </span>
    </div>
  );
}
