import type { Usuario } from "./types";

const TOKEN_KEY = "pfc_token";
const USUARIO_KEY = "pfc_usuario";

const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

export function nomeProprio(nome: string): string {
  return nome
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((parte, i) =>
      i > 0 && PARTICULAS.has(parte)
        ? parte
        : parte.charAt(0).toLocaleUpperCase("pt-BR") + parte.slice(1),
    )
    .join(" ");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USUARIO_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function salvarSessao(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}
