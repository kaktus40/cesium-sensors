import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "Specs", "fixtures", "benchmark-500.czml");
const epoch = "2026-01-01T00:00:00Z";
const satellites = [];

for (let i = 0; i < 500; i += 1) {
  const longitude = -180 + (i % 50) * 7.2;
  const latitude = -60 + Math.floor(i / 50) * 13.333333;
  const altitude = 700000 + (i % 5) * 25000;
  const id = `satellite-${String(i + 1).padStart(3, "0")}`;
  const sensorId = "radar-front";

  satellites.push({
    id,
    availability: `${epoch}/2026-01-01T01:00:00Z`,
    position: {
      epoch,
      cartographicDegrees: [
        0,
        longitude,
        latitude,
        altitude,
        30,
        longitude + 0.05,
        latitude,
        altitude,
      ],
    },
    orientation: {
      epoch,
      unitQuaternion: [0, 0, 0, 0, 1, 30, 0, 0, 0, 1],
    },
    openSensor_sensors: [
      {
        id: sensorId,
        type: "conic",
        innerHalfAngle: 0.0,
        outerHalfAngle: 0.35,
        minimumRadius: 0.0,
        maximumRadius: 1000000.0,
        occlusionMode: "SCENE",
        occlusionQuality: "AUTO",
        occlusionPriority: 1,
        show: true,
        color: { rgba: [255, 255, 255, 128] },
        showOccludedVolume: false,
      },
    ],
  });
}

const document = [
  {
    id: "document",
    version: "1.0",
    clock: {
      interval: `${epoch}/2026-01-01T01:00:00Z`,
      currentTime: epoch,
      range: "LOOP_STOP",
      step: "SYSTEM_CLOCK_MULTIPLIER",
    },
  },
  ...satellites,
];

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`Generated ${output} with ${satellites.length} satellites.`);
