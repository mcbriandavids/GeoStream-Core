const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { calculateVshale, calculateTvdss } = require('./src/utils/petrophysics');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const STREAM_INTERVAL_MS = 2500;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const MOCK_LOGS = [
  { md: 6200, gr: 95, res: 2.1 },
  { md: 6205, gr: 102, res: 1.8 },
  { md: 6210, gr: 88, res: 2.5 },
  { md: 6215, gr: 42, res: 18.4 },
  { md: 6220, gr: 35, res: 34.2 },
  { md: 6225, gr: 115, res: 1.1 },
];

const createTelemetryStream = (socket) => {
  let index = 0;
  let timerId = null;

  const streamNext = () => {
    if (index >= MOCK_LOGS.length) {
      socket.emit('stream_complete');
      return;
    }

    try {
      const { md, gr, res } = MOCK_LOGS[index];
      const v_shale = calculateVshale(gr);
      const tvdss = calculateTvdss(md);
      const lithology_flag = v_shale < 0.45 ? 'SAND' : 'SHALE';

      socket.emit('telemetry_packet', {
        measured_depth: md,
        tvdss,
        gamma_ray: gr,
        resistivity: res,
        v_shale,
        lithology_flag,
      });

      index++;
      timerId = setTimeout(streamNext, STREAM_INTERVAL_MS);
    } catch (error) {
      console.error('[GeoStream Hub] Telemetry processing error:', error);
      socket.emit('stream_error', { message: error.message });
      timerId = setTimeout(streamNext, STREAM_INTERVAL_MS);
    }
  };

  timerId = setTimeout(streamNext, STREAM_INTERVAL_MS);

  return () => clearTimeout(timerId);
};

io.on('connection', (socket) => {
  console.log(`[GeoStream Hub] Client connected: ${socket.id}`);

  const cleanup = createTelemetryStream(socket);

  socket.on('disconnect', (reason) => {
    console.log(`[GeoStream Hub] Client disconnected: ${socket.id} (${reason})`);
    cleanup();
  });

  socket.on('error', (error) => {
    console.error(`[GeoStream Hub] Socket error [${socket.id}]:`, error);
  });
});

const gracefulShutdown = () => {
  console.log('\n[GeoStream Hub] Graceful shutdown initiated...');
  server.close(() => {
    console.log('[GeoStream Hub] Server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

server.listen(PORT, () => {
  console.log(`
====================================================
🚀 GEOSTREAM CORE ACTIVATED ON PORT: ${PORT}
🔗 OPEN AND VIEW INTERFACE AT: http://localhost:${PORT}
====================================================
`);
});
