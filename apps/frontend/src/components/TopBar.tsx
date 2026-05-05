interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-14 bg-[#161c26] border-b border-[#1e2838] flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <div className="text-white font-bold text-[15px]">{title}</div>
        {subtitle && (
          <div className="text-[#7a8fa8] text-[11px]">{subtitle}</div>
        )}
      </div>
      <div className="relative">
        <span className="text-xl text-[#7a8fa8] cursor-pointer">🔔</span>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#c0392b] border-2 border-[#161c26]" />
      </div>
    </header>
  );
}
