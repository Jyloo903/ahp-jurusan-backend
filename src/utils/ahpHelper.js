// src/utils/ahpHelper.js
function buildMatrix(criteria, comparisons) {
  const n = criteria.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));

  // isi matrix berdasarkan pairwise comparison
  for (const comp of comparisons) {
    const i = criteria.findIndex(c => c.id === comp.criteria_id_1);
    const j = criteria.findIndex(c => c.id === comp.criteria_id_2);
    if (i !== -1 && j !== -1) {
      matrix[i][j] = comp.value;
      matrix[j][i] = 1 / comp.value;
    }
  }

  return matrix;
}

function normalizeMatrix(matrix) {
  const n = matrix.length;
  const colSums = Array(n).fill(0);

  // Hitung total tiap kolom
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  // Bagi tiap nilai dengan total kolom
  const normalized = matrix.map(row =>
    row.map((val, j) => val / colSums[j])
  );

  return normalized;
}

function calculateWeights(normalizedMatrix) {
  const n = normalizedMatrix.length;
  const weights = normalizedMatrix.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return sum / n;
  });
  return weights;
}

function calculateConsistency(matrix, weights) {
  const n = matrix.length;
  const lambdaMax =
    matrix
      .map((row, i) => row.reduce((a, b, j) => a + b * weights[j], 0) / weights[i])
      .reduce((a, b) => a + b, 0) / n;

  const CI = (lambdaMax - n) / (n - 1);
  const RI = { 1: 0.0, 2: 0.0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45 }[n] || 1.45;
  const CR = CI / RI;

  return { lambdaMax, CI, CR };
}

// 🆕 FUNGSI BARU UNTUK ALTERNATIVE COMPARISONS
function buildAlternativeMatrix(alternatives, comparisons, criteriaId) {
  const n = alternatives.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));

  // isi matrix berdasarkan alternative comparison untuk criteria tertentu
  for (const comp of comparisons) {
    if (comp.criteria_id !== criteriaId) continue;
    
    const i = alternatives.findIndex(alt => alt.id === comp.alternative_id_1);
    const j = alternatives.findIndex(alt => alt.id === comp.alternative_id_2);
    
    if (i !== -1 && j !== -1) {
      matrix[i][j] = comp.value;
      matrix[j][i] = 1 / comp.value;
    }
  }

  return matrix;
}

// 🆕 FUNGSI COMPLETE AHP
function calculateCompleteAHP(criteria, criteriaComparisons, alternatives, alternativeComparisons) {
  console.log('🔧 Calculating Complete AHP...');
  
  // 1. Calculate criteria weights
  const criteriaMatrix = buildMatrix(criteria, criteriaComparisons);
  const normalizedCriteria = normalizeMatrix(criteriaMatrix);
  const criteriaWeights = calculateWeights(normalizedCriteria);
  const { lambdaMax: criteriaLambdaMax, CI: criteriaCI, CR: criteriaCR } = 
    calculateConsistency(criteriaMatrix, criteriaWeights);

  console.log('✅ Criteria weights calculated');

  // 2. Calculate alternative weights for each criteria
  const alternativeWeightsPerCriteria = [];
  
  for (const criterion of criteria) {
    console.log(`🔧 Calculating alternative weights for criteria: ${criterion.name}`);
    
    const altMatrix = buildAlternativeMatrix(alternatives, alternativeComparisons, criterion.id);
    const normalizedAlt = normalizeMatrix(altMatrix);
    const altWeights = calculateWeights(normalizedAlt);
    const { lambdaMax: altLambdaMax, CI: altCI, CR: altCR } = 
      calculateConsistency(altMatrix, altWeights);

    alternativeWeightsPerCriteria.push({
      criteria_id: criterion.id,
      criteria_name: criterion.name,
      alternative_weights: altWeights,
      consistency: { 
        lambdaMax: altLambdaMax, 
        CI: altCI, 
        CR: altCR,
        isConsistent: altCR <= 0.1 
      }
    });
  }

  console.log('✅ Alternative weights calculated for all criteria');

  // 3. Calculate final scores for each alternative
  const finalScores = alternatives.map((alternative, altIndex) => {
    let totalScore = 0;
    const criteriaBreakdown = [];
    
    criteria.forEach((criterion, critIndex) => {
      const criteriaWeight = criteriaWeights[critIndex];
      const alternativeWeight = alternativeWeightsPerCriteria[critIndex].alternative_weights[altIndex];
      const contribution = criteriaWeight * alternativeWeight;
      totalScore += contribution;

      criteriaBreakdown.push({
        criteria: criterion.name,
        criteria_weight: parseFloat(criteriaWeight.toFixed(4)),
        alternative_weight: parseFloat(alternativeWeight.toFixed(4)),
        contribution: parseFloat(contribution.toFixed(4))
      });
    });

    return {
      alternative: alternative,
      finalScore: parseFloat(totalScore.toFixed(4)),
      criteriaBreakdown: criteriaBreakdown
    };
  });

  // 4. Sort by final score
  finalScores.sort((a, b) => b.finalScore - a.finalScore);

  console.log('🎯 Complete AHP calculation finished');

  return {
    criteria_weights: criteriaWeights.map((weight, index) => ({
      criteria: criteria[index].name,
      weight: parseFloat(weight.toFixed(4))
    })),
    criteria_consistency: {
      lambdaMax: parseFloat(criteriaLambdaMax.toFixed(4)),
      CI: parseFloat(criteriaCI.toFixed(4)),
      CR: parseFloat(criteriaCR.toFixed(4)),
      isConsistent: criteriaCR <= 0.1
    },
    alternative_weights_per_criteria: alternativeWeightsPerCriteria.map(item => ({
      ...item,
      alternative_weights: item.alternative_weights.map(w => parseFloat(w.toFixed(4)))
    })),
    final_ranking: finalScores,
    is_complete_ahp: true
  };
}

module.exports = {
  buildMatrix,
  normalizeMatrix,
  calculateWeights,
  calculateConsistency,
  buildAlternativeMatrix,
  calculateCompleteAHP
};