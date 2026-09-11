const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const db = require("./src/database"); // Injected high-performance pool layer
const { calculateVshale, calculateTvdss } = require("./src/utils/petrophysics");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

// Define our constant active well asset identifier matching your schema seed insert row
// Change this line in server.js to use an M instead of an M
const WELL_NAME_TARGET = "OMU-04_ST1";

const mockLogs = [
  { md: 6200, gr: 95, res: 2.1, nphi: 0.38, rhob: 2.62, dt: 122.5 },
  { md: 6205, gr: 102, res: 1.8, nphi: 0.41, rhob: 2.68, dt: 135.0 },
  { md: 6210, gr: 88, res: 2.5, nphi: 0.35, rhob: 2.58, dt: 112.2 },
  { md: 6215, gr: 42, res: 18.4, nphi: 0.22, rhob: 2.31, dt: 82.4 }, // Pay Zone Candidate
  { md: 6220, gr: 35, res: 34.2, nphi: 0.195, rhob: 2.24, dt: 76.8 }, // Pay Zone Candidate
  { md: 6225, gr: 115, res: 1.1, nphi: 0.44, rhob: 2.71, dt: 142.1 },
];

io.on("connection", (socket) => {
  console.log("🖥️ [GeoStream Hub] Operational interface viewport linked.");
  let index = 0;

  const streamLoop = setInterval(async () => {
    if (index >= mockLogs.length) {
      index = 0; // Keep telemetry looping continuously for terminal development testing
    }

    const rawPoint = mockLogs[index];
    const v_shale = calculateVshale(rawPoint.gr);
    const tvdss = calculateTvdss(rawPoint.md);

    const lithology_flag = v_shale < 0.45 ? "SAND" : "SHALE";
    const is_pay_zone = v_shale < 0.45 && rawPoint.res >= 12.0;

    const telemetryPayload = {
      measured_depth: rawPoint.md,
      tvdss: tvdss,
      gamma_ray: rawPoint.gr,
      resistivity: rawPoint.res,
      v_shale: v_shale,
      lithology_flag: lithology_flag,
      neutron_porosity: rawPoint.nphi,
      bulk_density: rawPoint.rhob,
      delta_time: rawPoint.dt,
      is_pay_zone: is_pay_zone,
    };

    // 1. Broadcast the processed log packet to connected frontend dashboard listeners
    socket.emit("telemetry_packet", telemetryPayload);

    // 2. Asynchronously offload database storage transaction using the non-blocking pool
    const queryText = `
      INSERT INTO well_logs 
      (well_id, measured_depth, tvdss, gamma_ray, resistivity, v_shale, lithology_flag, neutron_porosity, bulk_density, delta_time, is_pay_zone)
      VALUES (
        (SELECT id FROM wells WHERE well_name = $1 LIMIT 1),
        $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      );
    `;

    const queryValues = [
      WELL_NAME_TARGET, // $1 -> Sub-query translates this string to internal numeric well_id
      telemetryPayload.measured_depth, // $2
      telemetryPayload.tvdss, // $3
      telemetryPayload.gamma_ray, // $4
      telemetryPayload.resistivity, // $5
      telemetryPayload.v_shale, // $6
      telemetryPayload.lithology_flag, // $7
      telemetryPayload.neutron_porosity, // $8
      telemetryPayload.bulk_density, // $9
      telemetryPayload.delta_time, // $10
      telemetryPayload.is_pay_zone, // $11
    ];

    db.query(queryText, queryValues).catch((err) =>
      console.error(
        `❌ Non-blocking database write failed for asset [${WELL_NAME_TARGET}]:`,
        err.message,
      ),
    );

    index++;
  }, 2500);

  socket.on("disconnect", () => {
    console.log("🔌 [GeoStream Hub] Operational interface viewport detached.");
    clearInterval(streamLoop);
  });
});

server.listen(PORT, () => {
  console.log(`\n====================================================`);
  console.log(`🚀 GEOSTREAM CORE ACTIVATED ON PORT: ${PORT}`);
  console.log(`🔗 OPEN AND VIEW INTERFACE AT: http://localhost:${PORT}`);
  console.log(`====================================================\n`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutdown signal received, closing database connections...");
  db.pool
    .end()
    .then(() => {
      console.log("👋 All connections closed, exiting.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Error closing database connections:", err.message);
      process.exit(1);
    });
});
