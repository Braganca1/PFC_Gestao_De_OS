import {
  PRIORIDADE_LABEL,
  STATUS_LABEL,
  type Prioridade,
  type StatusOS,
} from "@/lib/types";

const STATUS_COR: Record<StatusOS, string> = {
  PEDIDO: "bg-gray-200 text-gray-800",
  EM_ANALISE: "bg-blue-100 text-blue-800",
  APROVADA: "bg-indigo-100 text-indigo-800",
  EM_EXECUCAO: "bg-yellow-100 text-yellow-800",
  CONCLUIDA: "bg-green-100 text-green-800",
  CANCELADA: "bg-red-100 text-red-800",
};

const PRIORIDADE_COR: Record<Prioridade, string> = {
  BAIXA: "bg-gray-100 text-gray-700",
  MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-orange-100 text-orange-800",
  URGENTE: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: StatusOS }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-1 rounded ${STATUS_COR[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PrioridadeBadge({ prioridade }: { prioridade: Prioridade }) {
  return (
    <span
      className={`inline-block text-xs font-medium px-2 py-1 rounded ${PRIORIDADE_COR[prioridade]}`}
    >
      {PRIORIDADE_LABEL[prioridade]}
    </span>
  );
}
