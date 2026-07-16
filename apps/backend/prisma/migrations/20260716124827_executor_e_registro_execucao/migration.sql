-- AlterEnum
ALTER TYPE "TipoUsuario" ADD VALUE 'EXECUTOR';

-- AlterTable
ALTER TABLE "ordens_servico" ADD COLUMN     "atividades_executadas" TEXT,
ADD COLUMN     "data_execucao" TIMESTAMP(3);
