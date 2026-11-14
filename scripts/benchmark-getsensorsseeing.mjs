import { Cartesian3, Ellipsoid, Matrix3, Matrix4 } from "cesium";
import { computeSensorViews } from "../src/queries/SensorView.js";

const inverseRadii = Ellipsoid.WGS84.oneOverRadii;
const target = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0 + 100000.0);

function makeMockSensor(id, maximumRadius, outerHalfAngle) {
  const origin = Cartesian3.fromDegrees(-75.0, 40.0, 1200000.0);
  const axis = Cartesian3.normalize(
    Cartesian3.subtract(target, origin, new Cartesian3()),
    new Cartesian3()
  );
  const upRef =
    Math.abs(Cartesian3.dot(axis, Cartesian3.UNIT_Z)) > 0.9
      ? Cartesian3.UNIT_X
      : Cartesian3.UNIT_Z;
  const right = Cartesian3.normalize(
    Cartesian3.cross(upRef, axis, new Cartesian3()),
    new Cartesian3()
  );
  const trueUp = Cartesian3.cross(axis, right, new Cartesian3());
  const rot = Matrix4.fromRotationTranslation(
    new Matrix3(
      right.x, trueUp.x, axis.x,
      right.y, trueUp.y, axis.y,
      right.z, trueUp.z, axis.z
    ),
    origin,
    new Matrix4()
  );
  return {
    modelMatrix: rot,
    maximumRadius,
    outerHalfAngle,
    occlusionMode: "NONE",
    show: true,
    id,
  };
}

function bench(sensorCount, iterations = 10) {
  const sensors = [];
  for (let i = 0; i < sensorCount; i += 1) {
    sensors.push(
      makeMockSensor(
        `sensor-${i}`,
        900000.0,
        0.32 + (i % 10) * 0.01
      )
    );
  }

  // Warmup
  computeSensorViews(sensors, target, { includeOccludedVolume: false, inverseRadii });

  const times = [];
  for (let i = 0; i < iterations; i += 1) {
    const start = process.hrtime.bigint();
    computeSensorViews(sensors, target, { includeOccludedVolume: false, inverseRadii });
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1_000_000); // ms
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return { sensorCount, iterations, avgMs: avg.toFixed(3), minMs: min.toFixed(3), maxMs: max.toFixed(3) };
}

console.log("Benchmark getSensorsSeeing (computeSensorViews)\n");
console.log("Sensors | Iterations | Avg (ms) | Min (ms) | Max (ms)");
console.log("--------|------------|----------|----------|----------");

for (const count of [1, 100, 400, 500]) {
  const result = bench(count);
  console.log(
    `${result.sensorCount.toString().padStart(7)} | ${result.iterations.toString().padStart(10)} | ${result.avgMs.padStart(8)} | ${result.minMs.padStart(8)} | ${result.maxMs.padStart(8)}`
  );
}
