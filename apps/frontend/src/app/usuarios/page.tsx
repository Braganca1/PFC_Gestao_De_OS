"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import {
  TIPO_USUARIO_LABEL,
  type TipoUsuario,
  type Usuario,
} from "@/lib/types";
import { TopBar } from "@/components/TopBar";

const FORM_INICIAL = {
  nome: "",
  email: "",
  senha: "",
  tipo: "CLIENTE" as TipoUsuario,
};

export default function UsuariosPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const usuarioLogado = getUsuario();

  useEffect(() => {
    if (getUsuario()?.tipo !== "ADMINISTRADOR") {
      router.replace("/dashboard");
      return;
    }
    setAutorizado(true);
    carregar();
  }, [router]);

  async function carregar() {
    try {
      setCarregando(true);
      setUsuarios(await api.listarUsuarios());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setCarregando(false);
    }
  }

  function feedback(msg: string) {
    setSucesso(msg);
    setErro(null);
    setTimeout(() => setSucesso(null), 4000);
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api.criarUsuario(form);
      setForm(FORM_INICIAL);
      feedback("Usuário criado com sucesso");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar usuário");
    } finally {
      setSalvando(false);
    }
  }

  async function mudarTipo(u: Usuario, tipo: TipoUsuario) {
    if (tipo === u.tipo) return;
    setErro(null);
    try {
      await api.atualizarUsuario(u.id, { tipo });
      feedback(`Papel de ${u.nome} alterado para ${TIPO_USUARIO_LABEL[tipo]}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao alterar papel");
      await carregar();
    }
  }

  async function remover(u: Usuario) {
    if (!confirm(`Remover o usuário ${u.nome} (${u.email})?`)) return;
    setErro(null);
    try {
      await api.removerUsuario(u.id);
      feedback("Usuário removido");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover usuário");
    }
  }

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm w-full outline-none focus:border-[#7a8c3a]";

  if (!autorizado) return null;

  return (
    <>
      <TopBar title="Usuários" subtitle="Gestão de contas e papéis" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {erro && (
            <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded text-sm">
              {erro}
            </div>
          )}
          {sucesso && (
            <div className="bg-[#7a8c3a]/10 text-[#c8d67a] border border-[#7a8c3a]/20 px-4 py-3 rounded text-sm">
              {sucesso}
            </div>
          )}

          <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Usuários cadastrados
            </h2>
            {carregando ? (
              <p className="text-sm text-[#546278]">Carregando…</p>
            ) : usuarios.length === 0 ? (
              <p className="text-sm text-[#546278]">
                Nenhum usuário cadastrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-[#546278] border-b border-[#1e2838]">
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">E-mail</th>
                      <th className="py-2 pr-4">Papel</th>
                      <th className="py-2 pr-4">Criado em</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => {
                      const ehProprio = u.id === usuarioLogado?.id;
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-[#1e2838]/60 last:border-0"
                        >
                          <td className="py-2.5 pr-4 text-white">
                            {u.nome}
                            {ehProprio && (
                              <span className="ml-2 text-[10px] text-[#7a8fa8]">
                                (você)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4 text-[#bcc4d0]">
                            {u.email}
                          </td>
                          <td className="py-2.5 pr-4">
                            <select
                              className={`${inputCls} w-auto py-1`}
                              value={u.tipo}
                              disabled={ehProprio}
                              title={
                                ehProprio
                                  ? "Você não pode alterar o próprio papel"
                                  : undefined
                              }
                              onChange={(e) =>
                                mudarTipo(u, e.target.value as TipoUsuario)
                              }
                            >
                              {Object.entries(TIPO_USUARIO_LABEL).map(
                                ([k, v]) => (
                                  <option key={k} value={k}>
                                    {v}
                                  </option>
                                ),
                              )}
                            </select>
                          </td>
                          <td className="py-2.5 pr-4 text-[#bcc4d0]">
                            {new Date(u.criadoEm).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2.5 text-right">
                            {!ehProprio && (
                              <button
                                type="button"
                                onClick={() => remover(u)}
                                className="text-[#546278] hover:text-red-400 text-xs transition-colors"
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Criar usuário (acesso por e-mail/senha)
            </h2>
            <p className="text-[11px] text-[#546278]">
              Contas via Google são criadas automaticamente no primeiro login,
              com papel Cliente — promova-as na tabela acima.
            </p>
            <form onSubmit={criar} className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  Nome
                </span>
                <input
                  required
                  className={inputCls}
                  value={form.nome}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nome: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  E-mail
                </span>
                <input
                  type="email"
                  required
                  className={inputCls}
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  Senha
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  className={inputCls}
                  value={form.senha}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senha: e.target.value }))
                  }
                />
              </label>
              <label className="block text-sm space-y-1">
                <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                  Papel
                </span>
                <select
                  className={inputCls}
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tipo: e.target.value as TipoUsuario,
                    }))
                  }
                >
                  {Object.entries(TIPO_USUARIO_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
                >
                  Criar usuário
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
