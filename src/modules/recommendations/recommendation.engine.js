export function generateRecommendation(scores) {
  const recs = [];
  if (scores.speed < 50) recs.push('Mental Maths Accelerator');
  if (scores.concept < 50) recs.push('Foundation Builder Program');
  if (scores.application < 50) recs.push('Advanced Reasoning Track');
  if (!recs.length) recs.push('Olympiad Enrichment Track');
  return recs;
}

export function generateSummary(scores) {
  const strengths = [];
  const gaps = [];
  if (scores.numberSense >= 70) strengths.push('strong number sense');
  else gaps.push('number sense needs reinforcement');
  if (scores.speed >= 70) strengths.push('quick computation speed');
  else gaps.push('calculation speed below target');
  if (scores.concept >= 70) strengths.push('clear conceptual explanation');
  else gaps.push('concept explanation clarity needs support');
  if (scores.application >= 70) strengths.push('solid application problem solving');
  else gaps.push('application in word problems is weak');
  return `Student shows ${strengths.join(', ') || 'emerging foundations'}, while ${gaps.join(', ') || 'no critical gaps observed'}.`;
}
