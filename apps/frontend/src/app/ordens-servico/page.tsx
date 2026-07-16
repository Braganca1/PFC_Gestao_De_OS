"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FiltrosOS } from "@/lib/api";
import {
  STATUS_LABEL,
  type OrdemServico,
  type StatusOS,
} from "@/lib/types";
import { PrioridadeBadge, StatusBadge } from "@/components/StatusBadge";
import { TypeBadge } from "@/components/TypeBadge";
import { TopBar } from "@/components/TopBar";

const PILULAS: Array<{ valor: StatusOS | ""; label: string }> = [
  { valor: "", label: "Todos" },
  { valor: "PEDIDO", label: STATUS_LABEL.PEDIDO },
  { valor: "EM_ANALISE", label: STATUS_LABEL.EM_ANALISE },
  { valor: "APROVADA", label: STATUS_LABEL.APROVADA },
  { valor: "EM_EXECUCAO", label: STATUS_LABEL.EM_EXECUCAO },
  { valor: "CONCLUIDA", label: STATUS_LABEL.CONCLUIDA },
  { valor: "CANCELADA", label: STATUS_LABEL.CANCELADA },
];

export default function OrdensServicoPage() {
  const [filtros, setFiltros] = useState<FiltrosOS>({});
  const [busca, setBusca] = useState("");
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar(f: FiltrosOS) {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.listarOrdens(f);
      setOrdens(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.status]);

  function selecionarStatus(valor: StatusOS | "") {
    setFiltros((f) => ({ ...f, status: valor || undefined }));
  }

  function aplicarBusca(e: React.FormEvent) {
    e.preventDefault();
    const novos = { ...filtros, numeroOs: busca || undefined };
    setFiltros(novos);
    carregar(novos);
  }

  const inputBusca =
    "px-3 py-1.5 rounded-md border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] text-xs outline-none placeholder:text-[#546278] w-full sm:w-44 focus:border-[#7a8c3a]";

  const statusAtivo = filtros.status ?? "";

  return (
    <>
      <TopBar
        title="Ordens de Serviço"
        subtitle="Gerenciamento de todas as OS"
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="bg-[#161c26] border border-[#1e2838] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e2838] flex items-center gap-3 flex-wrap">
            <div className="font-bold text-sm text-white flex-1">
              Ordens de Serviço Recentes
            </div>
            <div className="flex gap-1 flex-wrap">
              {PILULAS.map((p) => {
                const ativo = statusAtivo === p.valor;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => selecionarStatus(p.valor)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                      ativo
                        ? "bg-[#7a8c3a] border-[#7a8c3a] text-[#0f1319]"
                        : "border-[#1e2838] text-[#546278] hover:text-[#bcc4d0]"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <form onSubmit={aplicarBusca} className="w-full sm:w-auto">
              <input
                className={inputBusca}
                placeholder="Buscar OS..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onBlur={aplicarBusca}
              />
            </form>
          </div>

          {erro && (
            <div className="bg-red-500/10 text-red-300 px-5 py-3 text-sm border-b border-[#1e2838]">
              {erro}
            </div>
          )}

          {carregando ? (
            <div className="px-5 py-10 text-sm text-[#546278]">Carregando…</div>
          ) : ordens.length === 0 ? (
            <div className="px-5 py-10 text-sm text-[#546278]">
              Nenhuma OS encontrada.
            </div>
          ) : (
            <>
            {/* mobile: cards */}
            <ul className="md:hidden divide-y divide-[#1e2838]">
              {ordens.map((os) => (
                <li key={os.id}>
                  <Link
                    href={`/ordens-servico/${os.id}`}
                    className="block px-4 py-3 hover:bg-[#1e2838] transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[#7a8c3a] font-bold text-sm">
                        {os.numeroOs}
                      </span>
                      <TypeBadge tipo={os.tipo} />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={os.status} />
                      <PrioridadeBadge prioridade={os.prioridade} />
                    </div>
                    <div className="text-xs text-[#bcc4d0]">
                      {os.nomeRepresentante}
                      <span className="text-[#546278]">
                        {" "}
                        • {os.secaoSolicitante} •{" "}
                        {new Date(os.dataHora).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* desktop: tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0f1319]">
                    {[
                      "Nº OS",
                      "Tipo",
                      "Solicitante",
                      "Seção",
                      "Status",
                      "Prioridade",
                      "Data",
                      "Ações",
                    ].map((c) => (
                      <th
                        key={c}
                        className="text-left px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-[#546278] border-b border-[#1e2838] whitespace-nowrap"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordens.map((os) => (
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
                      <td className="px-4 py-3 text-white font-medium">
                        <div>{os.nomeRepresentante}</div>
                        <div className="text-[10px] text-[#546278] font-normal">
                          {os.emailSolicitante}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#546278]">
                        {os.secaoSolicitante}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={os.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PrioridadeBadge prioridade={os.prioridade} />
                      </td>
                      <td className="px-4 py-3 text-[#546278] whitespace-nowrap">
                        {new Date(os.dataHora).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/ordens-servico/${os.id}`}
                          className="inline-block border border-[#1e2838] rounded px-2 py-0.5 text-[11px] text-[#bcc4d0] hover:border-[#7a8c3a] hover:text-[#c8d67a]"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
