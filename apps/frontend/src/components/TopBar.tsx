"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useMenu } from "@/components/AppShell";
import type { Notificacao } from "@/lib/types";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const router = useRouter();
  const { abrir } = useMenu();
  const [naoLidas, setNaoLidas] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function atualizarContagem() {
    try {
      const { total } = await api.contarNotificacoesNaoLidas();
      setNaoLidas(total);
    } catch {
      // silencioso: badge apenas não atualiza
    }
  }

  useEffect(() => {
    atualizarContagem();
    const timer = setInterval(atualizarContagem, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    function fecharForaDoClique(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", fecharForaDoClique);
    return () => document.removeEventListener("mousedown", fecharForaDoClique);
  }, [aberto]);

  async function alternarDropdown() {
    const abrir = !aberto;
    setAberto(abrir);
    if (!abrir) return;
    setCarregando(true);
    try {
      setNotificacoes(await api.listarNotificacoes());
      await atualizarContagem();
    } catch {
      setNotificacoes([]);
    } finally {
      setCarregando(false);
    }
  }

  async function abrirNotificacao(n: Notificacao) {
    setAberto(false);
    if (!n.lida) {
      try {
        await api.marcarNotificacaoLida(n.id);
        setNaoLidas((v) => Math.max(0, v - 1));
      } catch {
        // segue navegando mesmo se falhar
      }
    }
    router.push(`/ordens-servico/${n.osId}`);
  }

  async function marcarTodas() {
    try {
      await api.marcarTodasNotificacoesLidas();
      setNaoLidas(0);
      setNotificacoes((ns) => ns.map((n) => ({ ...n, lida: true })));
    } catch {
      // silencioso
    }
  }

  return (
    <header className="h-14 bg-[#161c26] border-b border-[#1e2838] flex items-center px-4 md:px-6 gap-3 md:gap-4 shrink-0">
      <button
        type="button"
        onClick={abrir}
        className="md:hidden text-[#bcc4d0] hover:text-white text-xl leading-none px-1"
        aria-label="Abrir menu"
      >
        ☰
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-white font-bold text-[15px] truncate">{title}</div>
        {subtitle && (
          <div className="text-[#7a8fa8] text-[11px] truncate">{subtitle}</div>
        )}
      </div>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={alternarDropdown}
          className="relative text-xl text-[#7a8fa8] hover:text-white transition-colors"
          aria-label="Notificações"
        >
          🔔
          {naoLidas > 0 && (
            <span className="absolute -top-1.5 -right-2 min-w-4.5 h-4.5 px-1 rounded-full bg-[#c0392b] border-2 border-[#161c26] text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {naoLidas > 99 ? "99+" : naoLidas}
            </span>
          )}
        </button>

        {aberto && (
          <div className="absolute right-0 top-9 w-85 max-w-[90vw] bg-[#161c26] border border-[#1e2838] rounded-xl shadow-xl shadow-black/40 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2838]">
              <span className="text-xs font-semibold text-white">
                Notificações
              </span>
              {naoLidas > 0 && (
                <button
                  type="button"
                  onClick={marcarTodas}
                  className="text-[11px] text-[#c8d67a] hover:underline"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {carregando ? (
                <p className="px-4 py-6 text-sm text-[#546278] text-center">
                  Carregando…
                </p>
              ) : notificacoes.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#546278] text-center">
                  Nenhuma notificação.
                </p>
              ) : (
                notificacoes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => abrirNotificacao(n)}
                    className={`w-full text-left px-4 py-3 border-b border-[#1e2838]/60 last:border-0 hover:bg-white/5 transition-colors ${
                      n.lida ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lida && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#7a8c3a] mt-1.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-[13px] text-[#f8fafc] leading-snug">
                          {n.titulo}
                        </div>
                        <div className="text-[10px] text-[#546278] mt-0.5">
                          {n.ordemServico.numeroOs} •{" "}
                          {new Date(n.dataHora).toLocaleString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
