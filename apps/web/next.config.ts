import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // O Web é compilado no GitHub e publicado como ficheiros estáticos. A API
  // continua como a única aplicação Node no servidor.
  ...(isDevelopment
    ? {
        // O `next dev` não interpreta public/.htaccess. Estas regras reproduzem
        // localmente o fallback usado por Apache/Nginx, preservando a URL para
        // os componentes extraírem token/id de usePathname().
        async rewrites() {
          return [
            { source: "/track/:path*", destination: "/track" },
            { source: "/portal/:path*", destination: "/portal" },
            { source: "/viagens/:path*", destination: "/viagens" },
          ];
        },
      }
    : { output: "export" as const }),
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
