import { getToken, limparSessao } from "./auth";
import type {
  Anexo,
  EstatisticasOS,
  HistoricoOs,
  Notificacao,
  OrdemServico,
  StatusOS,
  TipoOS,
  TipoUsuario,
  Usuario,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";

export interface LoginResult {
  accessToken: string;
  usuario: Usuario;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function tratarNaoAutorizado(status: number) {
  if (
    status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/login"
  ) {
    limparSessao();
    window.location.href = "/login";
  }
}

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    tratarNaoAutorizado(res.status);
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const msg =
      (body && typeof body === "object" && "message" in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join(", ")
          : String((body as { message: unknown }).message)
        : null) ?? `Erro ${res.status}`;
    throw new ApiError(res.status, body, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface FiltrosOS {
  numeroOs?: string;
  solicitante?: string;
  status?: StatusOS | "";
  tipo?: TipoOS | "";
}

export const api = {
  login(email: string, senha: string): Promise<LoginResult> {
    return request<LoginResult>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
  },

  loginGoogle(idToken: string): Promise<LoginResult> {
    return request<LoginResult>(`/auth/google`, {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  },

  me(): Promise<Usuario> {
    return request<Usuario>(`/auth/me`);
  },

  listarOrdens(filtros: FiltrosOS = {}): Promise<OrdemServico[]> {
    const qs = new URLSearchParams();
    if (filtros.numeroOs) qs.set("numeroOs", filtros.numeroOs);
    if (filtros.solicitante) qs.set("solicitante", filtros.solicitante);
    if (filtros.status) qs.set("status", filtros.status);
    if (filtros.tipo) qs.set("tipo", filtros.tipo);
    const sufixo = qs.toString() ? `?${qs.toString()}` : "";
    return request<OrdemServico[]>(`/ordens-servico${sufixo}`);
  },

  obterOrdem(id: number): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico/${id}`);
  },

  listarHistorico(id: number): Promise<HistoricoOs[]> {
    return request<HistoricoOs[]>(`/ordens-servico/${id}/historico`);
  },

  criarOrdem(payload: unknown): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  atualizarOrdem(id: number, payload: unknown): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  encerrarOrdem(
    id: number,
    payload: {
      encerradoPor: string;
      observacoesFinais?: string;
    },
  ): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico/${id}/encerrar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  cancelarOrdem(id: number): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico/${id}/cancelar`, {
      method: "PATCH",
    });
  },

  removerOrdem(id: number): Promise<void> {
    return request<void>(`/ordens-servico/${id}`, { method: "DELETE" });
  },

  listarUsuarios(): Promise<Usuario[]> {
    return request<Usuario[]>(`/usuarios`);
  },

  criarUsuario(payload: {
    nome: string;
    email: string;
    senha: string;
    tipo: TipoUsuario;
  }): Promise<Usuario> {
    return request<Usuario>(`/usuarios`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  atualizarUsuario(
    id: number,
    payload: Partial<{ nome: string; email: string; senha: string; tipo: TipoUsuario }>,
  ): Promise<Usuario> {
    return request<Usuario>(`/usuarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  removerUsuario(id: number): Promise<void> {
    return request<void>(`/usuarios/${id}`, { method: "DELETE" });
  },

  obterEstatisticas(): Promise<EstatisticasOS> {
    return request<EstatisticasOS>(`/estatisticas`);
  },

  listarNotificacoes(): Promise<Notificacao[]> {
    return request<Notificacao[]>(`/notificacoes`);
  },

  contarNotificacoesNaoLidas(): Promise<{ total: number }> {
    return request<{ total: number }>(`/notificacoes/nao-lidas`);
  },

  marcarNotificacaoLida(id: number): Promise<Notificacao> {
    return request<Notificacao>(`/notificacoes/${id}/lida`, {
      method: "PATCH",
    });
  },

  marcarTodasNotificacoesLidas(): Promise<void> {
    return request<void>(`/notificacoes/lidas`, { method: "PATCH" });
  },

  async uploadAnexo(osId: number, file: File): Promise<Anexo> {
    const fd = new FormData();
    fd.append("arquivo", file);
    const res = await fetch(`${API_BASE}/ordens-servico/${osId}/anexos`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    });
    if (!res.ok) {
      tratarNaoAutorizado(res.status);
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // ignore
      }
      const msg =
        (body && typeof body === "object" && "message" in body
          ? Array.isArray((body as { message: unknown }).message)
            ? ((body as { message: string[] }).message).join(", ")
            : String((body as { message: unknown }).message)
          : null) ?? `Erro ${res.status}`;
      throw new ApiError(res.status, body, msg);
    }
    return res.json() as Promise<Anexo>;
  },

  removerAnexo(id: number): Promise<void> {
    return request<void>(`/anexos/${id}`, { method: "DELETE" });
  },

  urlAnexo(id: number): string {
    const token = getToken();
    const qs = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE}/anexos/${id}/download${qs}`;
  },
};

export { ApiError };
