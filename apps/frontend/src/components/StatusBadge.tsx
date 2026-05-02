import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  type Prioridade,
  type StatusOS,
} from "@/lib/types";

const STATUS_COR: Record<StatusOS, { bg: string; text: string; dot: string }> = {
  PEDIDO: { bg: "bg-[#e8f4fd]", text: "text-[#1a5f8a]", dot: "bg-[#1a5f8a]" },
  EM_ANALISE: {
    bg: "bg-[#f0ebff]",
    text: "text-[#4a1a8a]",
    dot: "bg-[#4a1a8a]",
  },
  APROVADA: {
    bg: "bg-[#e6f0ff]",
    text: "text-[#1a3f8a]",
    dot: "bg-[#1a3f8a]",
  },
  EM_EXECUCAO: {
    bg: "bg-[#fff7e0]",
    text: "text-[#8a5c00]",
    dot: "bg-[#8a5c00]",
  },
  CONCLUIDA: {
    bg: "bg-[#e6f7ee]",
    text: "text-[#1a6e45]",
    dot: "bg-[#1a6e45]",
  },
  CANCELADA: {
    bg: "bg-[#fde8e8]",
    text: "text-[#8a1a1a]",
    dot: "bg-[#8a1a1a]",
  },
};

const PRIORIDADE_ESTILO: Record<
  Prioridade,
  { color: string; icon: string }
> = {
  BAIXA: { color: "text-[#2e7d5c]", icon: "▼" },
  MEDIA: { color: "text-[#c88a00]", icon: "■" },
  ALTA: { color: "text-[#d35400]", icon: "▲" },
  URGENTE: { color: "text-[#c0392b]", icon: "⚑" },
};

export function StatusBadge({ status }: { status: StatusOS }) {
  const cor = STATUS_COR[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-current/10 text-[11px] font-semibold whitespace-nowrap ${cor.bg} ${cor.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  const estilo = PRIORIDADE_ESTILO[prioridade];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold ${estilo.color}`}
    >
      <span>{estilo.icon}</span>
      {PRIORIDADE_LABEL[prioridade]}
    </span>
  );
}
