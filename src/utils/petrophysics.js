/**
 * =========================================================================
 * GEOSTREAM CORE - CORE SUBSURFACE PETROPHYSICAL ENGINE
 * =========================================================================
 * Processes high-frequency raw downhole telemetry strings into corrected
 * structural and reservoir matrix markers in real time.
 */

/**
 * Calculates the Gamma Ray Shale Volume Index (Vshale)
 * Uses a normalized linear projection model bounded strictly between 0 and 1.
 *
 * @param {number} grLog - Current real-time Gamma Ray sensor reading from tool string (API)
 * @param {number} [grMin=30.0] - Regional baseline reading for clean sand formations
 * @param {number} [grMax=150.0] - Regional baseline reading for pure organic shales
 * @returns {number} Fractional Volume of Shale (v/v) bounded between 0.000 and 1.000
 */
function calculateVshale(grLog, grMin = 30.0, grMax = 150.0) {
  // Edge-case fallback: Validate input integrity to prevent runtime arithmetic crashes
  if (grLog === undefined || grLog === null || isNaN(grLog)) {
    return 1.0; // Default to tight shale barrier baseline for operational safety
  }

  // Prevent division-by-zero anomalies if baseline parameters match or are misconfigured
  if (grMax <= grMin) {
    return 0.0;
  }

  // Process standard normalized Gamma Ray Index (I_GR)
  let vShaleRaw = (grLog - grMin) / (grMax - grMin);

  // Apply strict physical boundary constraints: Vshale can mathematically never drop below 0% or exceed 100%
  const vShaleBounded = Math.max(0, Math.min(1, vShaleRaw));

  // Return formatted to standard 3-decimal petrophysical precision
  return parseFloat(vShaleBounded.toFixed(3));
}

/**
 * Resolves True Vertical Depth Sub-Sea (TVDSS) metrics from physical depth track frames
 * Structural formula: TVDSS = TVD - Kelly Bushing (KB) Elevation
 *
 * Note: For vertical to low-inclination exploratory exploration tracks, TVD mirrors Measured Depth.
 * Values drifting below mean sea level resolve correctly as negative coordinate values.
 *
 * @param {number} measuredDepth - Raw measured depth tracking value along the wellbore axis
 * @param {number} [kbElevation=45.50] - Structural datum height offset from your database schema (m)
 * @param {number} [inclinationDeg=0.0] - Wellbore trajectory inclination drift angle in degrees
 * @returns {number} Corrected True Vertical Depth Sub-Sea coordinate relative to ocean level datum
 */
function calculateTvdss(
  measuredDepth,
  kbElevation = 45.5,
  inclinationDeg = 0.0,
) {
  // Edge-case fallback: Validate baseline input exists
  if (
    measuredDepth === undefined ||
    measuredDepth === null ||
    isNaN(measuredDepth)
  ) {
    return 0.0;
  }

  // Convert inclination drift from standard spatial degrees to mathematical radians for the JS Math runtime
  const inclinationRad = (inclinationDeg * Math.PI) / 180;

  // Compute True Vertical Depth (TVD) incorporating wellbore drift adjustments
  const tvd = measuredDepth * Math.cos(inclinationRad);

  // Compute True Vertical Depth Sub-Sea (TVDSS) metric
  const tvdss = tvd - kbElevation;

  // Return formatted to standard engineering depth track resolution (2-decimal precision)
  return parseFloat(tvdss.toFixed(2));
}

module.exports = {
  calculateVshale,
  calculateTvdss,
};
