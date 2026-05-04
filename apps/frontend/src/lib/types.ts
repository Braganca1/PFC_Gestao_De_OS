export type TipoOS =
  | "CONSTRUCAO_CIVIL"
  | "ELETRICO"
  | "INSTALACAO_AR_CONDICIONADO"
  | "MANUTENCAO_AR_CONDICIONADO";

export type StatusOS =
  | "PEDIDO"
  | "EM_ANALISE"
  | "APROVADA"
  | "EM_EXECUCAO"
  | "CONCLUIDA"
  | "CANCELADA";

export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type TipoUsuario = "CLIENTE" | "GESTOR" | "ADMINISTRADOR";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  criadoEm: string;
}

export interface DadosInstalacaoAr {
  infraestruturaEletrica: boolean;
  infraestruturaDreno: boolean;
  infraestruturaGas: boolean;
  equipamentoSubstituidoTipo?: string | null;
  equipamentoSubstituidoMarca?: string | null;
  equipamentoSubstituidoModelo?: string | null;
  equipamentoSubstituidoCapacidade?: string | null;
  quantidadePessoas: number;
  codigoAparelho?: string | null;
  tipoAparelho: string;
  marca: string;
  modelo: string;
  capacidadeRefrigeracao: string;
}

export interface DadosManutencaoAr {
  tipoManutencao: string;
  quantidadePessoas: number;
  codigoAparelho?: string | null;
  tipoAparelho: string;
  marca: string;
  modelo: string;
  capacidadeRefrigeracao: string;
}

export interface OrdemServico {
  id: number;
  numeroOs: string;
  tipo: TipoOS;
  status: StatusOS;
  prioridade: Prioridade;
  dataHora: string;
  emailSolicitante: string;
  secaoSolicitante: string;
  nomeRepresentante: string;
  descricao: string;
  piso: string;
  local: string;
  observacao: string | null;
  executorId: number | null;
  executor: { id: number; nome: string; email: string } | null;
  encerradoEm: string | null;
  encerradoPor: string | null;
  observacoesFinais: string | null;
  osConstrucaoCivil: { id: number } | null;
  osEletrico: { id: number } | null;
  osInstalacaoArCondicionado: ({ id: number } & DadosInstalacaoAr) | null;
  osManutencaoArCondicionado: ({ id: number } & DadosManutencaoAr) | null;
  anexos?: Anexo[];
}

export interface Anexo {
  id: number;
  osId: number;
  nomeArquivo: string;
  tipoMime: string;
  caminho: string;
  tamanho: number;
  dataUpload: string;
}

export const TIPO_OS_LABEL: Record<TipoOS, string> = {
  CONSTRUCAO_CIVIL: "Construção Civil",
  ELETRICO: "Elétrico",
  INSTALACAO_AR_CONDICIONADO: "Instalação de Ar Condicionado",
  MANUTENCAO_AR_CONDICIONADO: "Manutenção de Ar Condicionado",
};

export const STATUS_LABEL: Record<StatusOS, string> = {
  PEDIDO: "Pedido",
  EM_ANALISE: "Em análise",
  APROVADA: "Aprovada",
  EM_EXECUCAO: "Em execução",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export interface HistoricoOs {
  id: number;
  osId: number;
  usuarioId: number;
  usuario: { id: number; nome: string; email: string };
  campoAlterado: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  dataHora: string;
}

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};
