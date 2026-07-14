-- Conteudo passa a ser obrigatorio; caminho em disco deixa de existir
ALTER TABLE "anexos" ALTER COLUMN "conteudo" SET NOT NULL;
ALTER TABLE "anexos" DROP COLUMN "caminho";
