"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type FiltrosOS } from "@/lib/api";
import {
  STATUS_LABEL,
  TIPO_OS_LABEL,
  type OrdemServico,
  type StatusOS,
  type TipoOS,
} from "@/lib/types";
import { PrioridadeBadge, StatusBadge } from "@/components/StatusBadge";

export default function OrdensServicoPage() {
  const [filtros, setFiltros] = useState<FiltrosOS>({});
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await api.listarOrdens(filtros);
      setOrdens(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    carregar();
  }

  function limpar() {
    setFiltros({});
    setTimeout(carregar, 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Link
          href="/ordens-servico/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Nova OS
        </Link>
      </div>

      <form
        onSubmit={aplicarFiltros}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 border border-black/10 dark:border-white/10 rounded-lg p-4"
      >
        <input
          className="border border-black/10 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent"
          placeholder="Número OS"
          value={filtros.numeroOs ?? ""}
          onChange={(e) => setFiltros({ ...filtros, numeroOs: e.target.value })}
        />
        <input
          className="border border-black/10 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent"
          placeholder="Solicitante (nome ou e-mail)"
          value={filtros.solicitante ?? ""}
          onChange={(e) =>
            setFiltros({ ...filtros, solicitante: e.target.value })
          }
        />
        <select
          className="border border-black/10 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent"
          value={filtros.status ?? ""}
          onChange={(e) =>
            setFiltros({ ...filtros, status: e.target.value as StatusOS | "" })
          }
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="border border-black/10 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent"
          value={filtros.tipo ?? ""}
          onChange={(e) =>
            setFiltros({ ...filtros, tipo: e.target.value as TipoOS | "" })
          }
        >
          <option value="">Todos os tipos</option>
          {Object.entries(TIPO_OS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-black text-white dark:bg-white dark:text-black px-3 py-2 rounded text-sm flex-1"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpar}
            className="border border-black/10 dark:border-white/20 px-3 py-2 rounded text-sm"
          >
            Limpar
          </button>
        </div>
      </form>

      {erro && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded text-sm">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="text-sm opacity-70">Carregando…</div>
      ) : ordens.length === 0 ? (
        <div className="text-sm opacity-70">Nenhuma OS encontrada.</div>
      ) : (
        <div className="overflow-x-auto border border-black/10 dark:border-white/10 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Número</th>
                <th className="text-left px-4 py-2 font-medium">Tipo</th>
                <th className="text-left px-4 py-2 font-medium">Solicitante</th>
                <th className="text-left px-4 py-2 font-medium">Local</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Prioridade</th>
                <th className="text-left px-4 py-2 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {ordens.map((os) => (
                <tr
                  key={os.id}
                  className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/ordens-servico/${os.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {os.numeroOs}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{TIPO_OS_LABEL[os.tipo]}</td>
                  <td className="px-4 py-2">
                    <div>{os.nomeRepresentante}</div>
                    <div className="text-xs opacity-60">
                      {os.emailSolicitante}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    Piso {os.piso}, {os.local}
                  </td>
                  <td className="px-4 py-2">
                    <StatusBadge status={os.status} />
                  </td>
                  <td className="px-4 py-2">
                    <PrioridadeBadge prioridade={os.prioridade} />
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs opacity-70">
                    {new Date(os.dataHora).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
