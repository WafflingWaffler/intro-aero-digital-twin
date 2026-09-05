import { describe, expect, it } from "vitest";
import { analyzeTrimResponse } from "../../src/student/physics/trim-response.js";

describe("trim-response physics", () => {
  it("matches the completed numerical reference case", () => {
    const result = analyzeTrimResponse({
      cm0: 0.04,
      cmAlphaPerRad: -0.8,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2,
    });

    expect(Math.abs(result.cmAtAlpha - 0.000067)).toBeLessThanOrEqual(
      0.000001,
    );
    expect(Math.abs(result.trimAngleDeg - 2.864789)).toBeLessThanOrEqual(
      0.0001,
    );
    expect(Math.abs(result.deltaCm - (-0.027925))).toBeLessThanOrEqual(
      0.000001,
    );
    expect(result.trimmed).toBe(false);
    expect(result.disturbanceTendency).toBe("restoring");
  });

  it("makes delta_Cm more negative when the positive disturbance increases", () => {
    const baseline = analyzeTrimResponse({
      cm0: 0.04,
      cmAlphaPerRad: -0.8,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2,
    });
    const changed = analyzeTrimResponse({
      cm0: 0.04,
      cmAlphaPerRad: -0.8,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 8,
    });

    expect(Math.abs(changed.deltaCm - (-0.111701))).toBeLessThanOrEqual(
      0.000001,
    );
    expect(changed.deltaCm).toBeLessThan(baseline.deltaCm);
    expect(Math.abs(changed.deltaCm)).toBeGreaterThan(
      Math.abs(baseline.deltaCm),
    );
    expect(changed.disturbanceTendency).toBe("restoring");
  });

  it("handles zero slope without calculating a trim angle", () => {
    const result = analyzeTrimResponse({
      cm0: 0.04,
      cmAlphaPerRad: 0,
      angleOfAttackDeg: 2.86,
      disturbanceAlphaDeg: 2,
    });

    expect(Math.abs(result.cmAtAlpha - 0.04)).toBeLessThanOrEqual(0.000001);
    expect(result.trimAngleDeg).toBeNull();
    expect(Math.abs(result.deltaCm)).toBeLessThanOrEqual(0.000001);
    expect(result.disturbanceTendency).toBe("neutral");
  });
});