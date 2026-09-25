"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUsuario, limparSessao } from "@/lib/auth";
import { TIPO_USUARIO_LABEL, type Usuario } from "@/lib/types";

interface NavItem {
  label: string;
  icon: string;
  href?: string;
  matchPrefix?: string;
  excludePaths?: string[];
  disabled?: boolean;
  /** papéis que veem o item; omitido = todos */
  papeis?: Usuario["tipo"][];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    icon: "▦",
    href: "/dashboard",
    matchPrefix: "/dashboard",
    papeis: ["GESTOR", "ADMINISTRADOR"],
  },
  {
    label: "Ordens de Serviço",
    icon: "≡",
    href: "/ordens-servico",
    matchPrefix: "/ordens-servico",
    excludePaths: ["/ordens-servico/nova"],
  },
  { label: "Solicitação de Serviço", icon: "+", href: "/ordens-servico/nova" },
  {
    label: "Relatórios",
    icon: "↧",
    href: "/relatorios",
    matchPrefix: "/relatorios",
    papeis: ["GESTOR", "ADMINISTRADOR"],
  },
  {
    label: "Usuários",
    icon: "⊙",
    href: "/usuarios",
    matchPrefix: "/usuarios",
    papeis: ["ADMINISTRADOR"],
  },
  {
    label: "Seções",
    icon: "▤",
    href: "/secoes",
    matchPrefix: "/secoes",
    papeis: ["ADMINISTRADOR"],
  },
];

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase() || "?";
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    setUsuario(getUsuario());
  }, []);

  function sair() {
    limparSessao();
    router.replace("/login");
  }

  return (
    <aside className="w-55 shrink-0 h-full bg-[#161c26] border-r border-[#1e2838] flex flex-col">
      <Link href="/dashboard" className="px-4 py-5 border-b border-[#1e2838] flex items-center gap-2.5 hover:bg-white/5 transition-colors">
        <div className="w-8.5 h-8.5 rounded-md bg-[#7a8c3a] flex items-center justify-center font-black text-[#0f1319] text-sm shrink-0">
          IME
        </div>
        <div>
          <div className="text-white font-bold text-[13px] leading-tight">
            Gestão de OS
          </div>
          <div className="text-[#bcc4d0] text-[10px]">Instituto Militar</div>
        </div>
      </Link>

      <nav className="flex-1 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.filter(
          (item) =>
            !item.papeis || (usuario && item.papeis.includes(usuario.tipo)),
        ).map((item) => {
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
          {usuario ? iniciais(usuario.nome) : "…"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs font-semibold truncate">
            {usuario?.nome ?? "—"}
          </div>
          <div className="text-[#bcc4d0] text-[10px]">
            {usuario ? TIPO_USUARIO_LABEL[usuario.tipo] : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={sair}
          title="Sair"
          className="text-[#7a8fa8] hover:text-red-400 text-xs shrink-0 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
