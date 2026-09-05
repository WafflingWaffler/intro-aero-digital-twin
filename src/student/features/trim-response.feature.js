import {
  analyzeTrimResponse,
  calculateCm,
  degreesToRadians,
} from "../physics/trim-response.js";

const REQUIRED_CAPABILITY = {
  id: "loads.pitch.component-sum",
  version: 1,
};

function hasRequiredCapability(capabilityContext) {
  const capabilities = capabilityContext?.capabilities ?? capabilityContext;

  if (Array.isArray(capabilities)) {
    return capabilities.some(
      (capability) =>
        capability?.id === REQUIRED_CAPABILITY.id
        && capability?.version >= REQUIRED_CAPABILITY.version,
    );
  }

  return (
    capabilities?.[REQUIRED_CAPABILITY.id]?.version
    >= REQUIRED_CAPABILITY.version
  );
}

function requireCapability(capabilityContext) {
  if (!hasRequiredCapability(capabilityContext)) {
    throw new Error(
      `Required capability ${REQUIRED_CAPABILITY.id} version ${REQUIRED_CAPABILITY.version} is unavailable.`,
    );
  }
}

function createPlotPoints(aircraft) {
  const points = [];

  for (let angleDeg = -10; angleDeg <= 10; angleDeg += 1) {
    points.push({
      x: angleDeg,
      y: calculateCm(
        aircraft.cm0,
        aircraft.cmAlphaPerRad,
        degreesToRadians(angleDeg),
      ),
    });
  }

  return points;
}

function createVerificationCases() {
  const numerical = analyzeTrimResponse({
    cm0: 0.04,
    cmAlphaPerRad: -0.8,
    angleOfAttackDeg: 2.86,
    disturbanceAlphaDeg: 2,
  });

  const behavioral = analyzeTrimResponse({
    cm0: 0.04,
    cmAlphaPerRad: -0.8,
    angleOfAttackDeg: 2.86,
    disturbanceAlphaDeg: 8,
  });

  const boundary = analyzeTrimResponse({
    cm0: 0.04,
    cmAlphaPerRad: 0,
    angleOfAttackDeg: 2.86,
    disturbanceAlphaDeg: 2,
  });

  return [
    {
      name: "Numerical reference case",
      passed:
        Math.abs(numerical.cmAtAlpha - 0.000067) <= 0.000001
        && Math.abs(numerical.trimAngleDeg - 2.864789) <= 0.0001
        && Math.abs(numerical.deltaCm - (-0.027925)) <= 0.000001
        && !numerical.trimmed
        && numerical.disturbanceTendency === "restoring",
    },
    {
      name: "Behavioral disturbance case",
      passed:
        Math.abs(behavioral.deltaCm - (-0.111701)) <= 0.000001
        && behavioral.deltaCm < numerical.deltaCm
        && Math.abs(behavioral.deltaCm) > Math.abs(numerical.deltaCm)
        && behavioral.disturbanceTendency === "restoring",
    },
    {
      name: "Zero-slope boundary case",
      passed:
        Math.abs(boundary.cmAtAlpha - 0.04) <= 0.000001
        && boundary.trimAngleDeg === null
        && Math.abs(boundary.deltaCm) <= 0.000001
        && boundary.disturbanceTendency === "neutral",
    },
  ];
}

function createResults(analysis) {
  return [
    {
      label: "Cm(alpha)",
      value: analysis.cmAtAlpha,
      unit: "",
      precision: 6,
      emphasis: true,
    },
    {
      label: "Trim angle",
      value: analysis.trimAngleDeg ?? "not available",
      unit: analysis.trimAngleDeg === null ? "" : "deg",
      precision: 6,
    },
    {
      label: "Disturbance delta_Cm",
      value: analysis.deltaCm,
      unit: "",
      precision: 6,
    },
    {
      label: "Selected condition",
      value: analysis.trimmed ? "trimmed" : "not trimmed",
      unit: "",
    },
    {
      label: "Disturbance tendency",
      value: analysis.disturbanceTendency,
      unit: "",
    },
  ];
}

export const feature = {
  contractVersion: 4,
  id: "trim-response",
  title: "Live Cm–alpha relationship and trim",
  description:
    "Evaluates trim and the quasi-static pitching-moment response to a small angle-of-attack disturbance.",
  category: "Stability · Student feature",
  learningMode: "concept",
  topicId: "stability",
  inputKeys: [
    "cm0",
    "cmAlphaPerRad",
    "angleOfAttackDeg",
    "disturbanceAlphaDeg",
  ],
  requiresCapabilities: [REQUIRED_CAPABILITY],
  providesCapabilities: [{ id: "stability.pitch.cm-alpha", version: 1 }],
  assumptions: [
    "The Cm–alpha relationship is linear over the investigated range.",
    "The model is quasi-static and represents a small disturbance.",
    "Cm0 and Cm_alpha represent the same aircraft configuration and flight condition.",
  ],
  validityLimits: [
    "Do not use at stall, large angle of attack, or strongly nonlinear conditions.",
    "The model does not calculate time response, damping, control motion, or handling quality.",
    "A restoring tendency does not establish safety, controllability, or flightworthiness.",
  ],
  simulation: {
    display: "analysis-only",
    durationS: 1,
    initialState: {},
    controls: {},
    disturbance: {},
  },

  analyze(aircraft, capabilityContext) {
    requireCapability(capabilityContext);
    const analysis = analyzeTrimResponse(aircraft);

    const tendencyInterpretation =
      analysis.disturbanceTendency === "restoring"
        ? "The disturbance creates a restoring pitching-moment tendency under this linear, quasi-static model."
        : analysis.disturbanceTendency === "destabilizing"
          ? "The disturbance creates a destabilizing pitching-moment tendency under this linear, quasi-static model."
          : "The disturbance creates a neutral pitching-moment tendency under this linear, quasi-static model.";

    return {
      results: createResults(analysis),
      verificationCases: createVerificationCases(),
      decision: {
        question:
          "At the selected angle of attack, is the simplified pitching-moment model trimmed, and does a small angle-of-attack disturbance create a restoring moment tendency?",
        interpretation: `${analysis.trimmed ? "The selected condition is trimmed." : "The selected condition is not trimmed."} ${tendencyInterpretation}`,
        status:
          analysis.trimmed && analysis.disturbanceTendency === "restoring"
            ? "pass"
            : analysis.disturbanceTendency === "neutral"
              ? "neutral"
              : "caution",
      },
      plots: [
        {
          title: "Cm–alpha relationship",
          xLabel: "Angle of attack (deg)",
          yLabel: "Pitching-moment coefficient",
          series: [
            {
              label: "Cm(alpha)",
              points: createPlotPoints(aircraft),
            },
          ],
          regions: [],
          referenceLines: [
            {
              axis: "y",
              value: 0,
              label: "Trim line: Cm = 0",
            },
          ],
        },
      ],
      scene: null,
    };
  },
};

export const model = {
  kind: "derived",
  evaluate(runtimeContext) {
    const analysis = analyzeTrimResponse(runtimeContext.aircraft);

    return {
      values: {
        cmAtAlpha: analysis.cmAtAlpha,
        deltaCm: analysis.deltaCm,
        trimmed: analysis.trimmed,
        disturbanceTendency: analysis.disturbanceTendency,
        trimAngleAvailable: analysis.trimAngleDeg !== null,
        ...(analysis.trimAngleDeg === null
          ? {}
          : { trimAngleDeg: analysis.trimAngleDeg }),
      },
    };
  },
};