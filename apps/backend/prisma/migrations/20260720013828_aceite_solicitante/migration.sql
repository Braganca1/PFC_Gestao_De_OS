-- AlterTable
ALTER TABLE "ordens_servico" ADD COLUMN     "aceite_cliente" BOOLEAN,
ADD COLUMN     "aceite_cliente_em" TIMESTAMP(3),
ADD COLUMN     "aceite_cliente_obs" TEXT;
