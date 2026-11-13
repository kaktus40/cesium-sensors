import process from "node:process";

const minimumMajor = 22;
const major = Number.parseInt(process.versions.node.split(".")[0], 10);

if (major < minimumMajor) {
  console.error(
    `Node.js ${minimumMajor}+ is required; detected ${process.versions.node}.`,
  );
  process.exitCode = 1;
}

console.log(`Node.js ${process.versions.node} is compatible with the target toolchain.`);
