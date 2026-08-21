const socket = io();
const logCanvas = document.getElementById("log-canvas");
const tickerBox = document.getElementById("ticker-box");

socket.on("telemetry_packet", (data) => {
  document.getElementById("card-md").querySelector(".value").innerText =
    data.measured_depth;
  document.getElementById("card-tvdss").querySelector(".value").innerText =
    data.tvdss;
  document.getElementById("card-gr").querySelector(".value").innerText =
    data.gamma_ray;

  const lithCard = document.getElementById("card-lith");
  lithCard.querySelector(".value").innerText = data.lithology_flag;
  lithCard.className =
    "kpi-card " +
    (data.lithology_flag === "SAND" ? "active-sand" : "active-shale");

  const row = document.createElement("div");
  row.className = "log-row";
  const grPercent = Math.min(100, (data.gamma_ray / 150) * 100);
  const resPercent = Math.min(100, (data.resistivity / 50) * 100);

  row.innerHTML = `
        <div><strong>${data.measured_depth} ft</strong></div>
        <div class="bar-track"><div class="bar-fill shale-fill" style="width: ${grPercent}%"></div></div>
        <div class="bar-track"><div class="bar-fill sand-fill" style="width: ${resPercent}%"></div></div>
        <div style="text-align: right; font-weight: bold; color: ${data.lithology_flag === "SAND" ? "#F5C453" : "#4A607A"}">${data.lithology_flag}</div>
    `;
  logCanvas.appendChild(row);

  const tickerLine = document.createElement("div");
  tickerLine.className = "ticker-line";
  if (data.lithology_flag === "SAND") {
    tickerLine.innerHTML = `🚨 [RESERVOIR ENCOUNTERED] Bit entered pay unit boundary at ${data.measured_depth}ft. Vshale: ${data.v_shale}.`;
    tickerLine.style.color = "#F5C453";
  } else {
    tickerLine.innerHTML = `> Scanning: Lithological shale formation signature tracked at ${data.measured_depth}ft.`;
  }
  tickerBox.appendChild(tickerLine);
  tickerBox.scrollTop = tickerBox.scrollHeight;
});
