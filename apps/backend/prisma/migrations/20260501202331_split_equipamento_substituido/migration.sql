-- Substitui o campo único `dados_equipamento_substituido` (string livre)
-- por 4 colunas estruturadas: tipo, marca, modelo e capacidade.

ALTER TABLE "os_instalacao_ar_condicionado"
  DROP COLUMN "dados_equipamento_substituido";

ALTER TABLE "os_instalacao_ar_condicionado"
  ADD COLUMN "equipamento_substituido_tipo" TEXT,
  ADD COLUMN "equipamento_substituido_marca" TEXT,
  ADD COLUMN "equipamento_substituido_modelo" TEXT,
  ADD COLUMN "equipamento_substituido_capacidade" TEXT;
