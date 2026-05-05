interface Props {
  label: string;
  valor: string | number;
  sublabel?: string;
  icone?: string;
}

export function KPICard({ label, valor, sublabel, icone }: Props) {
  return (
    <div className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] uppercase tracking-wide text-[#546278]">
          {label}
        </div>
        {icone && (
          <span className="text-lg leading-none text-[#7a8c3a]">{icone}</span>
        )}
      </div>
      <div className="mt-2 text-3xl font-bold text-[#c8d67a]">{valor}</div>
      {sublabel && (
        <div className="mt-1 text-[11px] text-[#546278]">{sublabel}</div>
      )}
    </div>
  );
}
