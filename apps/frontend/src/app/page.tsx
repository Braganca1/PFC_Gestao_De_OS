import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Gestão de OS</h1>
        <p className="text-sm opacity-70 mt-2">
          Instituto Militar de Engenharia — Projeto Final de Curso
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/ordens-servico"
          className="border border-black/10 dark:border-white/10 rounded-lg p-6 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <h2 className="font-semibold">Listar Ordens de Serviço</h2>
          <p className="text-sm opacity-70 mt-1">
            Visualizar, filtrar e acompanhar OS registradas.
          </p>
        </Link>

        <Link
          href="/ordens-servico/nova"
          className="border border-black/10 dark:border-white/10 rounded-lg p-6 hover:bg-black/5 dark:hover:bg-white/5"
        >
          <h2 className="font-semibold">Abrir nova OS</h2>
          <p className="text-sm opacity-70 mt-1">
            Registrar novo pedido de serviço.
          </p>
        </Link>
      </div>
    </div>
  );
}
