"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUsuario } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const usuario = getUsuario();
    const semDashboard =
      usuario?.tipo === "CLIENTE" || usuario?.tipo === "EXECUTOR";
    router.replace(semDashboard ? "/ordens-servico" : "/dashboard");
  }, [router]);

  return null;
}
