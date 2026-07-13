"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUsuario } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const usuario = getUsuario();
    router.replace(
      usuario?.tipo === "CLIENTE" ? "/ordens-servico" : "/dashboard",
    );
  }, [router]);

  return null;
}
