-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('CLIENTE', 'GESTOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "TipoOS" AS ENUM ('CONSTRUCAO_CIVIL', 'ELETRICO', 'INSTALACAO_AR_CONDICIONADO', 'MANUTENCAO_AR_CONDICIONADO');

-- CreateEnum
CREATE TYPE "StatusOS" AS ENUM ('PEDIDO', 'EM_ANALISE', 'APROVADA', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "CanalNotificacao" AS ENUM ('EMAIL', 'INTERNO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo" "TipoUsuario" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" SERIAL NOT NULL,
    "numero_os" TEXT NOT NULL,
    "tipo" "TipoOS" NOT NULL,
    "status" "StatusOS" NOT NULL DEFAULT 'PEDIDO',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_solicitante" TEXT NOT NULL,
    "secao_solicitante" TEXT NOT NULL,
    "nome_representante" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "piso" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "observacao" TEXT,
    "executor_id" INTEGER,
    "encerrado_em" TIMESTAMP(3),
    "encerrado_por" TEXT,
    "observacoes_finais" TEXT,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_construcao_civil" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,

    CONSTRAINT "os_construcao_civil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_eletrico" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,

    CONSTRAINT "os_eletrico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_instalacao_ar_condicionado" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,
    "existe_infraestrutura" BOOLEAN NOT NULL,
    "dados_equipamento_substituido" TEXT,
    "quantidade_pessoas" INTEGER NOT NULL,
    "codigo_aparelho" TEXT,
    "tipo_aparelho" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade_refrigeracao" TEXT NOT NULL,

    CONSTRAINT "os_instalacao_ar_condicionado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_manutencao_ar_condicionado" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,
    "tipo_manutencao" TEXT NOT NULL,
    "quantidade_pessoas" INTEGER NOT NULL,
    "codigo_aparelho" TEXT,
    "tipo_aparelho" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade_refrigeracao" TEXT NOT NULL,

    CONSTRAINT "os_manutencao_ar_condicionado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_os" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "campo_alterado" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_os_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "data_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "os_id" INTEGER NOT NULL,
    "destinatario_id" INTEGER,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "canal" "CanalNotificacao" NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Solicitantes" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Solicitantes_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_os_key" ON "ordens_servico"("numero_os");

-- CreateIndex
CREATE UNIQUE INDEX "os_construcao_civil_os_id_key" ON "os_construcao_civil"("os_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_eletrico_os_id_key" ON "os_eletrico"("os_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_instalacao_ar_condicionado_os_id_key" ON "os_instalacao_ar_condicionado"("os_id");

-- CreateIndex
CREATE UNIQUE INDEX "os_manutencao_ar_condicionado_os_id_key" ON "os_manutencao_ar_condicionado"("os_id");

-- CreateIndex
CREATE INDEX "_Solicitantes_B_index" ON "_Solicitantes"("B");

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_executor_id_fkey" FOREIGN KEY ("executor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_construcao_civil" ADD CONSTRAINT "os_construcao_civil_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_eletrico" ADD CONSTRAINT "os_eletrico_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_instalacao_ar_condicionado" ADD CONSTRAINT "os_instalacao_ar_condicionado_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_manutencao_ar_condicionado" ADD CONSTRAINT "os_manutencao_ar_condicionado_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_os" ADD CONSTRAINT "historico_os_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_os" ADD CONSTRAINT "historico_os_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Solicitantes" ADD CONSTRAINT "_Solicitantes_A_fkey" FOREIGN KEY ("A") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Solicitantes" ADD CONSTRAINT "_Solicitantes_B_fkey" FOREIGN KEY ("B") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
