"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  TIPO_OS_LABEL,
  type EstatisticasOS,
  type OrdemServico,
  type Prioridade,
  type StatusOS,
  type TipoOS,
} from "@/lib/types";
import { TopBar } from "@/components/TopBar";
import { KPICard } from "@/components/KPICard";
import { BarStat } from "@/components/BarStat";

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

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function formatarMes(chave: string): string {
  const [ano, mes] = chave.split("-");
  return `${MESES[Number(mes) - 1]}/${ano}`;
}

function formatarDataBr(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  // período efetivamente aplicado ao relatório exibido
  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string }>({
    inicio: "",
    fim: "",
  });
  const [dados, setDados] = useState<EstatisticasOS | null>(null);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const tipo = getUsuario()?.tipo;
    if (tipo === "CLIENTE" || tipo === "EXECUTOR") {
      router.replace("/ordens-servico");
      return;
    }
    setAutorizado(true);
    gerar("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function gerar(de: string, ate: string) {
    if (de && ate && de > ate) {
      setErro("Data inicial não pode ser posterior à data final");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      const filtro = {
        inicio: de || undefined,
        fim: ate || undefined,
      };
      const [stats, lista] = await Promise.all([
        api.obterEstatisticas(filtro),
        api.listarOrdens(filtro),
      ]);
      setDados(stats);
      setOrdens(lista);
      setPeriodo({ inicio: de, fim: ate });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar relatório");
    } finally {
      setCarregando(false);
    }
  }

  function descricaoPeriodo(): string {
    if (periodo.inicio && periodo.fim)
      return `${formatarDataBr(periodo.inicio)} a ${formatarDataBr(periodo.fim)}`;
    if (periodo.inicio) return `a partir de ${formatarDataBr(periodo.inicio)}`;
    if (periodo.fim) return `até ${formatarDataBr(periodo.fim)}`;
    return "todo o período";
  }

  function exportarCsv() {
    if (!dados) return;
    const cel = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linha = (...vs: unknown[]) => vs.map(cel).join(";");
    const linhas: string[] = [];

    linhas.push(linha("Relatório de Ordens de Serviço — IME"));
    linhas.push(linha("Período", descricaoPeriodo()));
    linhas.push(linha("Gerado em", new Date().toLocaleString("pt-BR")));
    linhas.push("");
    linhas.push(linha("Indicador", "Valor"));
    linhas.push(linha("Total de OS", dados.totalOs));
    linhas.push(linha("OS abertas", dados.osAbertas));
    linhas.push(linha("OS concluídas", dados.osConcluidas));
    linhas.push(linha("Tempo médio de resolução (dias)", dados.tempoMedioDias));
    linhas.push("");
    linhas.push(linha("Por status", "Total"));
    for (const s of Object.keys(STATUS_LABEL) as StatusOS[])
      linhas.push(linha(STATUS_LABEL[s], dados.porStatus[s] ?? 0));
    linhas.push("");
    linhas.push(linha("Por tipo", "Total"));
    for (const t of Object.keys(TIPO_OS_LABEL) as TipoOS[])
      linhas.push(linha(TIPO_OS_LABEL[t], dados.porTipo[t] ?? 0));
    linhas.push("");
    linhas.push(linha("Por prioridade", "Total"));
    for (const p of Object.keys(PRIORIDADE_LABEL) as Prioridade[])
      linhas.push(linha(PRIORIDADE_LABEL[p], dados.porPrioridade[p] ?? 0));
    linhas.push("");
    linhas.push(linha("Por seção", "Total"));
    for (const s of dados.porSecao) linhas.push(linha(s.secao, s.total));
    linhas.push("");
    linhas.push(linha("Volume mensal", "Total"));
    for (const m of dados.volumeMensal)
      linhas.push(linha(formatarMes(m.mes), m.total));
    linhas.push("");
    linhas.push(
      linha(
        "Nº OS",
        "Tipo",
        "Seção",
        "Status",
        "Prioridade",
        "Solicitante",
        "Executor",
        "Criada em",
        "Encerrada em",
      ),
    );
    for (const os of ordens) {
      linhas.push(
        linha(
          os.numeroOs,
          TIPO_OS_LABEL[os.tipo],
          os.secaoSolicitante,
          STATUS_LABEL[os.status],
          PRIORIDADE_LABEL[os.prioridade],
          os.nomeRepresentante,
          os.executor?.nome ?? "",
          new Date(os.dataHora).toLocaleDateString("pt-BR"),
          os.encerradoEm
            ? new Date(os.encerradoEm).toLocaleDateString("pt-BR")
            : "",
        ),
      );
    }

    // BOM para o Excel reconhecer acentos (UTF-8)
    const blob = new Blob(["﻿" + linhas.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const nome = `relatorio-os${periodo.inicio ? `_${periodo.inicio}` : ""}${periodo.fim ? `_a_${periodo.fim}` : ""}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!autorizado) return null;

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm outline-none focus:border-[#7a8c3a]";
  const maxMensal = dados
    ? Math.max(1, ...dados.volumeMensal.map((m) => m.total))
    : 1;

  return (
    <>
      <TopBar title="Relatórios" subtitle="Métricas por período" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          <section className="no-print border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
            <div className="flex flex-wrap items-end gap-3">
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  De
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </label>
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  Até
                </span>
                <input
                  type="date"
                  className={inputCls}
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                />
              </label>
              <button
                type="button"
                onClick={() => gerar(inicio, fim)}
                disabled={carregando}
                className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Gerar relatório
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!dados}
                className="border border-[#7a8c3a] text-[#c8d67a] hover:bg-[#7a8c3a]/10 font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={exportarCsv}
                disabled={!dados}
                className="border border-[#7a8c3a] text-[#c8d67a] hover:bg-[#7a8c3a]/10 font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Exportar CSV (Excel)
              </button>
            </div>
          </section>

          {erro && (
            <div className="no-print bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded text-sm">
              {erro}
            </div>
          )}

          {carregando ? (
            <div className="text-sm text-[#546278]">Carregando…</div>
          ) : dados ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-lg font-bold text-white">
                  Relatório de Ordens de Serviço
                </h1>
                <p className="text-xs text-[#7a8fa8]">
                  Período: {descricaoPeriodo()} • Gerado em{" "}
                  {new Date().toLocaleString("pt-BR")} •{" "}
                  {ordens.length} OS no período
                </p>
              </div>

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
                  valor={
                    dados.tempoMedioDias > 0
                      ? `${dados.tempoMedioDias} dias`
                      : "—"
                  }
                  sublabel="Da abertura ao encerramento"
                  icone="⏱"
                />
              </div>

              {dados.volumeMensal.length > 0 && (
                <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Volume de OS por mês
                  </h2>
                  <div className="space-y-3 max-w-2xl">
                    {dados.volumeMensal.map((m) => (
                      <BarStat
                        key={m.mes}
                        label={formatarMes(m.mes)}
                        count={m.total}
                        total={maxMensal}
                        cor="#1a5f8a"
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Por status
                  </h2>
                  <div className="space-y-3">
                    {(Object.keys(STATUS_LABEL) as StatusOS[]).map((s) => (
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
                    {(Object.keys(TIPO_OS_LABEL) as TipoOS[]).map((t) => (
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
                    {(Object.keys(PRIORIDADE_LABEL) as Prioridade[]).map(
                      (p) => (
                        <BarStat
                          key={p}
                          label={PRIORIDADE_LABEL[p]}
                          count={dados.porPrioridade[p] ?? 0}
                          total={dados.totalOs}
                          cor={COR_PRIORIDADE[p]}
                        />
                      ),
                    )}
                  </div>
                </section>

                <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white mb-4">
                    Por seção
                  </h2>
                  {dados.porSecao.length === 0 ? (
                    <p className="text-sm text-[#546278]">
                      Nenhuma OS no período.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dados.porSecao.map((s) => (
                        <BarStat
                          key={s.secao}
                          label={s.secao}
                          count={s.total}
                          total={dados.totalOs}
                          cor="#1a8a8a"
                        />
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
