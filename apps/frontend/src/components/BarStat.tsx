interface Props {
  label: string;
  count: number;
  total: number;
  cor?: string;
}

export function BarStat({ label, count, total, cor = "#7a8c3a" }: Props) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#bcc4d0]">{label}</span>
        <span className="text-[#546278] tabular-nums">
          {count} {total > 0 && <span className="ml-1">({pct.toFixed(0)}%)</span>}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#0f1319] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  );
}
