# GeoStream Core 🛰️

### Real-Time Subsurface Telemetry & Automation Hub for Operations Geology

[![Node.js Engine](https://shields.io)](https://nodejs.org)
[![Relational DB](https://shields.io)](https://postgresql.org)
[![UI Layer](https://shields.io)](#)
[![Deployment](https://shields.io)](#)

---

## 📌 Executive Summary

**GeoStream Core** is a lightweight, high-performance, cloud-native web application designed to bridge the operational gap between real-time wellsite data acquisition and asset team exploration models.

Traditional exploration workflows require an Operations Geologist to manually fetch raw text files (`.las`, `WITSML`), clean them, and port them into resource-heavy desktop suites (like Petrel or Techlog) before determining reservoir markers. This operational delay introduces non-productive time (NPT) risks.

**GeoStream Core automates this entire pipeline.** It replicates an active drilling rig satellite link by streaming real-time downhole telemetry over WebSockets, programmatically resolving core petrophysical and structural depth corrections on-the-fly, and updating a low-latency web operations dashboard for asset steering.

---

## 🛠️ Key Technical Features & Hydrocarbon Logic

- **Automated Structural Depth Conversion (TVDSS)**: Programmatically processes incoming Measured Depth (MD) logs alongside active directional survey profiles to resolve True Vertical Depth Sub-Sea metrics in real time.
- **Dynamic Shale Volume (\(V\_{sh}\)) Estimation**: Built-in petrophysical engine evaluates real-time raw Gamma Ray (GR) strings through discrete non-linear and linear indices to track formation shifts instantly.
- **Pay-Zone Indicator Engine**: Tracks a dual-variate system (Low Gamma Ray paired with elevated Deep Resistivity) to instantly tag net-pay target zones and fire payload alerts upon reservoir entry.
- **Low-Latency Visual Web Tracks**: Houses a fully custom dual-track CSS Grid visualizer mapping logging curves alongside interactive operational terminal tickers for real-time risk assessment.

---

## 📐 Petrophysical Logic Models

The calculation utilities evaluate streaming sensor nodes on every depth interval entry point:

### 1. Shale Volume Index

\[I*{GR} = \frac{GR*{log} - GR*{min}}{GR*{max} - GR\_{min}}\]
_Where entries under 0.45 trigger immediate **SAND (Reservoir)** target flags._

### 2. TVDSS Positional Alignment

\[TVD = MD \times \cos(\theta)\]
\[TVDSS = TVD - \text{Kelly Bushing Elevation}\]

---

## 🗂️ System Directory Matrix

```text
geostream-core/
├── database/
│   └── schema.sql        # PostgreSQL relational data architecture
├── public/
│   ├── css/
│   │   └── style.css     # Dark-themed command room tactical panel styles
│   ├── js/
│   │   └── dashboard.js  # Low-latency WebSocket UI event state handler
│   └── index.html        # Centralized multi-track operations window viewer
├── src/
│   └── utils/
│       └── petrophysics.js # Isolated core petroleum geology calculation layers
├── package.json          # Node dependency configuration manifest
└── server.js             # Central Express server & Socket.io broker engine
```

---

## ⚡ Quick Deployment Guide

### Prerequisites

- [Node.js](https://nodejs.org) (v16.x or higher)
- [PostgreSQL](https://postgresql.org) (Optional for full schema state caching)

### 1. Initialize the Workspace

```bash
git clone https://github.com
cd geostream-core
npm install
```

### 2. Initialize the Subsurface Storage Layer (Optional)

Provision your target PostgreSQL instance with the structural schema layout:

```bash
psql -U postgres -d geostream_db -f database/schema.sql
```

### 3. Ignition Run

Launch the master broker runtime engine:

```bash
node server.js
```

### 4. Open the Interface

Navigate your web browser to the projected cockpit UI:

```text
http://localhost:3000
```

---

## 🎯 Candidate Context & Project Alignment

This repository acts as an engineering sandbox showcase highlighting a unique career cross-section: **10+ years of active field geology and mud logging execution** fused with modern **full-stack software development workflows**.

By managing both the geological science and the data infrastructure pipelines, this project serves to demonstrate complete readiness for a **Junior Operations Geologist**, **Geodata Engineer**, or **Subsurface Asset Automation Developer** assignment.

---

## 👤 Author

Developed by **Imonisa Oghenekevwe Brian**  
📧 [mcbriandavids43@gmail.com](mailto:mcbriandavids43@gmail.com) | 💼 [LinkedIn](https://www.linkedin.com/in/mcbriandavids/)
