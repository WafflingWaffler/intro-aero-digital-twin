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

    expect(result.cmAtAlpha).toBeCloseTo(0, 4);
    expect(result.trimAngleDeg).toBeCloseTo(2.865, 2);
    expect(result.deltaCm).toBeCloseTo(-0.02792, 4);
    expect(result.trimmed).toBe(true);
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

    expect(changed.deltaCm).toBeCloseTo(-0.1117, 4);
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

    expect(result.cmAtAlpha).toBe(0.04);
    expect(result.trimAngleDeg).toBeNull();
    expect(result.deltaCm).toBe(0);
    expect(result.disturbanceTendency).toBe("neutral");
  });
});