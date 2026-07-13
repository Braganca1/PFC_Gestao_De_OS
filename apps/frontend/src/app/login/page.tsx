"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getToken, salvarSessao } from "@/lib/auth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    function renderizarBotao() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID!,
        callback: async (response) => {
          setErro(null);
          setEntrando(true);
          try {
            const resultado = await api.loginGoogle(response.credential);
            salvarSessao(resultado.accessToken, resultado.usuario);
            router.replace("/dashboard");
          } catch (e) {
            setErro(
              e instanceof Error ? e.message : "Erro ao entrar com o Google",
            );
            setEntrando(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        locale: "pt-BR",
        width: 320,
      });
    }

    if (window.google) {
      renderizarBotao();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = renderizarBotao;
    document.head.appendChild(script);
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEntrando(true);
    try {
      const resultado = await api.login(email, senha);
      salvarSessao(resultado.accessToken, resultado.usuario);
      router.replace("/dashboard");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao entrar");
      setEntrando(false);
    }
  }

  const inputCls =
    "border border-[#1e2838] bg-[#0f1319] text-[#f8fafc] rounded px-3 py-2 text-sm w-full outline-none focus:border-[#7a8c3a]";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-10 h-10 rounded-md bg-[#7a8c3a] flex items-center justify-center font-black text-[#0f1319] text-sm">
            IME
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">
              Gestão de OS
            </div>
            <div className="text-[#bcc4d0] text-xs">Instituto Militar</div>
          </div>
        </div>

        <div className="border border-[#1e2838] bg-[#161c26] rounded-xl p-6 space-y-5">
          <h1 className="text-sm font-semibold text-white text-center">
            Entrar no sistema
          </h1>

          {erro && (
            <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-2 rounded text-sm">
              {erro}
            </div>
          )}

          {GOOGLE_CLIENT_ID ? (
            <div className="flex justify-center" ref={googleBtnRef} />
          ) : (
            <p className="text-[11px] text-[#546278] text-center">
              Login com Google não configurado (defina
              NEXT_PUBLIC_GOOGLE_CLIENT_ID).
            </p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#1e2838]" />
            <span className="text-[11px] text-[#546278]">ou</span>
            <div className="flex-1 h-px bg-[#1e2838]" />
          </div>

          <form onSubmit={entrar} className="space-y-3">
            <label className="block text-sm space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                E-mail
              </span>
              <input
                type="email"
                required
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-[#546278]">
                Senha
              </span>
              <input
                type="password"
                required
                className={inputCls}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              disabled={entrando}
              className="w-full bg-[#7a8c3a] hover:bg-[#8fa042] text-[#0f1319] font-semibold px-5 py-2 rounded text-sm transition-colors disabled:opacity-50"
            >
              {entrando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
