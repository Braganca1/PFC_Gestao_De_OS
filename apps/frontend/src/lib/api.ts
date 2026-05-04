import type {
  Anexo,
  HistoricoOs,
  OrdemServico,
  StatusOS,
  TipoOS,
  Usuario,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001/api";

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
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
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
      usuarioId: number;
      encerradoPor: string;
      observacoesFinais?: string;
    },
  ): Promise<OrdemServico> {
    return request<OrdemServico>(`/ordens-servico/${id}/encerrar`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  removerOrdem(id: number): Promise<void> {
    return request<void>(`/ordens-servico/${id}`, { method: "DELETE" });
  },

  listarUsuarios(): Promise<Usuario[]> {
    return request<Usuario[]>(`/usuarios`);
  },

  async uploadAnexo(osId: number, file: File): Promise<Anexo> {
    const fd = new FormData();
    fd.append("arquivo", file);
    const res = await fetch(`${API_BASE}/ordens-servico/${osId}/anexos`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
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
    return `${API_BASE}/anexos/${id}/download`;
  },
};

export { ApiError };
