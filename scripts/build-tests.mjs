import esbuild from "esbuild";
import fs from "fs";

const specFiles = [
  "Specs/SensorGeometrySpec.js",
  "Specs/SensorOcclusionSpec.js",
];

const external = [
  "cesium",
  "@cesium/core",
  "@cesium/engine",
  "@cesium/gltf",
  "@cesium/widgets",
];

for (const file of specFiles) {
  const out = `Build/tests/${file.replace("Specs/", "").replace(".js", "-bundle.js")}`;
  await esbuild.build({
    entryPoints: [file],
    bundle: true,
    format: "esm",
    external,
    outfile: out,
    logLevel: "error",
  });
  console.log(`Bundled: ${file} -> ${out}`);
}

console.log("Done.");