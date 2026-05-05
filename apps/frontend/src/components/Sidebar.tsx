"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  icon: string;
  href?: string;
  matchPrefix?: string;
  excludePaths?: string[];
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: "▦",
    href: "/dashboard",
    matchPrefix: "/dashboard",
  },
  {
    label: "Ordens de Serviço",
    icon: "≡",
    href: "/ordens-servico",
    matchPrefix: "/ordens-servico",
    excludePaths: ["/ordens-servico/nova"],
  },
  { label: "Nova OS", icon: "+", href: "/ordens-servico/nova" },
  { label: "Relatórios", icon: "↧", disabled: true },
  { label: "Usuários", icon: "⊙", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-55 shrink-0 h-screen bg-[#161c26] border-r border-[#1e2838] flex flex-col">
      <div className="px-4 py-5 border-b border-[#1e2838] flex items-center gap-2.5">
        <div className="w-8.5 h-8.5 rounded-md bg-[#7a8c3a] flex items-center justify-center font-black text-[#0f1319] text-sm shrink-0">
          IME
        </div>
        <div>
          <div className="text-white font-bold text-[13px] leading-tight">
            Gestão de OS
          </div>
          <div className="text-[#bcc4d0] text-[10px]">Instituto Militar</div>
        </div>
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const excluded = item.excludePaths?.some(
            (p) => pathname === p || pathname.startsWith(p + "/")
          );
          const isActive =
            !!item.href &&
            !excluded &&
            (item.matchPrefix
              ? pathname === item.matchPrefix ||
                pathname.startsWith(item.matchPrefix + "/")
              : pathname === item.href);

          const baseCls =
            "flex items-center gap-3 px-4 py-2.5 text-[13px] border-l-[3px] transition-colors";

          if (item.disabled) {
            return (
              <span
                key={item.label}
                aria-disabled="true"
                title="Em desenvolvimento"
                className={`${baseCls} border-transparent text-[#bcc4d0] opacity-40 cursor-not-allowed select-none`}
              >
                <span className="text-base leading-none shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            );
          }

          const activeCls = isActive
            ? "border-[#7a8c3a] bg-[#7a8c3a]/15 text-[#c8d67a] font-semibold"
            : "border-transparent text-[#bcc4d0] hover:bg-white/5";

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={`${baseCls} ${activeCls}`}
            >
              <span className="text-base leading-none shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3.5 border-t border-[#1e2838] flex items-center gap-2.5">
        <div className="w-7.5 h-7.5 rounded-full bg-[#253348] flex items-center justify-center text-[#bcc4d0] text-xs font-bold shrink-0">
          CG
        </div>
        <div>
          <div className="text-white text-xs font-semibold">Ten Bragança</div>
          <div className="text-[#bcc4d0] text-[10px]">Administrador</div>
        </div>
      </div>
    </aside>
  );
}
