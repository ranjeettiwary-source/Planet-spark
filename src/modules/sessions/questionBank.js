const BANK = {
  UKG: {
    easy: [
      { q: '2 + 1 = ?', a: '3', type: 'mental' },
      { q: '5 - 2 = ?', a: '3', type: 'mental' },
      { q: '4 + 4 = ?', a: '8', type: 'mental' },
    ],
    medium: [
      { q: '10 - 6 = ?', a: '4', type: 'concept', needsExplanation: true },
      { q: '3 + 7 = ?', a: '10', type: 'concept', needsExplanation: true },
      { q: '6 + 5 = ?', a: '11', type: 'concept', needsExplanation: true },
    ],
    hard: [
      { q: 'Riya has 8 apples and gives 3. Left?', a: '5', type: 'application' },
      { q: 'A box has 9 balls, add 6. Total?', a: '15', type: 'application' },
      { q: '12 + 9 = ?', a: '21', type: 'vedic' },
      { q: '20 - 11 = ?', a: '9', type: 'vedic' },
    ],
  },
  GRADE7: {
    easy: [
      { q: '15 x 2 = ?', a: '30', type: 'mental' },
      { q: '81 / 9 = ?', a: '9', type: 'mental' },
      { q: '14 + 29 = ?', a: '43', type: 'mental' },
    ],
    medium: [
      { q: 'Explain: Why is 7*8 = 56?', a: '56', type: 'concept', needsExplanation: true },
      { q: '36/6 = ?', a: '6', type: 'concept', needsExplanation: true },
      { q: '45-17 = ?', a: '28', type: 'concept', needsExplanation: true },
    ],
    hard: [
      { q: 'A train covers 120km in 3h. Speed?', a: '40', type: 'application' },
      { q: 'Find 12% of 250', a: '30', type: 'application' },
      { q: '99 x 99 = ?', a: '9801', type: 'vedic' },
      { q: '125 x 8 = ?', a: '1000', type: 'vedic' },
    ],
  },
};

export function getQuestionsForGrade(grade) {
  const key = grade === 'UKG' || grade === 'G1' || grade === 'G2' || grade === 'G3' ? 'UKG' : 'GRADE7';
  const set = BANK[key];
  return [
    ...set.easy.slice(0, 3).map((x) => ({ ...x, round: 'WARM_UP' })),
    ...set.medium.slice(0, 3).map((x) => ({ ...x, round: 'CONCEPT_PROBE' })),
    ...set.hard.slice(0, 2).map((x) => ({ ...x, round: 'APPLICATION' })),
    ...set.hard.slice(2, 4).map((x) => ({ ...x, round: 'VEDIC_SPEED' })),
  ];
}
