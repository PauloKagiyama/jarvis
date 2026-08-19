import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite's dev server doesn't run the `api/` functions that the host executes in
 * production, so `npm run dev` would otherwise 404 on every chat request and
 * silently drop the app into demo mode. This mounts the same handler in dev,
 * meaning local development exercises the real proxy rather than a stub.
 */
function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        try {
          const { default: handler } = await server.ssrLoadModule('/api/chat.ts');

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = Buffer.concat(chunks);

          const request = new Request(`http://localhost${req.url ?? '/'}`, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body: body.length > 0 ? body : undefined,
          });

          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch (error) {
          console.error('[api-dev-server] handler failed:', error);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'internal_error' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServer()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        // Three.js and its helpers dominate the bundle and change far less
        // often than app code, so splitting them lets browsers keep them cached
        // across deploys instead of re-downloading ~700kB each time.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/three/') || id.includes('@react-three')) return 'three';
          if (id.includes('framer-motion')) return 'motion';
        },
      },
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
