import { TIPO_OS_LABEL, type TipoOS } from "@/lib/types";

const TIPO_COR: Record<TipoOS, string> = {
  CONSTRUCAO_CIVIL: "bg-[#e8f0ff] text-[#2a4a99]",
  ELETRICO: "bg-[#fff5e0] text-[#8a5500]",
  INSTALACAO_AR_CONDICIONADO: "bg-[#e0f5ff] text-[#005a8a]",
  MANUTENCAO_AR_CONDICIONADO: "bg-[#e8ffe8] text-[#1a6e1a]",
};

const TIPO_CURTO: Record<TipoOS, string> = {
  CONSTRUCAO_CIVIL: "Construção Civil",
  ELETRICO: "Elétrico",
  INSTALACAO_AR_CONDICIONADO: "Inst. Ar Cond.",
  MANUTENCAO_AR_CONDICIONADO: "Mnt. Ar Cond.",
};

export function TypeBadge({
  tipo,
  curto = true,
}: {
  tipo: TipoOS;
  curto?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${TIPO_COR[tipo]}`}
    >
      {curto ? TIPO_CURTO[tipo] : TIPO_OS_LABEL[tipo]}
    </span>
  );
}
