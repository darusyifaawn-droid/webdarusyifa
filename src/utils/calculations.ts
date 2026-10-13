import { PKG_COMPONENTS } from '../data/pkgStructure';
import {
  CreditScoreParams,
  FullEvaluationResult,
  ComponentCalculation
} from '../types/pkg';

export function calculateComponentScore(
  componentId: number,
  scores: Record<string, number>
): ComponentCalculation {
  const component = PKG_COMPONENTS.find((c) => c.id === componentId);
  if (!component) {
    return {
      componentId,
      totalScore: 0,
      maxScore: 0,
      percentage: 0,
      componentValue: 0
    };
  }

  const maxScore = component.indicators.length * 2;
  let totalScore = 0;

  component.indicators.forEach((ind) => {
    const val = scores[ind.code] ?? 0;
    totalScore += val;
  });

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  // Rumus Kepdirjen Pendis 1843/2021:
  // 0% < X ≤ 25% = 1
  // 25% < X ≤ 50% = 2
  // 50% < X ≤ 75% = 3
  // 75% < X ≤ 100% = 4
  let componentValue = 0;
  if (percentage === 0) {
    // If not answered yet or zero, set to 0
    componentValue = totalScore > 0 ? 1 : 0;
  } else if (percentage <= 25) {
    componentValue = 1;
  } else if (percentage <= 50) {
    componentValue = 2;
  } else if (percentage <= 75) {
    componentValue = 3;
  } else {
    componentValue = 4;
  }

  return {
    componentId,
    totalScore,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    componentValue
  };
}

export function evaluatePKG(
  scores: Record<string, number>,
  creditParams: CreditScoreParams
): FullEvaluationResult {
  const componentResults: ComponentCalculation[] = PKG_COMPONENTS.map((c) =>
    calculateComponentScore(c.id, scores)
  );

  const totalComponentScore = componentResults.reduce(
    (sum, res) => sum + res.componentValue,
    0
  );
  const maxComponentScore = 60; // 15 components * 4

  const scale100Score =
    maxComponentScore > 0
      ? Math.round(((totalComponentScore / maxComponentScore) * 100) * 100) / 100
      : 0;

  let predicate = 'Kurang';
  let npkPercent = 25;

  if (scale100Score >= 91) {
    predicate = 'Amat Baik';
    npkPercent = 125;
  } else if (scale100Score >= 76) {
    predicate = 'Baik';
    npkPercent = 100;
  } else if (scale100Score >= 61) {
    predicate = 'Cukup';
    npkPercent = 75;
  } else if (scale100Score >= 51) {
    predicate = 'Sedang';
    npkPercent = 50;
  } else {
    predicate = 'Kurang';
    npkPercent = 25;
  }

  // Rumus Permen PAN-RB 16/2009:
  // Angka Kredit 1 Tahun = ((AKK - AKPKB - AKP) * (JM / JWM) * NPK) / 4
  const jmRatio =
    creditParams.jwm > 0
      ? Math.min(1, creditParams.jm / creditParams.jwm)
      : 1;

  const targetKredit = creditParams.akk - creditParams.akpkb - creditParams.akp;
  const annualCreditScore =
    Math.round(
      (((targetKredit * jmRatio * (npkPercent / 100)) / 4) * 1000)
    ) / 1000;

  return {
    componentResults,
    totalComponentScore,
    maxComponentScore,
    scale100Score,
    predicate,
    npkPercent,
    annualCreditScore: Math.max(0, annualCreditScore)
  };
}

export const GOLONGAN_PRESETS: Record<
  string,
  { name: string; rank: string; akk: number; akpkb: number; akp: number }
> = {
  'III/a': {
    name: 'Penata Muda, III/a ke III/b',
    rank: 'Penata Muda / III/a',
    akk: 50,
    akpkb: 3,
    akp: 5
  },
  'III/b': {
    name: 'Penata Muda Tingkat I, III/b ke III/c',
    rank: 'Penata Muda Tingkat I / III/b',
    akk: 50,
    akpkb: 7,
    akp: 5
  },
  'III/c': {
    name: 'Penata, III/c ke III/d',
    rank: 'Penata / III/c',
    akk: 100,
    akpkb: 9,
    akp: 10
  },
  'III/d': {
    name: 'Penata Tingkat I, III/d ke IV/a',
    rank: 'Penata Tingkat I / III/d',
    akk: 100,
    akpkb: 12,
    akp: 10
  },
  'IV/a': {
    name: 'Pembina, IV/a ke IV/b',
    rank: 'Pembina / IV/a',
    akk: 150,
    akpkb: 16,
    akp: 15
  },
  'IV/b': {
    name: 'Pembina Tingkat I, IV/b ke IV/c',
    rank: 'Pembina Tingkat I / IV/b',
    akk: 150,
    akpkb: 16,
    akp: 15
  },
  'NON-PNS': {
    name: 'Guru Non-PNS / Yayasan / PPPK',
    rank: 'Guru Tetap Yayasan',
    akk: 50,
    akpkb: 3,
    akp: 5
  }
};

/**
 * Distributes a target sum (15 to 60) across 15 components such that each value is 1, 2, 3, or 4
 */
function distributeComponentValues(targetSum: number): number[] {
  const result: number[] = new Array(15).fill(1);
  let remaining = Math.max(0, Math.min(45, targetSum - 15));

  // Round-robin distribution so components have realistic, balanced values
  let idx = 0;
  while (remaining > 0) {
    if (result[idx] < 4) {
      result[idx]++;
      remaining--;
    }
    idx = (idx + 1) % 15;
  }

  return result;
}

/**
 * Automatically generates indicator scores (0, 1, 2) across all 79 indicators
 * to precisely hit a target PKG scale 100 score (e.g. 78, 84, 85, 90, 95, 100).
 */
export function generateScoresForTargetScore(targetScale100: number): Record<string, number> {
  const clamped = Math.max(25, Math.min(100, targetScale100));
  const targetSum = Math.max(15, Math.min(60, Math.round((clamped / 100) * 60)));
  const compValues = distributeComponentValues(targetSum);

  const scores: Record<string, number> = {};

  PKG_COMPONENTS.forEach((comp, cIdx) => {
    const desiredVal = compValues[cIdx]; // 1, 2, 3, or 4
    const k = comp.indicators.length;
    const maxScore = k * 2;

    // Determine target total raw score for this component based on Kepdirjen Pendis 1843/2021:
    // 0% < X <= 25% = 1
    // 25% < X <= 50% = 2
    // 50% < X <= 75% = 3
    // 75% < X <= 100% = 4
    let targetRaw = maxScore;
    if (desiredVal === 4) {
      // Must be > 75% (strictly greater than 0.75 * maxScore)
      targetRaw = maxScore;
    } else if (desiredVal === 3) {
      // Must be > 50% and <= 75%
      targetRaw = Math.floor(0.75 * maxScore);
      if (targetRaw <= maxScore * 0.5) {
        targetRaw = Math.ceil(0.51 * maxScore);
      }
    } else if (desiredVal === 2) {
      // Must be > 25% and <= 50%
      targetRaw = Math.floor(0.50 * maxScore);
      if (targetRaw <= maxScore * 0.25) {
        targetRaw = Math.ceil(0.26 * maxScore);
      }
    } else {
      // Must be <= 25% and > 0%
      targetRaw = Math.max(1, Math.floor(0.25 * maxScore));
    }

    // Allocate targetRaw among k indicators as scores of 0, 1, or 2
    const indScores: number[] = new Array(k).fill(0);
    let pts = targetRaw;

    // Distribute 1s across indicators
    for (let j = 0; j < k && pts > 0; j++) {
      indScores[j] = 1;
      pts--;
    }
    // Upgrade 1s to 2s until pts is exhausted
    for (let j = 0; j < k && pts > 0; j++) {
      indScores[j] = 2;
      pts--;
    }

    comp.indicators.forEach((ind, iIdx) => {
      scores[ind.code] = indScores[iIdx];
    });
  });

  return scores;
}
