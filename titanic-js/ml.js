// Small CART classifier for the lesson. All thresholds and missing-value
// replacements are learned from the supplied training rows only.
const features = ['pclass', 'sex', 'age', 'fare', 'sibsp', 'parch'];
const numeric = value => value == null || value === '' ? NaN : Number(value);
export function trainTree(rows, {maxDepth = 4, minLeaf = 8} = {}) {
  if (!rows.length) throw new Error('Training rows are required.');
  const medians = Object.fromEntries(features.map(key => {
    const values = rows.map(p => numeric(p[key])).filter(Number.isFinite).sort((a,b) => a-b);
    const mid = Math.floor(values.length / 2);
    return [key, values.length ? (values[mid] + values[Math.floor((values.length-1)/2)]) / 2 : 0];
  }));
  function encode(p) {
    return features.map(key => key === 'sex' ? (p.sex === 'female' ? 1 : 0)
      : Number.isFinite(numeric(p[key])) ? numeric(p[key]) : medians[key]);
  }
  const data = rows.map(p => ({x: encode(p), y: Number(p.survived)}));
  const impurity = (positive, count) => count ? 2 * positive * (count-positive) / count : 0;
  function grow(items, depth) {
    const total = items.length, positive = items.reduce((s,p) => s+p.y,0);
    const node = {count: total, positive, prediction: positive > total/2 ? 1 : 0};
    if (depth >= maxDepth || total < minLeaf*2 || positive === 0 || positive === total) return node;
    let best = null, score = impurity(positive,total);
    for (let feature = 0; feature < features.length; feature++) {
      const sorted = [...items].sort((a,b) => a.x[feature]-b.x[feature]);
      let leftPositive = 0;
      for (let i=0; i<total-1; i++) {
        leftPositive += sorted[i].y;
        const leftCount = i+1;
        if (leftCount < minLeaf || total-leftCount < minLeaf || sorted[i].x[feature] === sorted[i+1].x[feature]) continue;
        const candidate = impurity(leftPositive,leftCount) + impurity(positive-leftPositive,total-leftCount);
        if (candidate < score - 1e-10) {
          score = candidate;
          best = {feature, threshold:(sorted[i].x[feature]+sorted[i+1].x[feature])/2};
        }
      }
    }
    if (!best) return node;
    return {...node, ...best,
      left: grow(items.filter(p => p.x[best.feature] <= best.threshold),depth+1),
      right: grow(items.filter(p => p.x[best.feature] > best.threshold),depth+1)};
  }
  const root = grow(data,0);
  function walk(p) {
    const x = encode(p), path = [];
    let node = root;
    while (node.left) {
      const key = features[node.feature], yes = x[node.feature] <= node.threshold;
      path.push(key === 'sex' ? `Recorded sex is male? ${yes ? 'Yes' : 'No'}`
        : `${key} ≤ ${+node.threshold.toFixed(2)}? ${yes ? 'Yes' : 'No'}`);
      node = yes ? node.left : node.right;
    }
    return {node,path};
  }
  // The whole tree as indented text: one line per question, one per final prediction.
  function describe(node = root, indent = '') {
    if (!node.left) return `${indent}→ predict ${node.prediction} (${node.positive} of ${node.count} training passengers survived)\n`;
    const key = features[node.feature];
    const [yes, no] = key === 'sex' ? ['Recorded sex is male:', 'Recorded sex is female:']
      : [`${key} ≤ ${+node.threshold.toFixed(2)}:`, `${key} > ${+node.threshold.toFixed(2)}:`];
    return `${indent}${yes}\n${describe(node.left, indent + '    ')}${indent}${no}\n${describe(node.right, indent + '    ')}`;
  }
  return {root, medians, features:[...features],
    predict: p => walk(p).node.prediction,
    explain: p => walk(p).path.join(' → '),
    describe: () => describe()};
}
