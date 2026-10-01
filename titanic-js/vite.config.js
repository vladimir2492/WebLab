import { defineConfig } from 'vite';
import { transpileJavaScript } from '@observablehq/notebook-kit';

const codespaceHost = process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  ? `${process.env.CODESPACE_NAME}-5174.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : undefined;

export default defineConfig({
  server: {
    host: process.env.CODESPACES === 'true' ? '0.0.0.0' : '127.0.0.1',
    port: 5174,
    strictPort: true,
    allowedHosts: codespaceHost ? [codespaceHost] : [],
    hmr: codespaceHost ? { host: codespaceHost, protocol: 'wss', clientPort: 443 } : undefined
  },
  build: { outDir: 'dist' },
  plugins: [{
    name: 'notebook-cell-compiler',
    configureServer(server) {
      server.middlewares.use('/api/compile', async (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        if (request.method !== 'POST') { response.statusCode = 405; response.end('{}'); return; }
        try {
          let source = '';
          for await (const chunk of request) {
            source += chunk;
            if (source.length > 200000) throw new Error('Cell is too large.');
          }
          const compiled = transpileJavaScript(JSON.parse(source).code);
          response.end(JSON.stringify(compiled));
        } catch (error) {
          response.statusCode = 400;
          response.end(JSON.stringify({error: error.message}));
        }
      });
    }
  }]
});
