type Tone = "default" | "warning" | "critical";

const toneClass: Record<Tone, string> = {
  default: "text-neutral-900",
  warning: "text-amber-600",
  critical: "text-red-600",
};

export function StatTile({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div className="border border-gold rounded p-4 bg-white">
      <div className="text-xs font-medium text-neutral-500">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${toneClass[tone]}`}>{value}</div>
      {hint && <div className="text-xs text-neutral-400 mt-1">{hint}</div>}
    </div>
  );
}
