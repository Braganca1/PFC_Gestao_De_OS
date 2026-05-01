-- Substitui o campo único `existe_infraestrutura` por 3 booleanos específicos:
-- elétrica, dreno e tubulação de gás.

ALTER TABLE "os_instalacao_ar_condicionado"
  ADD COLUMN "infraestrutura_eletrica" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "infraestrutura_dreno" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "infraestrutura_gas" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: usa o valor antigo para todos os 3 booleanos nas linhas existentes.
UPDATE "os_instalacao_ar_condicionado"
   SET "infraestrutura_eletrica" = "existe_infraestrutura",
       "infraestrutura_dreno" = "existe_infraestrutura",
       "infraestrutura_gas" = "existe_infraestrutura";

-- Remove DEFAULTs (campos passam a ser obrigatórios sem valor padrão) e drop da coluna antiga.
ALTER TABLE "os_instalacao_ar_condicionado"
  ALTER COLUMN "infraestrutura_eletrica" DROP DEFAULT,
  ALTER COLUMN "infraestrutura_dreno" DROP DEFAULT,
  ALTER COLUMN "infraestrutura_gas" DROP DEFAULT,
  DROP COLUMN "existe_infraestrutura";
