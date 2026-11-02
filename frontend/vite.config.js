import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Preserve the original artwork in the repository without shipping unused assets.
  publicDir: false,
});
