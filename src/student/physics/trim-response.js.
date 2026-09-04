const TRIM_TOLERANCE = 1e-6;

function requireFiniteNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  return value;
}

export function degreesToRadians(degrees) {
  return requireFiniteNumber(degrees, "degrees") * Math.PI / 180;
}

export function radiansToDegrees(radians) {
  return requireFiniteNumber(radians, "radians") * 180 / Math.PI;
}

/**
 * Cm is dimensionless. alphaRad is radians; cmAlphaPerRad is 1/rad.
 * Positive Cm and positive alpha are nose-up.
 */
export function calculateCm(cm0, cmAlphaPerRad, alphaRad) {
  return requireFiniteNumber(cm0, "cm0")
    + requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad")
    * requireFiniteNumber(alphaRad, "alphaRad");
}

export function calculateTrimAngleDeg(cm0, cmAlphaPerRad) {
  requireFiniteNumber(cm0, "cm0");
  requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");

  if (cmAlphaPerRad === 0) {
    return null;
  }

  return radiansToDegrees(-cm0 / cmAlphaPerRad);
}

export function calculateDisturbanceCm(cmAlphaPerRad, disturbanceAlphaDeg) {
  return requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad")
    * degreesToRadians(requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg"));
}

export function isTrimmed(cmAtAlpha) {
  return Math.abs(requireFiniteNumber(cmAtAlpha, "cmAtAlpha")) <= TRIM_TOLERANCE;
}

export function classifyDisturbance(disturbanceAlphaDeg, deltaCm) {
  const product = degreesToRadians(
    requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg"),
  ) * requireFiniteNumber(deltaCm, "deltaCm");

  if (product < 0) return "restoring";
  if (product > 0) return "destabilizing";
  return "neutral";
}

export function analyzeTrimResponse(aircraft) {
  const { cm0, cmAlphaPerRad, angleOfAttackDeg, disturbanceAlphaDeg } = aircraft ?? {};

  requireFiniteNumber(cm0, "cm0");
  requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");
  requireFiniteNumber(angleOfAttackDeg, "angleOfAttackDeg");
  requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg");

  const angleOfAttackRad = degreesToRadians(angleOfAttackDeg);
  const cmAtAlpha = calculateCm(cm0, cmAlphaPerRad, angleOfAttackRad);
  const trimAngleDeg = calculateTrimAngleDeg(cm0, cmAlphaPerRad);
  const deltaCm = calculateDisturbanceCm(cmAlphaPerRad, disturbanceAlphaDeg);

  return {
    cmAtAlpha,
    trimAngleDeg,
    deltaCm,
    trimmed: isTrimmed(cmAtAlpha),
    disturbanceTendency: classifyDisturbance(disturbanceAlphaDeg, deltaCm),
  };
}