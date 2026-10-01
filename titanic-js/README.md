# Titanic JavaScript laboratory

Learn how to ask questions about data, test a rule, and measure what a model learned. JavaScript runs the experiments; understanding the evidence is the goal.

Teaching this lesson? Start with the [teacher notes](TEACHER-NOTES.md).

## Learning journey

1. **Meet the passengers:** understand the fields, example values, missing data, and the full table.
2. **Find patterns:** group passengers and compare survival rates.
3. **Make your rule:** predict survival using ticket class and age, then count mistakes.
4. **Teach a model:** animate two possible questions using 10 made-up passengers; then let the computer choose one question from real training records and test it.
5. **Grow a tree:** compare a small and a deep tree, watch overfitting on a depth chart, read the tree, and train one with the `ml-cart` library.
6. **Check the model:** compare every approach on the same test passengers, shuffle again with other seeds, and check accuracy group by group.
7. **Try a prediction:** enter passenger details and compare model answers.
8. **Your learning board:** share a finding, take the exit quiz, and save a report.

Each chapter has **Your turn** boxes for written answers. Five results stay hidden until the student types a guess. The chapter buttons count the answers written so far.

## Run from this folder

```sh
npm ci
npm start
```

Open <http://127.0.0.1:5174/> locally, or the forwarded port in Codespaces.

| Command | Purpose |
| --- | --- |
| `npm start` | Start the editable classroom notebook on port 5174 |
| `npm run build` | Build the lesson as a static site in `dist/` |
| `npm run preview` | Serve the built site on port 5174 to check it |
| `npm run manual` | Print the accuracy of the first-class-or-under-16 rule |
| `npm run build:notebook` | Build the separate Observable notebook export |
| `npm run lesson:preview` | Preview the separate Observable notebook export |

Code cells are compiled in the browser, so the lesson needs no server of its own. Any static host can serve the `dist` folder; the repository's GitHub Actions workflow publishes it to GitHub Pages.

## Model results

The split is fixed and stratified: 80/20 with seed 42, giving 1,047 training passengers and 262 test passengers. Missing numeric inputs use medians calculated from the training set only.

Correct predictions on the 262 test passengers, with the supplied code:

| Approach | Correct | Test accuracy | Training accuracy |
| --- | --- | --- | --- |
| Baseline: always predict the majority | 162 | 61.83% | 61.80% |
| Starting rule: first class OR under 16 | 179 | 68.32% | — |
| One learned question (recorded sex) | 207 | 79.01% | 77.75% |
| Small hand-written tree, depth 4 | 211 | 80.53% | 81.18% |
| Deep hand-written tree, depth 12 | 206 | 78.63% | 92.93% |
| `ml-cart` library tree, depth 4 | 212 | 80.92% | 81.28% |

Most of the gain comes from one question. The deep tree shows overfitting: its training accuracy is 14 points above its test accuracy. The toy animation's 90% score is measured on its 10 made-up training examples.

The input fields are class, recorded sex, age, fare, siblings/spouses, and parents/children. The target `survived` is kept out of the inputs. Lifeboat and recovered-body fields are also excluded because they reveal information from after the event.

The [teacher notes](TEACHER-NOTES.md) explain these numbers, how much they change with a different split, and how this tree compares with other models.

## Files to explore

- `lesson.html` — explanations, answer prompts, and editable JavaScript lesson cells. `data-chapter` starts a chapter, `data-note` adds an answer box, `data-guess` hides a result until the student guesses, and `data-open` shows a cell's code from the start.
- `notebook.js`, `notebook.css`, `index.html` — notebook interface.
- `stump-demo.js` — animated 10-passenger learning example.
- `exit-quiz.js` — six-question exit quiz.
- `cart-library.js` — entry point for the installed `ml-cart` package; the training steps are in the lesson.
- `ml.js` — small hand-written decision tree.
- `manual.js` — manual prediction rules.
- `assets/titanic.csv` — 1,309 passenger records, including survival labels.
- `assets/SOURCE.txt` — source attribution and field descriptions.

This historical dataset excludes crew and is not a definitive modern manifest. The lesson uses supervised machine learning, not an LLM.

## Classroom work

Answers, guesses, and code edits stay in the student's browser. **Save my work** downloads one HTML report with the answers, guesses, code, and results; it opens in any browser. **Open saved work** loads that file again on another computer. Saving does not update `lesson.html` in the repository. To change the lesson itself, edit the files in your own branch or fork and commit your changes.
