const { src, dest, series } = require("gulp");
const esbuild = require("esbuild");

function build() {
  return esbuild
    .build({
      entryPoints: ["src/core/SensorSystem.js"],
      bundle: true,
      outfile: "dist/open-sensor.js",
      format: "esm",
      platform: "browser",
      external: ["cesium"],
      sourcemap: true,
      minify: false,
    })
    .then(() => {
      console.log("Built dist/open-sensor.js successfully.");
    });
}

exports.default = series(build);
exports.build = series(build);
