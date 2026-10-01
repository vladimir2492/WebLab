# Titanic JavaScript laboratory

Learn how to ask questions about data, test a rule, and measure what a model learned. JavaScript runs the experiments; understanding the evidence is the goal.

## Learning journey

1. **Meet the passengers:** understand the fields, example values, missing data, and the full table.
2. **Find patterns:** group passengers and compare survival rates.
3. **Make your rule:** predict survival using ticket class and age, then count mistakes.
4. **Teach a model:** animate two possible questions using 10 made-up passengers; then train on real Titanic records with full editable `ml-cart` code.
5. **Try a prediction:** enter passenger details and compare model answers.
6. **Your learning board:** discussion questions, activities, and a two-session teaching plan.

The 10-row animation demonstrates a **decision stump**: a tree with one question. It compares majority-vote predictions and highlights mistakes. The library builds a larger decision tree using Gini impurity.

## Run from this folder

```sh
npm ci
npm start
```

Open <http://127.0.0.1:5174/> locally, or the forwarded port in Codespaces.

| Command | Purpose |
| --- | --- |
| `npm start` | Start the editable classroom notebook on port 5174 |
| `npm run manual` | Print the accuracy of the first-class-or-under-16 rule |
| `npm run build` | Check and bundle the web interface |
| `npm run build:notebook` | Build the separate Observable notebook export |
| `npm run lesson:preview` | Preview the separate Observable notebook export |

The classroom app needs `npm start`: its `/api/compile` endpoint compiles code cells. The `dist` folder alone does not provide the editable notebook server.

## Model results

The library example uses a fixed, stratified 80/20 split (seed 42), with 1,047 training passengers and 262 test passengers. Missing numeric inputs use medians calculated from the training set only.

With the supplied code, `ml-cart` gets **212/262 test predictions correct (80.92%)** and 81.28% training accuracy. The deeper hand-written tree gets 92.93% on its training examples but only 78.63% on the test set. This is an example of overfitting. The toy animation's 90% score is measured on its 10 made-up training examples.

The input fields are class, recorded sex, age, fare, siblings/spouses, and parents/children. The target `survived` is kept out of the inputs. Lifeboat and recovered-body fields are also excluded because they reveal information from after the event.

## Files to explore

- `lesson.html` — explanations and editable JavaScript lesson cells.
- `notebook.js`, `notebook.css`, `index.html` — notebook interface.
- `stump-demo.js` — animated 10-passenger learning example.
- `cart-library.js` — entry point for the installed `ml-cart` package; the complete training pipeline is in the lesson.
- `ml.js` — small hand-written decision tree.
- `manual.js` — manual prediction rules.
- `assets/titanic.csv` — 1,309 passenger records, including survival labels.
- `assets/SOURCE.txt` — source attribution and field descriptions.

This historical dataset excludes crew and is not a definitive modern manifest. The lesson uses supervised machine learning, not an LLM.

## Classroom work

Browser edits stay in local browser storage. **Save notebook** downloads an edited HTML notebook for submission. Downloading does not update `lesson.html` in the repository. Teacher changes to the shared lesson belong in that source file; student experiments can be submitted as downloaded notebooks.
