const TRIM_TOLERANCE = 1e-6;

function requireFiniteNumber(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }

  return value;
}

/** Converts an angle from degrees to radians for per-radian calculations. */
export function degreesToRadians(degrees) {
  return requireFiniteNumber(degrees, "degrees") * Math.PI / 180;
}

/** Converts a calculated angle from radians to degrees for display. */
export function radiansToDegrees(radians) {
  return requireFiniteNumber(radians, "radians") * 180 / Math.PI;
}

/**
 * Returns Cm, dimensionless.
 * Positive Cm and positive angle of attack use the nose-up sign convention.
 */
export function calculateCm(cm0, cmAlphaPerRad, alphaRad) {
  return requireFiniteNumber(cm0, "cm0")
    + requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad")
      * requireFiniteNumber(alphaRad, "alphaRad");
}

/** Returns the unique trim angle in degrees, or null when no unique trim exists. */
export function calculateTrimAngleDeg(cm0, cmAlphaPerRad) {
  requireFiniteNumber(cm0, "cm0");
  requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");

  if (cmAlphaPerRad === 0) {
    return null;
  }

  return radiansToDegrees(-cm0 / cmAlphaPerRad);
}

/** Returns delta_Cm, dimensionless, for a disturbance supplied in degrees. */
export function calculateDisturbanceCm(cmAlphaPerRad, disturbanceAlphaDeg) {
  return requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad")
    * degreesToRadians(
      requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg"),
    );
}

export function isTrimmed(cmAtAlpha) {
  return Math.abs(requireFiniteNumber(cmAtAlpha, "cmAtAlpha"))
    <= TRIM_TOLERANCE;
}

export function classifyDisturbance(disturbanceAlphaDeg, deltaCm) {
  const disturbanceProduct = degreesToRadians(
    requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg"),
  ) * requireFiniteNumber(deltaCm, "deltaCm");

  if (disturbanceProduct < 0) return "restoring";
  if (disturbanceProduct > 0) return "destabilizing";
  return "neutral";
}

/**
 * Evaluates the linear, quasi-static Cm-alpha model.
 * Inputs: cm0 (dimensionless), cmAlphaPerRad (1/rad), and angles (deg).
 */
export function analyzeTrimResponse(aircraft) {
  const {
    cm0,
    cmAlphaPerRad,
    angleOfAttackDeg,
    disturbanceAlphaDeg,
  } = aircraft ?? {};

  requireFiniteNumber(cm0, "cm0");
  requireFiniteNumber(cmAlphaPerRad, "cmAlphaPerRad");
  requireFiniteNumber(angleOfAttackDeg, "angleOfAttackDeg");
  requireFiniteNumber(disturbanceAlphaDeg, "disturbanceAlphaDeg");

  const cmAtAlpha = calculateCm(
    cm0,
    cmAlphaPerRad,
    degreesToRadians(angleOfAttackDeg),
  );
  const deltaCm = calculateDisturbanceCm(
    cmAlphaPerRad,
    disturbanceAlphaDeg,
  );

  return {
    cmAtAlpha,
    trimAngleDeg: calculateTrimAngleDeg(cm0, cmAlphaPerRad),
    deltaCm,
    trimmed: isTrimmed(cmAtAlpha),
    disturbanceTendency: classifyDisturbance(disturbanceAlphaDeg, deltaCm),
  };
}