import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  server: {
    port: 5173,
    configureServer: (server) => {
      // Servir les assets statiques de Cesium (Natural Earth II, shaders, etc.)
      server.middlewares.use("/Assets/", (req, res, next) => {
        const urlPath = req.url.replace(/^\/Assets\//, "");
        const filePath = path.join(
          "node_modules/cesium/Build/Cesium/Assets",
          urlPath
        );
        if (fs.existsSync(filePath)) {
          res.sendFile(filePath);
        } else {
          res.status(404).end();
        }
      });
    },
  },
});
