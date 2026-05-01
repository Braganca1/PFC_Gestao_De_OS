"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  TIPO_OS_LABEL,
  type OrdemServico,
  type Prioridade,
  type StatusOS,
  type Usuario,
} from "@/lib/types";
import { PrioridadeBadge, StatusBadge } from "@/components/StatusBadge";

export default function OrdemDetalhe({ id }: { id: number }) {
  const router = useRouter();
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // estado dos formulários
  const [novoStatus, setNovoStatus] = useState<StatusOS | "">("");
  const [novaPrioridade, setNovaPrioridade] = useState<Prioridade | "">("");
  const [novoExecutor, setNovoExecutor] = useState<string>("");
  const [observacao, setObservacao] = useState("");
  const [encerrarPor, setEncerrarPor] = useState("");
  const [obsFinais, setObsFinais] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      const [osData, usuariosData] = await Promise.all([
        api.obterOrdem(id),
        api.listarUsuarios().catch(() => [] as Usuario[]),
      ]);
      setOs(osData);
      setUsuarios(usuariosData);
      setNovoStatus("");
      setNovaPrioridade("");
      setNovoExecutor("");
      setObservacao("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function aplicarMudancas(e: React.FormEvent) {
    e.preventDefault();
    if (!os) return;
    const payload: Record<string, unknown> = {};
    if (novoStatus) payload.status = novoStatus;
    if (novaPrioridade) payload.prioridade = novaPrioridade;
    if (novoExecutor) payload.executorId = Number(novoExecutor);
    if (observacao) payload.observacao = observacao;
    if (Object.keys(payload).length === 0) return;

    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.atualizarOrdem(os.id, payload);
      setOs(atualizada);
      setNovoStatus("");
      setNovaPrioridade("");
      setNovoExecutor("");
      setObservacao("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setSalvando(false);
    }
  }

  async function encerrar(e: React.FormEvent) {
    e.preventDefault();
    if (!os) return;
    if (!encerrarPor) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.encerrarOrdem(os.id, {
        encerradoPor: encerrarPor,
        observacoesFinais: obsFinais || undefined,
      });
      setOs(atualizada);
      setEncerrarPor("");
      setObsFinais("");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao encerrar");
    } finally {
      setSalvando(false);
    }
  }

  async function remover() {
    if (!os) return;
    if (!confirm(`Remover OS ${os.numeroOs}?`)) return;
    try {
      await api.removerOrdem(os.id);
      router.push("/ordens-servico");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  if (carregando) return <div className="text-sm opacity-70">Carregando…</div>;
  if (erro && !os)
    return (
      <div className="bg-red-100 text-red-800 px-4 py-3 rounded text-sm">
        {erro}
      </div>
    );
  if (!os) return null;

  const inputCls =
    "border border-black/10 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent w-full";
  const concluida =
    os.status === "CONCLUIDA" || os.status === "CANCELADA";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/ordens-servico"
            className="text-xs opacity-70 hover:underline"
          >
            ← voltar
          </Link>
          <h1 className="text-2xl font-bold mt-1">{os.numeroOs}</h1>
          <p className="text-sm opacity-70">{TIPO_OS_LABEL[os.tipo]}</p>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={os.status} />
          <PrioridadeBadge prioridade={os.prioridade} />
        </div>
      </div>

      {erro && (
        <div className="bg-red-100 text-red-800 px-4 py-3 rounded text-sm">
          {erro}
        </div>
      )}

      <Section title="Dados gerais">
        <Grid>
          <Info label="Solicitante" value={os.nomeRepresentante} />
          <Info label="E-mail" value={os.emailSolicitante} />
          <Info label="Seção" value={os.secaoSolicitante} />
          <Info
            label="Aberta em"
            value={new Date(os.dataHora).toLocaleString("pt-BR")}
          />
          <Info label="Piso" value={os.piso} />
          <Info label="Local" value={os.local} />
          <Info
            label="Executor"
            value={
              os.executor
                ? `${os.executor.nome} (${os.executor.email})`
                : "—"
            }
          />
          <Info
            label="Descrição"
            value={os.descricao}
            full
          />
          {os.observacao && (
            <Info label="Observação" value={os.observacao} full />
          )}
        </Grid>
      </Section>

      {os.osInstalacaoArCondicionado && (
        <Section title="Dados da instalação">
          <Grid>
            <Info
              label="Existe infraestrutura"
              value={
                os.osInstalacaoArCondicionado.existeInfraestrutura
                  ? "Sim"
                  : "Não"
              }
            />
            <Info
              label="Quantidade de pessoas"
              value={String(os.osInstalacaoArCondicionado.quantidadePessoas)}
            />
            <Info
              label="Equipamento substituído — tipo"
              value={os.osInstalacaoArCondicionado.equipamentoSubstituidoTipo ?? "—"}
            />
            <Info
              label="Equipamento substituído — marca"
              value={os.osInstalacaoArCondicionado.equipamentoSubstituidoMarca ?? "—"}
            />
            <Info
              label="Equipamento substituído — modelo"
              value={os.osInstalacaoArCondicionado.equipamentoSubstituidoModelo ?? "—"}
            />
            <Info
              label="Equipamento substituído — capacidade (BTU/h)"
              value={os.osInstalacaoArCondicionado.equipamentoSubstituidoCapacidade ?? "—"}
            />
            <Info
              label="Tipo de aparelho"
              value={os.osInstalacaoArCondicionado.tipoAparelho}
            />
            <Info label="Marca" value={os.osInstalacaoArCondicionado.marca} />
            <Info label="Modelo" value={os.osInstalacaoArCondicionado.modelo} />
            <Info
              label="Capacidade (BTU/h)"
              value={os.osInstalacaoArCondicionado.capacidadeRefrigeracao}
            />
          </Grid>
        </Section>
      )}

      {os.osManutencaoArCondicionado && (
        <Section title="Dados da manutenção">
          <Grid>
            <Info
              label="Tipo de manutenção"
              value={os.osManutencaoArCondicionado.tipoManutencao}
            />
            <Info
              label="Quantidade de pessoas"
              value={String(os.osManutencaoArCondicionado.quantidadePessoas)}
            />
            <Info
              label="Tipo de aparelho"
              value={os.osManutencaoArCondicionado.tipoAparelho}
            />
            <Info label="Marca" value={os.osManutencaoArCondicionado.marca} />
            <Info label="Modelo" value={os.osManutencaoArCondicionado.modelo} />
            <Info
              label="Capacidade (BTU/h)"
              value={os.osManutencaoArCondicionado.capacidadeRefrigeracao}
            />
          </Grid>
        </Section>
      )}

      {os.encerradoEm && (
        <Section title="Encerramento">
          <Grid>
            <Info
              label="Encerrada em"
              value={new Date(os.encerradoEm).toLocaleString("pt-BR")}
            />
            <Info label="Encerrada por" value={os.encerradoPor ?? "—"} />
            <Info
              label="Observações finais"
              value={os.observacoesFinais ?? "—"}
              full
            />
          </Grid>
        </Section>
      )}

      {!concluida && (
        <Section title="Atualizar OS">
          <form
            onSubmit={aplicarMudancas}
            className="grid sm:grid-cols-2 gap-3"
          >
            <Field label="Novo status">
              <select
                className={inputCls}
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value as StatusOS | "")}
              >
                <option value="">— manter —</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nova prioridade">
              <select
                className={inputCls}
                value={novaPrioridade}
                onChange={(e) =>
                  setNovaPrioridade(e.target.value as Prioridade | "")
                }
              >
                <option value="">— manter —</option>
                {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Executor">
              <select
                className={inputCls}
                value={novoExecutor}
                onChange={(e) => setNovoExecutor(e.target.value)}
              >
                <option value="">— manter —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observação" full>
              <textarea
                className={inputCls}
                rows={2}
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={salvando}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Aplicar mudanças
              </button>
            </div>
          </form>
        </Section>
      )}

      {!concluida && (
        <Section title="Encerrar OS">
          <form onSubmit={encerrar} className="grid sm:grid-cols-2 gap-3">
            <Field label="Encerrada por">
              <input
                required
                className={inputCls}
                value={encerrarPor}
                onChange={(e) => setEncerrarPor(e.target.value)}
              />
            </Field>
            <Field label="Observações finais" full>
              <textarea
                className={inputCls}
                rows={2}
                value={obsFinais}
                onChange={(e) => setObsFinais(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={salvando}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Encerrar OS
              </button>
            </div>
          </form>
        </Section>
      )}

      <div>
        <button
          onClick={remover}
          className="text-red-600 text-sm hover:underline"
        >
          Remover esta OS
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-black/10 dark:border-white/10 rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-medium opacity-80">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-3">{children}</div>;
}

function Info({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={`text-sm ${full ? "sm:col-span-2" : ""}`}>
      <div className="opacity-60 text-xs">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block text-sm space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="opacity-80">{label}</span>
      {children}
    </label>
  );
}
