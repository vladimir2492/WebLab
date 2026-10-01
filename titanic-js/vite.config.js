import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const codespaceHost = process.env.CODESPACE_NAME && process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN
  ? `${process.env.CODESPACE_NAME}-5174.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`
  : undefined;

// Lesson cells import these files by name while the page runs, so the build keeps their names.
const lessonModules = ['ml', 'stump-demo', 'exit-quiz', 'cart-library'];
let lessonSite = true;

export default defineConfig({
  // Relative paths let the built lesson run from any folder, such as GitHub Pages.
  base: './',
  server: {
    host: process.env.CODESPACES === 'true' ? '0.0.0.0' : '127.0.0.1',
    port: 5174,
    strictPort: true,
    allowedHosts: codespaceHost ? [codespaceHost] : [],
    hmr: codespaceHost ? { host: codespaceHost, protocol: 'wss', clientPort: 443 } : undefined
  },
  preview: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { outDir: 'dist' },
  plugins: [{
    name: 'lesson-static-site',
    config(config) {
      // The separate Observable notebook export (npm run build:notebook) supplies its own pages.
      lessonSite = !config.build?.rollupOptions?.input;
      if (!lessonSite) return;
      return { build: { rollupOptions: {
        // Keep the exports of the lesson modules: cells import them by name.
        preserveEntrySignatures: 'exports-only',
        input: { index: 'index.html', ...Object.fromEntries(lessonModules.map(name => [name, `${name}.js`])) },
        output: { entryFileNames: chunk => lessonModules.includes(chunk.name) ? '[name].js' : 'assets/[name]-[hash].js' }
      } } };
    },
    generateBundle() {
      if (!lessonSite) return;
      this.emitFile({ type: 'asset', fileName: 'assets/titanic.csv', source: readFileSync(new URL('./assets/titanic.csv', import.meta.url)) });
    }
  }]
});
