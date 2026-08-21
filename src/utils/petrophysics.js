/* cspell:disable */

function calculateVshale(grValue, grMin = 20, grMax = 120) {
  if (grValue == null) return 0;
  if (grValue <= grMin) return 0;
  if (grValue >= grMax) return 1;
  return Math.round(((grValue - grMin) / (grMax - grMin)) * 1000) / 1000;
}

function calculateTvdss(
  measuredDepth,
  kbElevation = 45.5,
  inclinationDegrees = 12,
) {
  if (measuredDepth == null) return 0;
  const radians = (inclinationDegrees * Math.PI) / 180;
  const tvd = measuredDepth * Math.cos(radians);
  return Math.round((tvd - kbElevation) * 100) / 100;
}

module.exports = { calculateVshale, calculateTvdss };
