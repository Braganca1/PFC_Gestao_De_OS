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
  type HistoricoOs,
  type OrdemServico,
  type Prioridade,
  type StatusOS,
  type Usuario,
} from "@/lib/types";
import { PrioridadeBadge, StatusBadge } from "@/components/StatusBadge";
import { TopBar } from "@/components/TopBar";
import { AnexosSection } from "@/components/AnexosSection";

interface LinhaMaterial {
  material: string;
  unidade: string;
  quantidade: string;
}

const LINHA_MATERIAL_VAZIA: LinhaMaterial = {
  material: "",
  unidade: "",
  quantidade: "",
};

function serializarMateriais(linhas: LinhaMaterial[]): string {
  return linhas
    .filter((l) => l.material.trim())
    .map((l) =>
      [l.material.trim(), l.unidade.trim(), l.quantidade.trim()]
        .filter(Boolean)
        .join(" — "),
    )
    .join("\n");
}

export default function OrdemDetalhe({ id }: { id: number }) {
  const router = useRouter();
  const [os, setOs] = useState<OrdemServico | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [historico, setHistorico] = useState<HistoricoOs[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // estado dos formulários
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusOS | "">("");
  const [novaPrioridade, setNovaPrioridade] = useState<Prioridade | "">("");
  const [novoExecutor, setNovoExecutor] = useState<string>("");
  const [observacao, setObservacao] = useState("");
  const [encerrarPor, setEncerrarPor] = useState("");
  const [obsFinais, setObsFinais] = useState("");
  const [atividadesExec, setAtividadesExec] = useState("");
  const [dataExec, setDataExec] = useState("");
  const [previsaoInput, setPrevisaoInput] = useState("");
  const [materiaisExec, setMateriaisExec] = useState<LinhaMaterial[]>([
    LINHA_MATERIAL_VAZIA,
  ]);
  const [aceiteObs, setAceiteObs] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      const tipo = getUsuario()?.tipo;
      const gerencia = tipo === "GESTOR" || tipo === "ADMINISTRADOR";
      const [osData, usuariosData, historicoData] = await Promise.all([
        api.obterOrdem(id),
        gerencia
          ? api.listarUsuarios().catch(() => [] as Usuario[])
          : Promise.resolve([] as Usuario[]),
        api.listarHistorico(id).catch(() => [] as HistoricoOs[]),
      ]);
      setOs(osData);
      setUsuarios(usuariosData);
      setHistorico(historicoData);
      preencherFormulario(osData);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  function preencherFormulario(o: OrdemServico) {
    setNovoStatus(o.status);
    setNovaPrioridade(o.prioridade);
    setNovoExecutor(o.executorId ? String(o.executorId) : "");
    setObservacao(o.observacao ?? "");
    setPrevisaoInput(o.previsaoConclusao?.slice(0, 10) ?? "");
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const u = getUsuario();
    setUsuarioLogado(u);
    if (u) setEncerrarPor(u.nome);
  }, []);

  async function aplicarMudancas(e: React.FormEvent) {
    e.preventDefault();
    if (!os) return;
    const payload: Record<string, unknown> = {};
    if (novoStatus && novoStatus !== os.status) payload.status = novoStatus;
    if (novaPrioridade && novaPrioridade !== os.prioridade)
      payload.prioridade = novaPrioridade;
    const executorAtual = os.executorId ? String(os.executorId) : "";
    if (novoExecutor && novoExecutor !== executorAtual)
      payload.executorId = Number(novoExecutor);
    if (observacao !== (os.observacao ?? "")) payload.observacao = observacao;
    if (Object.keys(payload).length === 0) return;

    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.atualizarOrdem(os.id, payload);
      setOs(atualizada);
      preencherFormulario(atualizada);
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
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
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
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

  async function registrarExecucao(e: React.FormEvent) {
    e.preventDefault();
    if (!os || !atividadesExec || !dataExec) return;
    setSalvando(true);
    setErro(null);
    try {
      const materiais = serializarMateriais(materiaisExec);
      const atualizada = await api.registrarExecucao(os.id, {
        atividadesExecutadas: atividadesExec,
        dataExecucao: dataExec,
        materiaisUtilizados: materiais || undefined,
      });
      setOs(atualizada);
      setAtividadesExec("");
      setDataExec("");
      setMateriaisExec([LINHA_MATERIAL_VAZIA]);
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar execução");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarPrevisao(e: React.FormEvent) {
    e.preventDefault();
    if (!os || !previsaoInput) return;
    if (previsaoInput === os.previsaoConclusao?.slice(0, 10)) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.informarPrevisao(os.id, {
        previsaoConclusao: previsaoInput,
      });
      setOs(atualizada);
      preencherFormulario(atualizada);
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar previsão");
    } finally {
      setSalvando(false);
    }
  }

  async function registrarAceite(resolvido: boolean) {
    if (!os) return;
    if (!resolvido && !aceiteObs.trim()) {
      setErro("Descreva a pendência encontrada");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.registrarAceite(os.id, {
        resolvido,
        observacao: aceiteObs.trim() || undefined,
      });
      setOs(atualizada);
      setAceiteObs("");
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar aceite");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarSolicitacao() {
    if (!os) return;
    if (!confirm(`Cancelar a solicitação ${os.numeroOs}?`)) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizada = await api.cancelarOrdem(os.id);
      setOs(atualizada);
      const novoHist = await api
        .listarHistorico(os.id)
        .catch(() => [] as HistoricoOs[]);
      setHistorico(novoHist);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao cancelar");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando)
    return (
      <>
        <TopBar title="Carregando…" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 text-sm text-[#546278]">
          Carregando…
        </main>
      </>
    );
  if (erro && !os)
    return (
      <>
        <TopBar title="Erro" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="bg-red-500/10 text-red-300 px-4 py-3 rounded text-sm">
            {erro}
          </div>
        </main>
      </>
    );
  if (!os) return null;

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm w-full outline-none focus:border-[#7a8c3a]";
  const concluida =
    os.status === "CONCLUIDA" || os.status === "CANCELADA";
  const podeGerenciar =
    !!usuarioLogado &&
    (usuarioLogado.tipo === "GESTOR" || usuarioLogado.tipo === "ADMINISTRADOR");
  const ehDono =
    !!usuarioLogado &&
    (os.solicitanteId === usuarioLogado.id ||
      os.emailSolicitante.toLowerCase() === usuarioLogado.email.toLowerCase());
  const podeCancelarSolicitacao =
    !!usuarioLogado &&
    (usuarioLogado.tipo === "CLIENTE" || usuarioLogado.tipo === "EXECUTOR") &&
    ehDono &&
    os.status === "PEDIDO";
  const ehExecutorDesignado =
    !!usuarioLogado &&
    usuarioLogado.tipo === "EXECUTOR" &&
    os.executorId === usuarioLogado.id;
  const podeRegistrarExecucao =
    !concluida && (podeGerenciar || ehExecutorDesignado);
  const podeRemover =
    !!usuarioLogado && usuarioLogado.tipo === "ADMINISTRADOR";

  return (
    <>
      <TopBar title={os.numeroOs} subtitle={TIPO_OS_LABEL[os.tipo]} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Link
            href="/ordens-servico"
            className="text-xs text-[#bcc4d0] hover:underline"
          >
            ← voltar
          </Link>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <StatusBadge status={os.status} />
          <PrioridadeBadge prioridade={os.prioridade} />
        </div>
      </div>

      <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4">Andamento</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Etapa
            estado={os.atividadesExecutadas ? "ok" : "aguardando"}
            titulo="Execução registrada"
            detalhe={
              os.atividadesExecutadas
                ? [
                    os.executor ? `por ${os.executor.nome}` : null,
                    os.dataExecucao
                      ? new Date(os.dataExecucao).toLocaleDateString("pt-BR")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" — ")
                : "aguardando execução"
            }
          />
          <Etapa
            estado={
              os.aceiteCliente === true
                ? "ok"
                : os.aceiteCliente === false
                  ? "alerta"
                  : "aguardando"
            }
            titulo="Aceite do solicitante"
            detalhe={
              os.aceiteCliente === null
                ? "aguardando manifestação"
                : `${os.aceiteCliente ? "Confirmado" : "Pendência reportada"}${
                    os.aceiteClienteEm
                      ? " — " +
                        new Date(os.aceiteClienteEm).toLocaleDateString("pt-BR")
                      : ""
                  }`
            }
            obs={os.aceiteCliente === false ? os.aceiteClienteObs : null}
          />
          <Etapa
            estado={
              os.encerradoEm
                ? "ok"
                : os.status === "CANCELADA"
                  ? "erro"
                  : "aguardando"
            }
            titulo="Encerramento"
            detalhe={
              os.encerradoEm
                ? [
                    os.encerradoPor ? `por ${os.encerradoPor}` : null,
                    new Date(os.encerradoEm).toLocaleDateString("pt-BR"),
                  ]
                    .filter(Boolean)
                    .join(" — ")
                : os.status === "CANCELADA"
                  ? "OS cancelada"
                  : "aguardando encerramento"
            }
          />
        </div>
      </section>

      {erro && (
        <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded text-sm">
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
          {os.previsaoConclusao && (
            <div className="text-sm">
              <div className="text-[11px] uppercase tracking-wide text-[#546278]">
                Previsão de conclusão
              </div>
              <div className="mt-1 text-[#f8fafc]">
                {new Date(os.previsaoConclusao).toLocaleDateString("pt-BR")}
                {!concluida &&
                  new Date(os.previsaoConclusao) < new Date() && (
                    <span className="ml-2 text-red-400 text-xs font-semibold">
                      (atrasada)
                    </span>
                  )}
              </div>
            </div>
          )}
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

      <AnexosSection
        osId={os.id}
        anexos={os.anexos ?? []}
        onChange={carregar}
      />

      {os.osInstalacaoArCondicionado && (
        <Section title="Dados da instalação">
          <Grid>
            <Info
              label="Infraestrutura elétrica"
              value={
                os.osInstalacaoArCondicionado.infraestruturaEletrica
                  ? "Sim"
                  : "Não"
              }
            />
            <Info
              label="Infraestrutura de dreno"
              value={
                os.osInstalacaoArCondicionado.infraestruturaDreno
                  ? "Sim"
                  : "Não"
              }
            />
            <Info
              label="Tubulação de gás"
              value={
                os.osInstalacaoArCondicionado.infraestruturaGas
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

      {(os.atividadesExecutadas || os.dataExecucao) && (
        <Section title="Execução">
          <Grid>
            <Info
              label="Data da execução"
              value={
                os.dataExecucao
                  ? new Date(os.dataExecucao).toLocaleDateString("pt-BR")
                  : "—"
              }
            />
            <Info
              label="Atividades executadas"
              value={os.atividadesExecutadas ?? "—"}
              full
            />
            {os.materiaisUtilizados && (
              <div className="text-sm sm:col-span-2">
                <div className="text-[11px] uppercase tracking-wide text-[#546278]">
                  Materiais utilizados
                </div>
                <table className="mt-1 text-sm">
                  <tbody>
                    {os.materiaisUtilizados.split("\n").map((linha, i) => {
                      const [material, unidade, quantidade] =
                        linha.split(" — ");
                      return (
                        <tr key={i}>
                          <td className="text-[#f8fafc] pr-6 py-0.5">
                            {material}
                          </td>
                          <td className="text-[#bcc4d0] pr-6 py-0.5">
                            {unidade ?? ""}
                          </td>
                          <td className="text-[#bcc4d0] py-0.5">
                            {quantidade ?? ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Grid>
        </Section>
      )}

      {ehDono && !concluida && os.atividadesExecutadas && (
        <Section title="Confirmação do solicitante">
          <p className="text-[11px] text-[#546278]">
            O serviço foi executado. Confirme se o problema foi resolvido ou
            reporte uma pendência para a equipe.
          </p>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Observação (obrigatória ao reportar pendência)"
            value={aceiteObs}
            onChange={(e) => setAceiteObs(e.target.value)}
          />
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => registrarAceite(true)}
              disabled={salvando}
              className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              Confirmar resolução
            </button>
            <button
              type="button"
              onClick={() => registrarAceite(false)}
              disabled={salvando}
              className="border border-[#c88a00] text-[#c88a00] hover:bg-[#c88a00]/10 font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              Reportar pendência
            </button>
          </div>
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

      {!concluida && podeGerenciar && (
        <Section title="Atualizar OS">
          <form
            onSubmit={aplicarMudancas}
            className="grid sm:grid-cols-2 gap-3"
          >
            <Field label="Status">
              <select
                className={inputCls}
                value={novoStatus}
                onChange={(e) => setNovoStatus(e.target.value as StatusOS | "")}
              >
                {Object.entries(STATUS_LABEL)
                  // concluir só pelo encerramento formal
                  .filter(([k]) => k !== "CONCLUIDA")
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Prioridade">
              <select
                className={inputCls}
                value={novaPrioridade}
                onChange={(e) =>
                  setNovaPrioridade(e.target.value as Prioridade | "")
                }
              >
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
                {!os.executorId && <option value="">Sem executor</option>}
                {usuarios
                  .filter(
                    (u) => u.tipo !== "CLIENTE" || u.id === os.executorId,
                  )
                  .map((u) => (
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
                className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Aplicar mudanças
              </button>
            </div>
          </form>
        </Section>
      )}

      {podeRegistrarExecucao && (
        <Section title="Previsão de conclusão">
          <form onSubmit={salvarPrevisao} className="flex flex-wrap items-end gap-3">
            <Field label="Data prevista">
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
                value={previsaoInput}
                onChange={(e) => setPrevisaoInput(e.target.value)}
              />
            </Field>
            <button
              type="submit"
              disabled={salvando}
              className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              Salvar previsão
            </button>
          </form>
        </Section>
      )}

      {podeRegistrarExecucao && (
        <Section title="Registrar execução">
          <form onSubmit={registrarExecucao} className="grid sm:grid-cols-2 gap-3">
            <Field label="Data da execução">
              <input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                className={inputCls}
                value={dataExec}
                onChange={(e) => setDataExec(e.target.value)}
              />
            </Field>
            <Field label="Atividades executadas" full>
              <textarea
                required
                className={inputCls}
                rows={3}
                placeholder="Descreva o que foi realizado no serviço"
                value={atividadesExec}
                onChange={(e) => setAtividadesExec(e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2 space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                Materiais utilizados
              </span>
              <div className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_1.5rem] gap-2 text-[10px] uppercase tracking-wide text-[#546278]">
                  <span>Material</span>
                  <span>Unidade</span>
                  <span>Qtd</span>
                  <span />
                </div>
                {materiaisExec.map((linha, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.5rem_1.5rem] gap-2 items-center"
                  >
                    <input
                      className={inputCls}
                      placeholder="Ex: Tijolo"
                      value={linha.material}
                      onChange={(e) =>
                        setMateriaisExec((ls) =>
                          ls.map((l, j) =>
                            j === i ? { ...l, material: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <input
                      className={inputCls}
                      placeholder="5kg"
                      value={linha.unidade}
                      onChange={(e) =>
                        setMateriaisExec((ls) =>
                          ls.map((l, j) =>
                            j === i ? { ...l, unidade: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <input
                      className={inputCls}
                      placeholder="3"
                      value={linha.quantidade}
                      onChange={(e) =>
                        setMateriaisExec((ls) =>
                          ls.map((l, j) =>
                            j === i ? { ...l, quantidade: e.target.value } : l,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMateriaisExec((ls) =>
                          ls.length > 1
                            ? ls.filter((_, j) => j !== i)
                            : [LINHA_MATERIAL_VAZIA],
                        )
                      }
                      className="text-[#546278] hover:text-red-400 text-base leading-none"
                      aria-label="Remover material"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setMateriaisExec((ls) => [...ls, LINHA_MATERIAL_VAZIA])
                  }
                  className="text-[11px] text-[#c8d67a] hover:underline"
                >
                  + Adicionar material
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={salvando}
                className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Registrar execução
              </button>
            </div>
          </form>
        </Section>
      )}

      {!concluida && podeGerenciar && (
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
                className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
              >
                Encerrar OS
              </button>
            </div>
          </form>
        </Section>
      )}

      <Section title="Histórico de alterações">
        {historico.length === 0 ? (
          <p className="text-sm text-[#546278]">Nenhuma alteração registrada.</p>
        ) : (
          <ul className="space-y-3">
            {historico.map((h) => (
              <li
                key={h.id}
                className="text-sm border-l-2 border-[#7a8c3a]/40 pl-3"
              >
                <div className="text-[11px] text-[#546278]">
                  {new Date(h.dataHora).toLocaleString("pt-BR")} —{" "}
                  <span className="text-[#bcc4d0]">{h.usuario.nome}</span>
                </div>
                {h.campoAlterado === "anexo" ? (
                  <div className="text-[#f8fafc]">
                    <span className="font-semibold">
                      {h.valorNovo ? "Anexo adicionado:" : "Anexo removido:"}
                    </span>{" "}
                    <span
                      className={
                        h.valorNovo
                          ? "text-[#c8d67a]"
                          : "text-[#546278] line-through"
                      }
                    >
                      {h.valorNovo ?? h.valorAnterior}
                    </span>
                  </div>
                ) : (
                  <div className="text-[#f8fafc]">
                    <span className="font-semibold">{rotuloCampo(h.campoAlterado)}:</span>{" "}
                    <span className="text-[#546278] line-through">
                      {formatarValor(h.campoAlterado, h.valorAnterior)}
                    </span>{" "}
                    <span className="text-[#546278]">→</span>{" "}
                    <span className="text-[#c8d67a]">
                      {formatarValor(h.campoAlterado, h.valorNovo)}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {podeCancelarSolicitacao && (
        <div>
          <button
            onClick={cancelarSolicitacao}
            disabled={salvando}
            className="text-red-400 text-sm hover:underline disabled:opacity-50"
          >
            Cancelar solicitação
          </button>
        </div>
      )}

      {podeRemover && (
        <div>
          <button
            onClick={remover}
            className="text-red-400 text-sm hover:underline"
          >
            Remover esta OS
          </button>
        </div>
      )}
        </div>
      </main>
    </>
  );
}

const ROTULO_CAMPO: Record<string, string> = {
  status: "Status",
  prioridade: "Prioridade",
  executor: "Executor",
  observacao: "Observação",
  descricao: "Descrição",
  piso: "Piso",
  local: "Local",
  encerradoPor: "Encerrado por",
  observacoesFinais: "Observações finais",
  atividadesExecutadas: "Atividades executadas",
  dataExecucao: "Data da execução",
  materiaisUtilizados: "Materiais utilizados",
  previsaoConclusao: "Previsão de conclusão",
  aceiteCliente: "Aceite do solicitante",
  aceiteClienteObs: "Observação do aceite",
};

function rotuloCampo(campo: string): string {
  return ROTULO_CAMPO[campo] ?? campo;
}

function formatarValor(campo: string, valor: string | null): string {
  if (valor == null) return "—";
  if (campo === "status") return STATUS_LABEL[valor as StatusOS] ?? valor;
  if (campo === "prioridade")
    return PRIORIDADE_LABEL[valor as Prioridade] ?? valor;
  if (campo === "aceiteCliente")
    return valor === "true" ? "Confirmado" : "Pendência";
  return valor;
}

const ETAPA_ESTILO = {
  ok: { icone: "✓", cor: "text-[#c8d67a]", borda: "border-[#7a8c3a]/50" },
  alerta: { icone: "⚠", cor: "text-[#e0a93f]", borda: "border-[#c88a00]/50" },
  erro: { icone: "✗", cor: "text-red-400", borda: "border-red-500/40" },
  aguardando: { icone: "○", cor: "text-[#546278]", borda: "border-[#1e2838]" },
} as const;

function Etapa({
  estado,
  titulo,
  detalhe,
  obs,
}: {
  estado: keyof typeof ETAPA_ESTILO;
  titulo: string;
  detalhe: string;
  obs?: string | null;
}) {
  const estilo = ETAPA_ESTILO[estado];
  return (
    <div className={`border ${estilo.borda} bg-[#0f1319] rounded-lg px-4 py-3`}>
      <div className="flex items-center gap-2">
        <span className={`${estilo.cor} text-base leading-none`}>
          {estilo.icone}
        </span>
        <span className="text-[13px] font-semibold text-white">{titulo}</span>
      </div>
      <div
        className={`mt-1 text-[11px] ${
          estado === "aguardando" ? "text-[#546278]" : estilo.cor
        }`}
      >
        {detalhe}
      </div>
      {obs && (
        <div className="mt-1 text-[11px] text-[#bcc4d0] italic">
          &ldquo;{obs}&rdquo;
        </div>
      )}
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
    <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
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
      <div className="text-[11px] uppercase tracking-wide text-[#546278]">{label}</div>
      <div className="mt-1 text-[#f8fafc]">{value}</div>
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
      <span className="text-[11px] uppercase tracking-wide text-[#546278]">{label}</span>
      {children}
    </label>
  );
}
