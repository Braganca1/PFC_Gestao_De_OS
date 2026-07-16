import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // permite acessar o servidor de dev pelo IP da máquina (teste no celular)
  allowedDevOrigins: ["192.168.15.5"],
};

export default nextConfig;
