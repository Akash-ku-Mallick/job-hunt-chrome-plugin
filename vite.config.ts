import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

function copyExtensionAssets(env: Record<string, string>) {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Move dist/src/sidepanel/index.html to dist/sidepanel/index.html if needed
      const nestedSidepanel = resolve(outDir, 'src/sidepanel');
      const targetSidepanel = resolve(outDir, 'sidepanel');
      if (fs.existsSync(nestedSidepanel)) {
        if (!fs.existsSync(targetSidepanel)) {
          fs.mkdirSync(targetSidepanel, { recursive: true });
        }
        for (const file of fs.readdirSync(nestedSidepanel)) {
          fs.copyFileSync(
            resolve(nestedSidepanel, file),
            resolve(targetSidepanel, file)
          );
        }
        // Remove nested src folder in dist
        fs.rmSync(resolve(outDir, 'src'), { recursive: true, force: true });
      }

      // Copy & template manifest.json
      if (fs.existsSync(resolve(__dirname, 'manifest.json'))) {
        let manifestContent = fs.readFileSync(
          resolve(__dirname, 'manifest.json'),
          'utf-8'
        );

        if (
          env.VITE_GOOGLE_CLIENT_ID &&
          env.VITE_GOOGLE_CLIENT_ID !== 'your_client_id.apps.googleusercontent.com'
        ) {
          manifestContent = manifestContent.replace(
            'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
            env.VITE_GOOGLE_CLIENT_ID
          );
        }

        fs.writeFileSync(resolve(outDir, 'manifest.json'), manifestContent);
      }

      // Copy icons directory
      const iconsDir = resolve(__dirname, 'icons');
      const outIconsDir = resolve(outDir, 'icons');
      if (fs.existsSync(iconsDir)) {
        if (!fs.existsSync(outIconsDir)) {
          fs.mkdirSync(outIconsDir, { recursive: true });
        }
        for (const file of fs.readdirSync(iconsDir)) {
          fs.copyFileSync(resolve(iconsDir, file), resolve(outIconsDir, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
          'background/service-worker': resolve(
            __dirname,
            'src/background/service-worker.ts'
          ),
          'content/content': resolve(__dirname, 'src/content/content.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'background/service-worker') {
              return 'background/service-worker.js';
            }
            if (chunkInfo.name === 'content/content') {
              return 'content/content.js';
            }
            return 'assets/[name]-[hash].js';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    plugins: [copyExtensionAssets(env)],
  };
});
