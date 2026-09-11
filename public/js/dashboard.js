const socket = io();

// Timeline historical data cache array
const historicalLogs = [];

// Canvas viewport layout handles
const canvas = document.getElementById("subsurface-wiggle-canvas");

// Global utility display helper function anchored at the top
function updateNumericDisplay(id, val) {
  const node = document.getElementById(id);
  if (node) {
    node.innerText = val;
  }
}

// Global interactive viewport state tracking
let scrollOffsetY = 0; // Viewport pan position tracker
let isDraggingViewport = false; // Mouse down dragging tracker
let dragStartStartY = 0;
let mouseCurrentY = -100; // Live crosshair tracking coordinates
let mouseCurrentX = -100;
let activeThemeStyle = "dark"; // Toggle state: "dark" or "light"

// Injected dynamic background switch button listener to enable user choice
const toggleBtn = document.getElementById("theme-toggle-btn");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    activeThemeStyle = activeThemeStyle === "dark" ? "light" : "dark";
    toggleBtn.innerText =
      activeThemeStyle === "dark"
        ? "☀️ Swap to Light Theme"
        : "🌙 Swap to Dark Theme";
    renderPetrelTrackSuite();
  });
}

socket.on("telemetry_packet", (data) => {
  // 1. Refresh digital numeric display cards
  updateNumericDisplay("md-val", data.measured_depth);
  updateNumericDisplay(
    "tvdss-val",
    data.tvdss ? data.tvdss.toFixed(2) : "--.--",
  );
  updateNumericDisplay("gr-val", data.gamma_ray);
  updateNumericDisplay(
    "res-val",
    data.resistivity ? data.resistivity.toFixed(2) : "--.--",
  );

  const nphiVal =
    data.neutron_porosity !== undefined ? data.neutron_porosity : data.nphi;
  const rhobVal =
    data.bulk_density !== undefined ? data.bulk_density : data.rhob;
  const dtVal = data.delta_time !== undefined ? data.delta_time : data.dt;

  updateNumericDisplay("nphi-val", nphiVal ? nphiVal.toFixed(3) : "--.--");
  updateNumericDisplay("rhob-val", rhobVal ? rhobVal.toFixed(3) : "--.--");
  updateNumericDisplay("dt-val", dtVal ? dtVal.toFixed(1) : "--.--");

  if (document.getElementById("val-lith")) {
    document.getElementById("val-lith").innerText = data.is_pay_zone
      ? "PAY-SAND"
      : data.lithology_flag;
  }

  // 2. Cache logs and sort systematically from shallow to deep (Increments moving DOWNWARDS)
  historicalLogs.push(data);
  historicalLogs.sort((a, b) => a.measured_depth - b.measured_depth);

  if (historicalLogs.length > 1000) historicalLogs.shift();

  // 3. Trigger Petrel-style raster refresh loop
  renderPetrelTrackSuite();
});

/**
 * Cubic Spline Interpolation Vector Path Generator
 */
function drawSmoothSplineCurve(ctx, points, color, lineWidth) {
  if (!points || points.length < 2) return;

  ctx.beginPath();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? i + 1 : i + 2];

    for (let t = 0; t <= 6; t++) {
      const mu = t / 6;
      const mu2 = mu * mu;
      const mu3 = mu2 * mu;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * mu +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * mu2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * mu3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * mu +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * mu2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * mu3);

      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}
/**
 * Main Petrel 2018 Render Loop
 */
function renderPetrelTrackSuite() {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);
  if (historicalLogs.length === 0) return;

  // Toggle color scheme maps based on button clicks
  const isDark = activeThemeStyle === "dark";
  const laneBackgroundColor = isDark ? "#0c111d" : "#ffffff";
  const borderFrameColor = isDark ? "#2e3a52" : "#94a3b8";
  const internalGridlineColor = isDark
    ? "rgba(46, 58, 82, 0.25)"
    : "rgba(148, 163, 184, 0.3)";
  const horizontalGridlineColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.06)";
  const depthTypographyColor = isDark ? "#ffffff" : "#0f172a";

  const depthColumnWidth = 90;
  const workingWidth = width - depthColumnWidth;
  const trackCount = 4;
  const trackGapSpace = 25;
  const totalWidthPerTrack = workingWidth / trackCount;
  const absoluteTrackWidth = totalWidthPerTrack - trackGapSpace;

  // Absolute track frame layouts mapped across the master dashboard view space
  const trackLayouts = [
    {
      xStart: depthColumnWidth + totalWidthPerTrack * 0 + trackGapSpace / 2,
      width: absoluteTrackWidth,
      name: "GR",
      color: "#3b5998",
    },
    {
      xStart: depthColumnWidth + totalWidthPerTrack * 1 + trackGapSpace / 2,
      width: absoluteTrackWidth,
      name: "RES",
      color: "#f0ad4e",
    },
    {
      xStart: depthColumnWidth + totalWidthPerTrack * 2 + trackGapSpace / 2,
      width: absoluteTrackWidth,
      name: "XOVER",
      color: "#10b981",
    },
    {
      xStart: depthColumnWidth + totalWidthPerTrack * 3 + trackGapSpace / 2,
      width: absoluteTrackWidth,
      name: "DT",
      color: "#ef4444",
    },
  ];

  // Draw Background Envelopes & Sub-divisions
  trackLayouts.forEach((t) => {
    ctx.fillStyle = laneBackgroundColor;
    ctx.fillRect(t.xStart, 0, t.width, height);
    ctx.strokeStyle = borderFrameColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(t.xStart, 0, t.width, height);

    ctx.strokeStyle = internalGridlineColor;
    ctx.lineWidth = 0.5;
    for (let div = 1; div < 4; div++) {
      ctx.beginPath();
      ctx.moveTo(t.xStart + t.width * (div / 4), 0);
      ctx.lineTo(t.xStart + t.width * (div / 4), height);
      ctx.stroke();
    }
  });

  const verticalIntervalPixelDistance = 35;
  const baseOffsetAnchorY = 50 + scrollOffsetY;

  // FIXED CROSSOVER SHADING (TRACK 3 ONLY)
  for (let i = 0; i < historicalLogs.length; i++) {
    const log = historicalLogs[i];
    const currentY = baseOffsetAnchorY + i * verticalIntervalPixelDistance;

    if (currentY < -40 || currentY > height + 40) continue;

    const nphi =
      log.neutron_porosity !== undefined ? log.neutron_porosity : log.nphi;
    const rhob = log.bulk_density !== undefined ? log.bulk_density : log.rhob;

    if (nphi !== undefined && rhob !== undefined) {
      const nphiPct = (0.45 - nphi) / 0.6;
      const rhobPct = (rhob - 1.95) / 1.0;

      const nphiX =
        trackLayouts[2].xStart +
        Math.max(0, Math.min(1, nphiPct)) * trackLayouts[2].width;
      const rhobX =
        trackLayouts[2].xStart +
        Math.max(0, Math.min(1, rhobPct)) * trackLayouts[2].width;

      if (nphiX < rhobX) {
        ctx.fillStyle = log.is_pay_zone
          ? "rgba(16, 185, 129, 0.35)"
          : "rgba(245, 196, 83, 0.2)";
        ctx.fillRect(
          nphiX,
          currentY - verticalIntervalPixelDistance / 2,
          rhobX - nphiX,
          verticalIntervalPixelDistance,
        );
      }
    }
  }

  // ==========================================
  // FIXED SEPARATED SPLINE WIGGLE TRACES (FIXED STRIPPED MAPPING SWAPS)
  // ==========================================
  const curveTracesCache = { GR: [], RES: [], NPHI: [], RHOB: [], DT: [] };

  for (let i = 0; i < historicalLogs.length; i++) {
    const log = historicalLogs[i];
    const currentY = baseOffsetAnchorY + i * verticalIntervalPixelDistance;

    // Track 1 mapping
    const grPct = log.gamma_ray / 150;
    curveTracesCache.GR.push({
      x:
        trackLayouts[0].xStart +
        Math.max(0, Math.min(1, grPct)) * trackLayouts[0].width,
      y: currentY,
    });

    // Track 2 mapping
    const resLog = log.resistivity > 0.1 ? Math.log10(log.resistivity) : -1;
    const resPct = (resLog + 1) / 4;
    curveTracesCache.RES.push({
      x:
        trackLayouts[1].xStart +
        Math.max(0, Math.min(1, resPct)) * trackLayouts[1].width,
      y: currentY,
    });

    const nphiVal =
      log.neutron_porosity !== undefined ? log.neutron_porosity : log.nphi;
    const rhobVal =
      log.bulk_density !== undefined ? log.bulk_density : log.rhob;
    const dtVal = log.delta_time !== undefined ? log.delta_time : log.dt;

    // Track 3 mapping - FIXED: NPHI and RHOB Overlay safely inside Track Layout index 2 container bounds
    if (nphiVal !== undefined) {
      const nphiPct = (0.45 - nphiVal) / 0.6;
      curveTracesCache.NPHI.push({
        x:
          trackLayouts[2].xStart +
          Math.max(0, Math.min(1, nphiPct)) * trackLayouts[2].width,
        y: currentY,
      });
    }
    if (rhobVal !== undefined) {
      const rhobPct = (rhobVal - 1.95) / 1.0;
      curveTracesCache.RHOB.push({
        x:
          trackLayouts[2].xStart +
          Math.max(0, Math.min(1, rhobPct)) * trackLayouts[2].width,
        y: currentY,
      });
    }

    // TRACK 4 FIXED: DT acoustic values draw explicitly inside Track Layout index 3 boundaries
    if (dtVal !== undefined) {
      const dtPct = (dtVal - 40) / 100;
      curveTracesCache.DT.push({
        x:
          trackLayouts[3].xStart +
          Math.max(0, Math.min(1, dtPct)) * trackLayouts[3].width,
        y: currentY,
      });
    }
  }

  // Draw smooth spline curves onto the display tracks
  drawSmoothSplineCurve(ctx, curveTracesCache.GR, trackLayouts[0].color, 2);
  drawSmoothSplineCurve(ctx, curveTracesCache.RES, trackLayouts[1].color, 1.5);
  drawSmoothSplineCurve(ctx, curveTracesCache.NPHI, "#a78bfa", 1.5);
  drawSmoothSplineCurve(
    ctx,
    curveTracesCache.RHOB,
    isDark ? "#cbd5e1" : "#475569",
    1.5,
  );
  drawSmoothSplineCurve(ctx, curveTracesCache.DT, trackLayouts[3].color, 1.5); // FIXED Sonic curves render perfectly now

  // ACCURATE ENGINEERING HORIZONTAL RULES & STAMPS
  for (let i = 0; i < historicalLogs.length; i++) {
    const log = historicalLogs[i];
    const currentY = baseOffsetAnchorY + i * verticalIntervalPixelDistance;

    if (currentY < -40 || currentY > height + 40) continue;

    ctx.strokeStyle = horizontalGridlineColor;
    ctx.lineWidth = 0.5;
    trackLayouts.forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(t.xStart, currentY);
      ctx.lineTo(t.xStart + t.width, currentY);
      ctx.stroke();
    });

    ctx.fillStyle = depthTypographyColor;
    ctx.font = "bold 12px 'Courier New', monospace";
    ctx.fillText(`${log.measured_depth.toFixed(0)} m`, 15, currentY + 4);
  }

  // ==========================================
  // FIXED CONTEXT-AWARE TRACK TOOLTIP MATRIX
  // ==========================================
  if (
    mouseCurrentY >= 0 &&
    mouseCurrentY <= height &&
    mouseCurrentX >= depthColumnWidth
  ) {
    ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(depthColumnWidth, mouseCurrentY);
    ctx.lineTo(width, mouseCurrentY);
    ctx.stroke();

    const projectedIndex = Math.round(
      (mouseCurrentY - baseOffsetAnchorY) / verticalIntervalPixelDistance,
    );

    if (projectedIndex >= 0 && projectedIndex < historicalLogs.length) {
      const matchLog = historicalLogs[projectedIndex];
      let activeHoveredTrackName = "NONE";

      trackLayouts.forEach((t) => {
        if (mouseCurrentX >= t.xStart && mouseCurrentX <= t.xStart + t.width) {
          activeHoveredTrackName = t.name;
        }
      });

      // FIXED TOOLTIP: Loops match specific lane parameters to strip out data noise
      if (activeHoveredTrackName !== "NONE") {
        const tipW = 160;
        let tipH = 45;
        let tipX = mouseCurrentX + 15;
        let tipY = mouseCurrentY + 15;

        if (tipX + tipW > width) tipX = mouseCurrentX - tipW - 15;
        if (tipY + tipH > height) tipY = mouseCurrentY - tipH - 15;

        ctx.fillStyle = isDark
          ? "rgba(11, 15, 25, 0.95)"
          : "rgba(255, 255, 255, 0.98)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.fillRect(tipX, tipY, tipW, tipH);
        ctx.strokeRect(tipX, tipY, tipW, tipH);

        ctx.fillStyle = isDark ? "#ffffff" : "#0f172a";
        ctx.font = "bold 11px 'Courier New', monospace";
        ctx.fillText(
          `DEPTH: ${matchLog.measured_depth.toFixed(1)} m`,
          tipX + 10,
          tipY + 18,
        );

        ctx.fillStyle = isDark ? "#9ca3af" : "#475569";
        ctx.font = "11px 'Courier New', monospace";

        if (activeHoveredTrackName === "GR") {
          ctx.fillText(
            `GR: ${matchLog.gamma_ray.toFixed(1)} API`,
            tipX + 10,
            tipY + 34,
          );
        } else if (activeHoveredTrackName === "RES") {
          ctx.fillText(
            `RES: ${matchLog.resistivity.toFixed(2)} ohm-m`,
            tipX + 10,
            tipY + 34,
          );
        } else if (activeHoveredTrackName === "XOVER") {
          const nVal =
            matchLog.neutron_porosity !== undefined
              ? matchLog.neutron_porosity
              : matchLog.nphi;
          const rVal =
            matchLog.bulk_density !== undefined
              ? matchLog.bulk_density
              : matchLog.rhob;
          ctx.fillText(
            `NPHI: ${nVal ? nVal.toFixed(3) : "N/A"} v/v`,
            tipX + 10,
            tipY + 34,
          );
          // Expand container height dynamically for the double value labels
          ctx.fillText(
            `RHOB: ${rVal ? rVal.toFixed(2) : "N/A"} g/cc`,
            tipX + 10,
            tipY + 48,
          );
        } else if (activeHoveredTrackName === "DT") {
          const dVal =
            matchLog.delta_time !== undefined
              ? matchLog.delta_time
              : matchLog.dt;
          ctx.fillText(
            `DT: ${dVal ? dVal.toFixed(1) : "N/A"} us/ft`,
            tipX + 10,
            tipY + 34,
          );
        }
      }
    }
  }
}

// Mouse Event Listeners for Scrolling and Crosshairs
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseCurrentX = e.clientX - rect.left;
  mouseCurrentY = e.clientY - rect.top;

  if (isDraggingViewport) {
    const deltaY = mouseCurrentY - dragStartStartY;
    scrollOffsetY += deltaY;
    dragStartStartY = mouseCurrentY;
  }
  renderPetrelTrackSuite();
});

// Clear Tooltips when cursor drifts out of canvas area
canvas.addEventListener("mouseleave", () => {
  mouseCurrentY = -100;
  mouseCurrentX = -100;
  isDraggingViewport = false;
  renderPetrelTrackSuite();
});

// Enable Drag-to-Scroll Mechanics
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  dragStartStartY = e.clientY - rect.top;
  isDraggingViewport = true;
  canvas.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  if (isDraggingViewport) {
    isDraggingViewport = false;
    if (canvas) canvas.style.cursor = "crosshair";
  }
});

// Enable Standard Trackpad/Mouse Wheel Scrolling
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    scrollOffsetY -= e.deltaY * 0.7;
    renderPetrelTrackSuite();
  },
  { passive: false },
);

window.addEventListener("resize", renderPetrelTrackSuite);
