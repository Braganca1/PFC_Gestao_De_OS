"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TIPO_OS_LABEL, type TipoOS } from "@/lib/types";
import { TopBar } from "@/components/TopBar";

interface FormState {
  tipo: TipoOS;
  emailSolicitante: string;
  secaoSolicitante: string;
  nomeRepresentante: string;
  descricao: string;
  piso: string;
  local: string;
  // instalação
  inst_infraEletrica: boolean;
  inst_infraDreno: boolean;
  inst_infraGas: boolean;
  inst_substTipo: string;
  inst_substMarca: string;
  inst_substModelo: string;
  inst_substCapacidade: string;
  inst_quantidadePessoas: string;
  inst_tipoAparelho: string;
  inst_marca: string;
  inst_modelo: string;
  inst_capacidade: string;
  // manutenção
  manut_tipoManutencao: string;
  manut_quantidadePessoas: string;
  manut_tipoAparelho: string;
  manut_marca: string;
  manut_modelo: string;
  manut_capacidade: string;
}

const ESTADO_INICIAL: FormState = {
  tipo: "ELETRICO",
  emailSolicitante: "",
  secaoSolicitante: "",
  nomeRepresentante: "",
  descricao: "",
  piso: "",
  local: "",
  inst_infraEletrica: false,
  inst_infraDreno: false,
  inst_infraGas: false,
  inst_substTipo: "",
  inst_substMarca: "",
  inst_substModelo: "",
  inst_substCapacidade: "",
  inst_quantidadePessoas: "",
  inst_tipoAparelho: "",
  inst_marca: "",
  inst_modelo: "",
  inst_capacidade: "",
  manut_tipoManutencao: "",
  manut_quantidadePessoas: "",
  manut_tipoAparelho: "",
  manut_marca: "",
  manut_modelo: "",
  manut_capacidade: "",
};

export default function NovaOrdemPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const payload: Record<string, unknown> = {
      tipo: form.tipo,
      emailSolicitante: form.emailSolicitante,
      secaoSolicitante: form.secaoSolicitante,
      nomeRepresentante: form.nomeRepresentante,
      descricao: form.descricao,
      piso: form.piso,
      local: form.local,
    };

    if (form.tipo === "INSTALACAO_AR_CONDICIONADO") {
      payload.dadosInstalacao = {
        infraestruturaEletrica: form.inst_infraEletrica,
        infraestruturaDreno: form.inst_infraDreno,
        infraestruturaGas: form.inst_infraGas,
        equipamentoSubstituidoTipo: form.inst_substTipo || undefined,
        equipamentoSubstituidoMarca: form.inst_substMarca || undefined,
        equipamentoSubstituidoModelo: form.inst_substModelo || undefined,
        equipamentoSubstituidoCapacidade:
          form.inst_substCapacidade || undefined,
        quantidadePessoas: Number(form.inst_quantidadePessoas),
        tipoAparelho: form.inst_tipoAparelho,
        marca: form.inst_marca,
        modelo: form.inst_modelo,
        capacidadeRefrigeracao: form.inst_capacidade,
      };
    }
    if (form.tipo === "MANUTENCAO_AR_CONDICIONADO") {
      payload.dadosManutencao = {
        tipoManutencao: form.manut_tipoManutencao,
        quantidadePessoas: Number(form.manut_quantidadePessoas),
        tipoAparelho: form.manut_tipoAparelho,
        marca: form.manut_marca,
        modelo: form.manut_modelo,
        capacidadeRefrigeracao: form.manut_capacidade,
      };
    }

    try {
      const criada = await api.criarOrdem(payload);
      router.push(`/ordens-servico/${criada.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar OS");
      setEnviando(false);
    }
  }

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm w-full outline-none focus:border-[#7a8c3a] placeholder:text-[#546278]";

  return (
    <>
      <TopBar
        title="Nova Ordem de Serviço"
        subtitle="Registrar novo pedido de serviço"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6 max-w-3xl">
      {erro && (
        <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded text-sm">
          {erro}
        </div>
      )}

      <form onSubmit={enviar} className="space-y-6">
        <Section title="Tipo de OS">
          <select
            className={inputCls}
            value={form.tipo}
            onChange={(e) => set("tipo", e.target.value as TipoOS)}
          >
            {Object.entries(TIPO_OS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Section>

        <Section title="Dados do solicitante">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="E-mail" required>
              <input
                type="email"
                required
                placeholder="solicitante@ime.eb.br"
                className={inputCls}
                value={form.emailSolicitante}
                onChange={(e) => set("emailSolicitante", e.target.value)}
              />
            </Field>
            <Field label="Seção" required>
              <input
                required
                placeholder="Ex: Seção de Informática"
                className={inputCls}
                value={form.secaoSolicitante}
                onChange={(e) => set("secaoSolicitante", e.target.value)}
              />
            </Field>
            <Field label="Nome do representante" full required>
              <input
                required
                placeholder="Ex: Cap. João Silva"
                className={inputCls}
                value={form.nomeRepresentante}
                onChange={(e) => set("nomeRepresentante", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Local e descrição">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Piso" required>
              <input
                required
                placeholder="Ex: 2º piso"
                className={inputCls}
                value={form.piso}
                onChange={(e) => set("piso", e.target.value)}
              />
            </Field>
            <Field label="Local" required>
              <input
                required
                placeholder="Ex: Sala 105, Laboratório B"
                className={inputCls}
                value={form.local}
                onChange={(e) => set("local", e.target.value)}
              />
            </Field>
            <Field label="Descrição do problema" full required>
              <textarea
                required
                rows={3}
                placeholder="Descreva o problema ou serviço solicitado com o máximo de detalhes possível."
                className={inputCls}
                value={form.descricao}
                onChange={(e) => set("descricao", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {form.tipo === "INSTALACAO_AR_CONDICIONADO" && (
          <Section title="Dados — Instalação de Ar Condicionado">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Infraestrutura elétrica?">
                <select
                  className={inputCls}
                  value={form.inst_infraEletrica ? "sim" : "nao"}
                  onChange={(e) =>
                    set("inst_infraEletrica", e.target.value === "sim")
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>
              <Field label="Infraestrutura de dreno?">
                <select
                  className={inputCls}
                  value={form.inst_infraDreno ? "sim" : "nao"}
                  onChange={(e) =>
                    set("inst_infraDreno", e.target.value === "sim")
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>
              <Field label="Tubulação de gás?">
                <select
                  className={inputCls}
                  value={form.inst_infraGas ? "sim" : "nao"}
                  onChange={(e) =>
                    set("inst_infraGas", e.target.value === "sim")
                  }
                >
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </select>
              </Field>
              <Field label="Quantidade de pessoas na sala" required>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Ex: 10"
                  className={inputCls}
                  value={form.inst_quantidadePessoas}
                  onChange={(e) =>
                    set("inst_quantidadePessoas", e.target.value)
                  }
                />
              </Field>
              <Field label="Equipamento substituído — tipo">
                <input
                  placeholder="Ex: Split"
                  className={inputCls}
                  value={form.inst_substTipo}
                  onChange={(e) => set("inst_substTipo", e.target.value)}
                />
              </Field>
              <Field label="Equipamento substituído — marca">
                <input
                  placeholder="Ex: Agratto"
                  className={inputCls}
                  value={form.inst_substMarca}
                  onChange={(e) => set("inst_substMarca", e.target.value)}
                />
              </Field>
              <Field label="Equipamento substituído — modelo">
                <input
                  placeholder="Ex: TS-Q122"
                  className={inputCls}
                  value={form.inst_substModelo}
                  onChange={(e) => set("inst_substModelo", e.target.value)}
                />
              </Field>
              <Field label="Equipamento substituído — capacidade (BTU/h)">
                <input
                  placeholder="Ex: 12000"
                  className={inputCls}
                  value={form.inst_substCapacidade}
                  onChange={(e) => set("inst_substCapacidade", e.target.value)}
                />
              </Field>
              <Field label="Tipo de aparelho" required>
                <input
                  required
                  placeholder="Ex: Janela"
                  className={inputCls}
                  value={form.inst_tipoAparelho}
                  onChange={(e) => set("inst_tipoAparelho", e.target.value)}
                />
              </Field>
              <Field label="Marca" required>
                <input
                  required
                  placeholder="Ex: LG"
                  className={inputCls}
                  value={form.inst_marca}
                  onChange={(e) => set("inst_marca", e.target.value)}
                />
              </Field>
              <Field label="Modelo" required>
                <input
                  required
                  placeholder="Ex: FTXS35KAVMA"
                  className={inputCls}
                  value={form.inst_modelo}
                  onChange={(e) => set("inst_modelo", e.target.value)}
                />
              </Field>
              <Field label="Capacidade (BTU/h)" required>
                <input
                  required
                  placeholder="Ex: 12000"
                  className={inputCls}
                  value={form.inst_capacidade}
                  onChange={(e) => set("inst_capacidade", e.target.value)}
                />
              </Field>
            </div>
          </Section>
        )}

        {form.tipo === "MANUTENCAO_AR_CONDICIONADO" && (
          <Section title="Dados — Manutenção de Ar Condicionado">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Tipo de manutenção" required>
                <input
                  required
                  placeholder="Ex: Preventiva, Corretiva"
                  className={inputCls}
                  value={form.manut_tipoManutencao}
                  onChange={(e) => set("manut_tipoManutencao", e.target.value)}
                />
              </Field>
              <Field label="Quantidade de pessoas na sala" required>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Ex: 8"
                  className={inputCls}
                  value={form.manut_quantidadePessoas}
                  onChange={(e) =>
                    set("manut_quantidadePessoas", e.target.value)
                  }
                />
              </Field>
              <Field label="Tipo de aparelho" required>
                <input
                  required
                  placeholder="Ex: Split Hi-Wall"
                  className={inputCls}
                  value={form.manut_tipoAparelho}
                  onChange={(e) => set("manut_tipoAparelho", e.target.value)}
                />
              </Field>
              <Field label="Marca" required>
                <input
                  required
                  placeholder="Ex: Carrier"
                  className={inputCls}
                  value={form.manut_marca}
                  onChange={(e) => set("manut_marca", e.target.value)}
                />
              </Field>
              <Field label="Modelo" required>
                <input
                  required
                  placeholder="Ex: 42XQB012515LC"
                  className={inputCls}
                  value={form.manut_modelo}
                  onChange={(e) => set("manut_modelo", e.target.value)}
                />
              </Field>
              <Field label="Capacidade (BTU/h)" required>
                <input
                  required
                  placeholder="Ex: 18000"
                  className={inputCls}
                  value={form.manut_capacidade}
                  onChange={(e) => set("manut_capacidade", e.target.value)}
                />
              </Field>
            </div>
          </Section>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
          >
            {enviando ? "Enviando…" : "Registrar OS"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-[#1e2838] text-[#bcc4d0] hover:text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
        </div>
      </main>
    </>
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
    <fieldset className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
      <legend className="px-2 text-sm font-semibold text-white">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  children,
  full,
  required,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  required?: boolean;
}) {
  return (
    <label className={`block text-sm space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[11px] uppercase tracking-wide text-[#546278]">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
