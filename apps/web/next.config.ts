import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Web é compilado no GitHub e publicado como ficheiros estáticos. A API
  // continua como a única aplicação Node no servidor.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
