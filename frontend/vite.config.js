import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import compression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useHttps = env.VITE_USE_HTTPS === 'true';
  const isDev = mode === 'development';
  
  return {
    plugins: [
      react(),
      useHttps ? basicSsl() : null,
      // gzip y brotli solo en producción (evita ralentizar dev)
      !isDev ? compression({ algorithm: 'gzip', deleteOriginFile: false }) : null,
      !isDev ? compression({ algorithm: 'brotliCompress', ext: '.br', deleteOriginFile: false }) : null,
      // visualizador opcional (habilitar con VITE_ANALYZE=true)
      env.VITE_ANALYZE === 'true' ? visualizer({ filename: 'stats.html', open: false }) : null
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      // Permitir acceso desde la LAN en desarrollo. `true` = escuchar en 0.0.0.0
      host: isDev ? true : '0.0.0.0',
      port: Number(env.VITE_PORT) || 3000,
      https: useHttps ? true : undefined,
      // HMR: permitir configurar el host visible hacia los clientes (por ejemplo la IP local)
      hmr: isDev ? {
        host: env.VITE_HMR_HOST || undefined,
        port: env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : undefined,
        protocol: useHttps ? 'wss' : 'ws'
      } : undefined,
      // Proxy opcional para /api (activar con VITE_USE_PROXY=true)
      proxy: env.VITE_USE_PROXY === 'true' ? {
        '^/api': {
          target: env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        }
      } : undefined,
      // Hosts permitidos para peticiones entrantes (puedes pasar VITE_ALLOWED_HOSTS)
      // Si no se especifica, añadimos algunas entradas útiles y 0.0.0.0
      allowedHosts: env.VITE_ALLOWED_HOSTS ? env.VITE_ALLOWED_HOSTS.split(',').map(s => s.trim()) : [
        '.ngrok-free.dev',
        '.ngrok.io',
        '.ngrok.app',
        'localhost',
        '0.0.0.0'
      ],
      fs: {
        strict: false,
        allow: ['..', '../..']
      },
      watch: {
        // usePolling puede ser costoso; hacerlo configurable (activar con VITE_USE_POLLING=true)
        usePolling: env.VITE_USE_POLLING === 'true'
      }
    },
    optimizeDeps: {
      exclude: []
    }
    ,
    build: {
      // Manual chunking para reducir tamaños de chunk grandes en producción
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id) return null;
            // Separar dependencias de node_modules en chunks por familia
            if (id.includes('node_modules')) {
              // Evitar dividir React en su propio chunk para prevenir ciclos
              // entre chunks (react <-> utils). Mantener familias grandes
              // separadas cuando tenga sentido (MUI, charts, date libs).
              if (id.match(/\bmaterial-ui\b|@mui|@material-ui/)) return 'vendor_mui';
              if (id.match(/chartjs|chart\.js|recharts|echarts/)) return 'vendor_charts';
              if (id.match(/date-fns|moment|luxon/)) return 'vendor_date';
              return 'vendor';
            }

            // Forzar chunk separado para la página/admin (carga bajo demanda)
            if (id.includes('/src/pages/AdminPanel')) return 'admin_panel';

            return null;
          }
        }
      },
      // Opcional: aumentar advertencia de tamaño de chunk si no quieres warnings por ahora
      chunkSizeWarningLimit: 800
    }
  };
});
