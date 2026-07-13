-- AlterTable
ALTER TABLE "ordens_servico" ADD COLUMN     "solicitante_id" INTEGER;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
