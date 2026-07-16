"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

interface MenuContextValue {
  aberto: boolean;
  abrir: () => void;
  fechar: () => void;
}

const MenuContext = createContext<MenuContextValue>({
  aberto: false,
  abrir: () => {},
  fechar: () => {},
});

export function useMenu() {
  return useContext(MenuContext);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const [autenticado, setAutenticado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const abrir = useCallback(() => setMenuAberto(true), []);
  const fechar = useCallback(() => setMenuAberto(false), []);

  useEffect(() => {
    if (isLogin) return;
    if (!getToken()) {
      router.replace("/login");
    } else {
      setAutenticado(true);
    }
  }, [isLogin, router]);

  // fecha a gaveta ao navegar para outra página
  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  if (isLogin) return <>{children}</>;

  if (!autenticado) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-[#546278]">
        Carregando…
      </div>
    );
  }

  return (
    <MenuContext.Provider value={{ aberto: menuAberto, abrir, fechar }}>
      <div className="flex h-screen">
        {/* sidebar fixa no desktop */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* gaveta no mobile */}
        {menuAberto && (
          <div className="md:hidden">
            <div
              className="fixed inset-0 bg-black/60 z-40"
              onClick={fechar}
              aria-hidden="true"
            />
            <div className="fixed inset-y-0 left-0 z-50 flex">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
    </MenuContext.Provider>
  );
}
