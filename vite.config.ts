import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: false,
  vite: {
    preview: {
      allowedHosts: [
        "lol-squad-tracker-production.up.railway.app"
      ],
    },
  },
});
