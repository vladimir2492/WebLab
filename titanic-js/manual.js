import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';

const csv = readFileSync(new URL('./assets/titanic.csv', import.meta.url), 'utf8');
const passengers = parse(csv, { columns: true, skip_empty_lines: true });

// Our hypothesis: first-class passengers OR children under 16 survive.
// Missing ages do not satisfy the age rule; first class still qualifies.
function predictSurvival(passenger) {
  const firstClass = Number(passenger.pclass) === 1;
  const under16 = passenger.age.trim() !== '' && Number(passenger.age) < 16;
  return firstClass || under16 ? 1 : 0;
}

const results = passengers.map((passenger) => ({
  ...passenger,
  actual: Number(passenger.survived),
  predicted: predictSurvival(passenger),
}));

const correct = results.filter((passenger) => passenger.predicted === passenger.actual);
const predictedSurvivors = results.filter((passenger) => passenger.predicted === 1);
const truePositives = predictedSurvivors.filter((passenger) => passenger.actual === 1).length;
const falsePositives = predictedSurvivors.length - truePositives;
const falseNegatives = results.filter((passenger) => passenger.predicted === 0 && passenger.actual === 1).length;
const trueNegatives = results.length - truePositives - falsePositives - falseNegatives;
const missingAges = passengers.filter((passenger) => passenger.age.trim() === '').length;
const baselineCorrect = results.filter((passenger) => passenger.actual === 0).length;

console.log('Rule: first class OR age under 16 => survives; otherwise => does not survive.');
console.log(`Passengers: ${results.length}`);
console.log(`Correct predictions: ${correct.length} / ${results.length} (${(correct.length / results.length * 100).toFixed(2)}%)`);
console.log(`Incorrect predictions: ${results.length - correct.length}`);
console.table([
  { prediction: 'Survives', 'Actually survived': truePositives, 'Actually did not survive': falsePositives },
  { prediction: 'Does not survive', 'Actually survived': falseNegatives, 'Actually did not survive': trueNegatives },
]);
console.log(`Baseline (always predict non-survival): ${(baselineCorrect / results.length * 100).toFixed(2)}% correct`);
console.log(`Missing ages: ${missingAges}; these passengers qualify only if first class.`);
console.log('This checks a hand-written rule on the dataset; it is not a trained model or a held-out test.');
