"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUsuario } from "@/lib/auth";
import type { Secao } from "@/lib/types";
import { TopBar } from "@/components/TopBar";

export default function SecoesPage() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

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
      setSecoes(await api.listarSecoes());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar seções");
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
    if (!nome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.criarSecao({ nome: nome.trim() });
      setNome("");
      feedback("Seção criada");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao criar seção");
    } finally {
      setSalvando(false);
    }
  }

  async function remover(s: Secao) {
    if (!confirm(`Remover a seção "${s.nome}"?`)) return;
    setErro(null);
    try {
      await api.removerSecao(s.id);
      feedback("Seção removida");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover seção");
    }
  }

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm w-full outline-none focus:border-[#7a8c3a]";

  if (!autorizado) return null;

  return (
    <>
      <TopBar
        title="Seções"
        subtitle="Catálogo de seções para abertura de OS"
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6 max-w-2xl">
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
            <h2 className="text-sm font-semibold text-white">Nova seção</h2>
            <form onSubmit={criar} className="flex gap-3">
              <input
                required
                placeholder="Ex: Seção de Informática"
                className={inputCls}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <button
                type="submit"
                disabled={salvando}
                className="bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50 shrink-0"
              >
                Adicionar
              </button>
            </form>
          </section>

          <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">
              Seções cadastradas
            </h2>
            <p className="text-[11px] text-[#546278]">
              Estas opções aparecem no campo &quot;Seção&quot; da abertura de
              OS. Remover uma seção não altera as OS já registradas com ela.
            </p>
            {carregando ? (
              <p className="text-sm text-[#546278]">Carregando…</p>
            ) : secoes.length === 0 ? (
              <p className="text-sm text-[#546278]">
                Nenhuma seção cadastrada — o formulário de OS aceitará texto
                livre até que alguma seja criada.
              </p>
            ) : (
              <ul className="divide-y divide-[#1e2838]/60">
                {secoes.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-sm text-white">{s.nome}</span>
                    <button
                      type="button"
                      onClick={() => remover(s)}
                      className="text-[#546278] hover:text-red-400 text-xs transition-colors"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
