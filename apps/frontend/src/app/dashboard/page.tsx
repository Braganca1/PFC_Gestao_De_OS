"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  TIPO_OS_LABEL,
  type EstatisticasOS,
  type Prioridade,
  type StatusOS,
  type TipoOS,
} from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { BarStat } from "@/components/BarStat";
import { StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";

const COR_STATUS: Record<StatusOS, string> = {
  PEDIDO: "#1a5f8a",
  EM_ANALISE: "#4a1a8a",
  APROVADA: "#1a3f8a",
  EM_EXECUCAO: "#c88a00",
  CONCLUIDA: "#1a6e45",
  CANCELADA: "#8a1a1a",
};

const COR_PRIORIDADE: Record<Prioridade, string> = {
  BAIXA: "#2e7d5c",
  MEDIA: "#c88a00",
  ALTA: "#d35400",
  URGENTE: "#c0392b",
};

const COR_TIPO: Record<TipoOS, string> = {
  CONSTRUCAO_CIVIL: "#1a5f8a",
  ELETRICO: "#c88a00",
  INSTALACAO_AR_CONDICIONADO: "#1a8a8a",
  MANUTENCAO_AR_CONDICIONADO: "#1a6e45",
};

const STATUS_ORDEM: StatusOS[] = [
  "PEDIDO",
  "EM_ANALISE",
  "APROVADA",
  "EM_EXECUCAO",
  "CONCLUIDA",
  "CANCELADA",
];

const TIPO_ORDEM: TipoOS[] = [
  "CONSTRUCAO_CIVIL",
  "ELETRICO",
  "INSTALACAO_AR_CONDICIONADO",
  "MANUTENCAO_AR_CONDICIONADO",
];

const PRIORIDADE_ORDEM: Prioridade[] = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];

export default function DashboardPage() {
  const router = useRouter();
  const [dados, setDados] = useState<EstatisticasOS | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (getUsuario()?.tipo === "CLIENTE") {
      router.replace("/ordens-servico");
      return;
    }
    api
      .obterEstatisticas()
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [router]);

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Visão geral das ordens de serviço"
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {carregando ? (
          <div className="text-sm text-[#546278]">Carregando…</div>
        ) : erro ? (
          <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded text-sm">
            {erro}
          </div>
        ) : dados ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard label="Total de OS" valor={dados.totalOs} icone="≡" />
              <KPICard
                label="OS abertas"
                valor={dados.osAbertas}
                sublabel="Em andamento"
                icone="●"
              />
              <KPICard
                label="OS concluídas"
                valor={dados.osConcluidas}
                icone="✓"
              />
              <KPICard
                label="Tempo médio"
                valor={dados.tempoMedioDias > 0 ? `${dados.tempoMedioDias} dias` : "—"}
                sublabel="Da abertura ao encerramento"
                icone="⏱"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">
                  Por status
                </h2>
                <div className="space-y-3">
                  {STATUS_ORDEM.map((s) => (
                    <BarStat
                      key={s}
                      label={STATUS_LABEL[s]}
                      count={dados.porStatus[s] ?? 0}
                      total={dados.totalOs}
                      cor={COR_STATUS[s]}
                    />
                  ))}
                </div>
              </section>

              <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">
                  Por tipo
                </h2>
                <div className="space-y-3">
                  {TIPO_ORDEM.map((t) => (
                    <BarStat
                      key={t}
                      label={TIPO_OS_LABEL[t]}
                      count={dados.porTipo[t] ?? 0}
                      total={dados.totalOs}
                      cor={COR_TIPO[t]}
                    />
                  ))}
                </div>
              </section>

              <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                <h2 className="text-sm font-semibold text-white mb-4">
                  Por prioridade
                </h2>
                <div className="space-y-3">
                  {PRIORIDADE_ORDEM.map((p) => (
                    <BarStat
                      key={p}
                      label={PRIORIDADE_LABEL[p]}
                      count={dados.porPrioridade[p] ?? 0}
                      total={dados.totalOs}
                      cor={COR_PRIORIDADE[p]}
                    />
                  ))}
                </div>
              </section>
            </div>

            <section className="border border-[#1e2838] bg-[#161c26] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1e2838] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  Últimas OS criadas
                </h2>
                <Link
                  href="/ordens-servico"
                  className="text-[11px] text-[#c8d67a] hover:underline"
                >
                  ver todas →
                </Link>
              </div>
              {dados.ultimasOs.length === 0 ? (
                <div className="px-5 py-10 text-sm text-[#546278]">
                  Nenhuma OS registrada.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0f1319]">
                        {["Nº OS", "Tipo", "Solicitante", "Status", "Data"].map(
                          (c) => (
                            <th
                              key={c}
                              className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-[#546278] border-b border-[#1e2838] whitespace-nowrap"
                            >
                              {c}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {dados.ultimasOs.map((os) => (
                        <tr
                          key={os.id}
                          className="border-b border-[#1e2838] hover:bg-[#1e2838] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/ordens-servico/${os.id}`}
                              className="text-[#7a8c3a] font-bold hover:underline"
                            >
                              {os.numeroOs}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge tipo={os.tipo} />
                          </td>
                          <td className="px-4 py-3 text-white">
                            {os.nomeRepresentante}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={os.status} />
                          </td>
                          <td className="px-4 py-3 text-[#546278] whitespace-nowrap">
                            {new Date(os.dataHora).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
