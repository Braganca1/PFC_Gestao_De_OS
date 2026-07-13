"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    if (isLogin) return;
    if (!getToken()) {
      router.replace("/login");
    } else {
      setAutenticado(true);
    }
  }, [isLogin, router]);

  if (isLogin) return <>{children}</>;

  if (!autenticado) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-[#546278]">
        Carregando…
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
