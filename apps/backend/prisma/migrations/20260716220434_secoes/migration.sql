-- CreateTable
CREATE TABLE "secoes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "secoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secoes_nome_key" ON "secoes"("nome");

-- Backfill: aproveita as seções já informadas nas OS existentes
INSERT INTO "secoes" ("nome")
SELECT DISTINCT "secao_solicitante" FROM "ordens_servico"
WHERE "secao_solicitante" <> ''
ON CONFLICT DO NOTHING;
