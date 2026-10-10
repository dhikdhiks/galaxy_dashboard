export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress ${clamped}%`}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-border ${className}`}
    >
      <div
        className="h-full rounded-full bg-linear-to-r from-purple-strong via-purple to-cyan transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
