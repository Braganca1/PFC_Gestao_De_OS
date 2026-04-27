import OrdemDetalhe from "./OrdemDetalhe";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrdemDetalhe id={Number(id)} />;
}
