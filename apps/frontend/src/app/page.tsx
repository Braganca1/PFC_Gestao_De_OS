import Link from "next/link";
import { TopBar } from "@/components/TopBar";

export default function Home() {
  return (
    <>
      <TopBar
        title="Sistema de Gestão de OS"
        subtitle="Instituto Militar de Engenharia"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <Link
            href="/ordens-servico"
            className="border border-[#1e2838] bg-[#161c26] rounded-lg p-6 hover:border-[#7a8c3a] transition-colors"
          >
            <h2 className="font-semibold text-white">Listar Ordens de Serviço</h2>
            <p className="text-sm text-[#bcc4d0] mt-1">
              Visualizar, filtrar e acompanhar OS registradas.
            </p>
          </Link>
          <Link
            href="/ordens-servico/nova"
            className="border border-[#1e2838] bg-[#161c26] rounded-lg p-6 hover:border-[#7a8c3a] transition-colors"
          >
            <h2 className="font-semibold text-white">Abrir nova OS</h2>
            <p className="text-sm text-[#bcc4d0] mt-1">
              Registrar novo pedido de serviço.
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
