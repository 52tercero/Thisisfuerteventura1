import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Built-in i18n config to support locale routing
  // Silencia advertencia de trazado en monorepo (raíz arriba del directorio next)
  outputFileTracingRoot: process.cwd(),
  // Permite acceso dev desde hosts alternativos (warning cross origin 127.0.0.1)
  // Añadimos localhost, 127.0.0.1 y la interfaz de red observada (192.168.56.1)
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.56.1'],
};

export default nextConfig;
