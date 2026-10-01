# Teacher notes: Titanic lab

These notes are for the person running the lesson. They cover the plan for two sessions, what to say and expect in each chapter, the machine learning used, and whether that machine learning is good.

All numbers were measured on the code and data in this repository. Students see the same numbers unless they change a slider or the code.

## The lesson in one minute

Students explore 1,309 Titanic passenger records, write a prediction rule by hand, then let the computer learn a rule and judge it.

By the end, a student should be able to:

1. Read a table: fields, values, missing values, and fields that reveal the answer.
2. Compare groups with rates, not only counts.
3. Write a rule, measure its accuracy, and compare it with a baseline.
4. Explain training and testing, and why they use different passengers.
5. Recognise overfitting from a training score and a test score.
6. Judge a model: better than what, by how much, and wrong for whom?

The six ideas to repeat aloud during the lesson:

- "Blank is not zero."
- "A rate, not a count."
- "Better than what?" (always compare with the baseline)
- "Which set is that score from?"
- "More complicated is not automatically better."
- "A pattern in a group is not a fact about one person."

## Before the lesson

**Choose how students open it.**

| Way | Students need | Use it when |
| --- | --- | --- |
| Web page on GitHub Pages | A browser and the link | Almost always. No accounts, nothing to install |
| GitHub Codespaces | A GitHub account, a few minutes of setup, `npm start` | You also want students to edit the project files |
| Local `npm start` | Node.js installed | You teach without internet |

For the web page, do this once: on GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**. The next push to `main` publishes the lesson at `https://vladimir2492.github.io/WebLab/`.

**Check it yourself first.** Open the lesson, type a guess in chapter 1, write one answer, press **Save my work**, and open the downloaded file. That file is what students hand in.

**Plan the pairs.** The lesson is written for two students at one computer: one runs the cells, the other guesses and explains. They swap in each chapter.

## How the notebook works

- **Your turn boxes** (yellow) are for written answers. They save as the student types.
- **Guess first.** Five results are hidden until the student types a guess. Any text opens the result; the guess is kept and shown in the report. Do not help students skip this: guessing first is the part that makes the result memorable.
- **Chapter buttons** show a count such as "2 of 4 answered". Walk around the room and read these to see who is behind.
- **Edit code → Run.** Results in later cells update by themselves.
- **↺ Reset** appears on a cell after its code is changed. It puts the original code back. Lesson cells cannot be removed, only reset.
- **Errors.** A typing mistake shows the line, a `^` mark, and a hint. The old result stays, greyed, marked "From your last working version". Cells that depend on a broken cell say "Waiting" and name the chapter to fix.
- **Save my work** downloads one HTML report with answers, guesses, code, and results. **Open saved work** loads that file again, for example on another computer in session 2.
- **Start the lesson again** (bottom of the page) clears everything in that browser.

Sliders go back to their starting value when the page is reloaded. Answers, guesses, and code changes do not.

## Timing plan: two sessions of 60 minutes

Two sessions is tight. If you can use three, see the alternative below.

**Session 1: data and a hand-written rule**

| Minutes | Chapter | Focus |
| --- | --- | --- |
| 0–5 | — | Open the lesson, type names, show one Your turn box and one guess box |
| 5–20 | 1 · Meet the passengers | One row is one person. Blank is not zero. Some fields reveal the answer |
| 20–35 | 2 · Find patterns | Rates, not counts. Which field separates groups most? |
| 35–55 | 3 · Make your rule | Accuracy, baseline, two kinds of mistake, one own rule |
| 55–60 | — | **Save my work**. Two pairs say their rule and its score |

**Session 2: a learned rule and its limits**

| Minutes | Chapter | Focus |
| --- | --- | --- |
| 0–5 | — | **Open saved work** if needed. Ask: "What was your best rule?" |
| 5–25 | 4 · Teach a model | Animation, training and test sets, the computer picks one question |
| 25–40 | 5 · Grow a tree | Overfitting chart, then the five library steps |
| 40–50 | 6 · Check the model | The comparison table, the 20-shuffle chart, accuracy by group |
| 50–55 | 7 · Try a prediction | One change that flips the answer |
| 55–60 | 8 · Your learning board | Exit quiz, **Save my work** |

**If you are short of time, skip in this order:** "Did you know?" (chapter 1), the mini challenge (chapter 1), "Read the tree" (chapter 5), the single-seed slider (chapter 6; keep the 20-shuffle chart), "Going further" (chapter 6), the web design challenge (chapter 7).

**Three sessions of 45 minutes:** chapters 1–3, then chapters 4–5, then chapters 6–8 with two-minute pair presentations.

## Chapter by chapter

### 1 · Meet the passengers

**Goal:** students can read a row and know which fields a model may use.

**Guess box:** "How many of the 323 first-class passengers survived?" Answer: **200 (62%)**. If a pair guessed much higher, use that: first class helped, but did not guarantee survival.

**Expected answers**

- *Talk before coding:* known before the sinking: class, name, sex, age, family counts, ticket, fare, cabin, port. Known only afterwards: `survived`, `boat`, `body`.
- *Try it:* a two-year-old in third class with two parents or children aboard, most likely both parents. You cannot tell survival from these three details.
- *Mini challenge:* a blank age is not a number. Sorting it would put "unknown" somewhere in the order as if it were a real age.

**Watch for:** reading `sibsp = 0` as "travelled alone", and treating ticket numbers as amounts.

### 2 · Find patterns

**Goal:** compare groups with a rate and avoid "because".

**The numbers students will find**

| Group by | Survival rate |
| --- | --- |
| Ticket class | 1st: 200 of 323 (62%) · 2nd: 119 of 277 (43%) · 3rd: 181 of 709 (26%) |
| Sex | Female: 339 of 466 (73%) · Male: 161 of 843 (19%) |
| Port | Cherbourg 56% · Queenstown 36% · Southampton 33% · unknown: 2 passengers |
| Age cutoff 16 | Under 16: 57% · 16 or older: 39% · unknown age: 28% |

**Expected answers**

- *Which field splits the groups most?* **Sex** (73% against 19%). Make sure every pair sees this. It is the key to chapters 3 and 4.
- *Age slider:* at 10 the gap is larger (61% against 39%). At 30 it disappears (41% against 41%). The pattern is about young children, not about age in general.
- *Unknown age:* putting it at zero would count 263 people as babies and change the "under" group completely.

**Watch for:** "Cherbourg passengers survived more because of the port." More than half of the Cherbourg passengers were in first class (52%, against 19% for Southampton). This is a good moment for "two things together are not a cause".

### 3 · Make your rule

**Goal:** a rule is code; its score needs a baseline; mistakes come in two kinds.

**Guess box:** "Out of every 100 passengers, how many does this rule get right?" Answer: **about 69** (897 of 1,309). The baseline "nobody survives" gets **62** (809 of 1,309). The starting rule is only 7 points better than doing nothing.

**The four boxes for the starting rule:** predicted survival and survived 259; predicted survival but died 171 (false positives); predicted non-survival but survived 241 (false negatives); predicted non-survival and died 638.

**Rules students may try** (full table, 1,309 passengers):

| Rule | Correct | Accuracy |
| --- | --- | --- |
| First class OR under 16 (start) | 897 | 68.5% |
| First class only | 886 | 67.7% |
| Under 16 only | 826 | 63.1% |
| Female | 1,021 | 78.0% |
| Female OR under 10 | 1,028 | 78.5% |
| Female OR first class | 964 | 73.6% |
| Female, except third class with a fare above £25 | 1,045 | 79.8% |

To edit the rule, students change two things in the open code cell: the sentence in `ruleName` and the code in `predictSurvival`. For "female":

```js
const ruleName = "Female passengers survive";

function predictSurvival(p) {
  return p.sex === "female" ? 1 : 0;
}
```

**Expected answers**

- *Checkpoint:* OR means one true part is enough. The 40-year-old in first class: yes. The 10-year-old in third class: yes. The 16-year-old in third class: no, because 16 is not younger than 16.
- *Why can a group pattern not tell you about each person?* 62% of first class survived, so 38% did not. The rule is wrong for every one of them.

**Watch for:** students who do not find the sex rule. Ask them which chart in chapter 2 had the biggest gap. Do not tell them the rule; chapter 4 reveals it, and the surprise is useful.

### 4 · Teach a model

**Goal:** "learning" means trying questions on examples with answers and keeping the one with the fewest mistakes.

**Animation:** with the starting 10 cards, "first class?" gets 7 of 10 and "younger than 16?" gets 9 of 10, so age wins. When students set A's `survived` to `0`, the age question gets 10 of 10 and the class question drops to 6 of 10.

**Guess box:** "Which question will the computer choose: class, age, or sex?" Answer: **Recorded sex = female?** with 233 mistakes on 1,047 training passengers. Next best: "Ticket class = 1?" with 337. Every age question makes 388 or more.

**Test results (262 test passengers):** baseline 162, starting rule 179, one learned question 207.

**Expected answer for Your turn:** the learned question gets 28 more right than the starting rule. The first rule ignored the strongest field in the table.

**What to say:** "The computer is not clever. It tried 12 questions and counted mistakes. It was just more thorough than we were."

**Watch for:** "The model knows women were saved first." It knows nothing. It counted.

### 5 · Grow a tree

**Goal:** more questions fit the training examples better, but not new passengers; and a library is used in five standard steps.

**Guess box 1:** "Will the deep tree beat the small tree on training, test, both, or neither?" Answer: **training only.**

| Tree | Training | Test |
| --- | --- | --- |
| Small (depth 4) | 850 of 1,047 (81.2%) | 211 of 262 (80.5%) |
| Deep (depth 12) | 973 of 1,047 (92.9%) | 206 of 262 (78.6%) |

**Depth chart:** training accuracy climbs steadily from 77.7% (depth 1) to 92.9% (depth 12). Test accuracy peaks at depth 3 (82.1%) and then drifts down to about 78%. The gap at depth 12 is about 14 points. That gap is the lesson; the exact test numbers jump around by a point or two. (The chart's trees allow groups of any size, so depth 4 reads 81.6% and 80.2%, slightly different from the small tree above.)

**Read the tree — expected answer:** the tree predicts survival for boys of 3 or younger in first and second class. It predicts non-survival for third-class women who paid more than about £25, and for third-class women older than 28 with a cheaper ticket. Every other woman is predicted to survive and every other man is not.

**Guess box 2:** "How many of 262 will the library tree get right?" Answer: **212**, only 5 more than one question got. If guesses were much higher, that is the point: five extra inputs added five correct answers.

**The five steps in the library cells:** prepare (`medians`, `encode`) → separate (`Xtrain`, `ytrain`, `Xtest`, `ytest`) → train → predict → check. Ask students to point at each one on screen.

**Watch for:** reading `1 = female, 0 = male` as a score, and thinking the model saw the test answers. It did not: `predict` receives `Xtest` only.

### 6 · Check the model

**Goal:** a score needs a comparison, a second look, and a look at who it is wrong for.

**The comparison table (262 test passengers):** baseline 162 · starting rule 179 · one learned question 207 · small tree 211 · deep tree 206 · library tree 212.

**Expected answer, "Is the library tree good?"** Yes: it gets 50 more passengers right than the baseline and 33 more than the starting rule. Doubt: it is only 5 better than one question, it still gets 50 of 262 wrong, and one test set is small.

**Shuffle again:** in 20 shuffles the small tree beats one question 18 times. The small tree's score ranges from 195 to 223 of 262 (74% to 85%). With seed 12 the one-question model wins, 213 to 195.

**Expected answer for the classmate question:** "Which set? How many passengers? Was it one shuffle or many? What was the baseline?"

**Accuracy by group (library tree, test set):**

| Group | Passengers | Correct | False positives | False negatives |
| --- | --- | --- | --- | --- |
| Female | 95 | 74 (77.9%) | 17 | 4 |
| Male | 167 | 138 (82.6%) | 0 | 29 |
| 1st class | 62 | 50 (80.6%) | 0 | 12 |
| 2nd class | 56 | 49 (87.5%) | 3 | 4 |
| 3rd class | 144 | 113 (78.5%) | 14 | 17 |

**Expected answer:** the model predicts survival for only 1 of the 167 test men, so it misses 29 of the 30 men who survived. For women it does the opposite: it predicts survival too often. The two groups get different kinds of mistake. In a real decision, that would mean one group is almost never given the favourable answer.

### 7 · Try a prediction

**Goal:** using a model (inference) is not training, and the answer is a group pattern.

Starting passenger: third class, female, 25, fare £15. Both models predict **survival**.

| Change | Result |
| --- | --- |
| Age 25 → 29 | Flips to non-survival (third-class women older than 28) |
| Fare £15 → £30 | Flips to non-survival |
| Sex → male | Flips to non-survival |
| Male, first class, age 70, fare £500 | Stays non-survival: a large change, no flip |
| Male, age 3, third class | The two models disagree: library says survival, hand-written tree says non-survival |

The last row is worth showing: two reasonable models trained on the same data can disagree about one person.

**Watch for:** students entering their own details and reading the answer as their fate. Say directly: "This model was built from 1,047 people in 1912. It knows nothing about you."

### 8 · Your learning board

Exit quiz answers: **1** boat · **2** no better than the simplest guess · **3** it fitted details of its training examples · **4** to estimate how it works on unseen passengers · **5** most similar training passengers survived · **6** scores change with the shuffle.

Students can check and change their answers, so use the quiz for learning, not for a grade.

## The machine learning in this lesson

### The task

This is **supervised learning** for **binary classification**: learn from examples with known answers, then predict one of two answers.

- **Target:** `survived` (1 or 0). 500 of the 1,309 passengers survived (38.2%).
- **Inputs (features):** ticket class, sex, age, fare, siblings/spouses aboard, parents/children aboard.
- **Left out on purpose:** `boat` and `body` (known only after the sinking; using them is called **data leakage**), plus name, ticket, cabin, port, and destination.

### Preparing the data

- **Missing values.** 263 ages and 1 fare are blank. The tree code needs a number, so blanks are replaced by the **median of the training rows** (age 28, fare £14). Using only training rows matters: a median that includes test rows would let test information into training.
- **Encoding.** Sex becomes a number: female = 1, male = 0. It is a code, not an amount.

### The split

`splitPassengers` shuffles survivors and non-survivors separately and puts 80% of each into the training set. This is a **stratified split**: both sets keep the same share of survivors (about 38%). With seed 42 it gives 1,047 training and 262 test passengers. The same seed always gives the same split, so every student sees the same numbers.

### The models, from simplest to most complex

| Model | What it is | Where |
| --- | --- | --- |
| Baseline | Always predicts the most common answer (non-survival) | Chapters 3, 4, 6 |
| Hand-written rule | The student's `predictSurvival` | Chapter 3 |
| Decision stump | One yes/no question, chosen from 12 candidates by counting training mistakes | Chapter 4 |
| Hand-written decision tree | Our own code in `ml.js`, about 60 lines | Chapter 5 |
| Library decision tree | `ml-cart`, the model called "the library tree" | Chapters 5–7 |

### How a decision tree learns

A tree is built from the top. At each step it looks for the question that makes the two resulting groups as "pure" as possible, then repeats inside each group. This method is called **CART**.

Purity is measured with **Gini impurity**: `1 − (share of survivors)² − (share of non-survivors)²`. It is 0 when everyone in a group has the same answer and 0.5 when the group is half and half.

A worked example with the real training set:

- All 1,047 training passengers: 400 survived. Gini = 0.472.
- Split by sex: 371 women (269 survived, Gini 0.399) and 676 men (131 survived, Gini 0.313). Weighted average: 0.343. **Improvement: 0.129.**
- Split by first class instead: weighted average 0.434. Improvement: 0.038.

Sex improves purity more than three times as much as class, so it becomes the first question. Both trees in the lesson choose it.

The tree stops growing at a limit we set. `maxDepth: 4` allows at most 4 questions in a row. `minNumSamples: 8` stops dividing a group of 8 passengers or fewer. Each final group predicts its majority answer. Without limits a tree keeps dividing until it has memorised the training set; that is overfitting.

### The two tree implementations

| | Hand-written (`ml.js`) | Library (`ml-cart` 2.1.1) |
| --- | --- | --- |
| Split measure | Gini | Gini |
| Stop rules | `maxDepth`; each new group keeps at least `minLeaf` passengers | `maxDepth`; groups of `minNumSamples` or fewer are not divided; a split must improve Gini by more than 0.01 |
| Missing values | Filled with training medians inside the code | Not handled: we fill them in the lesson cell |
| Can explain a prediction | Yes (`explain`, `describe`) | No |

With the lesson's settings the two trees give the same prediction for 261 of the 262 test passengers. The hand-written tree exists so that students can read a tree and follow a path; the library tree shows the standard way of working.

## Is the model good?

Short answer: **yes for this lesson, and about as good as any model gets on this data.** It is not a strong predictor of individual survival, and the lesson is honest about that.

### What the single test says

212 of 262 correct (80.9%) against a baseline of 162 (61.8%). With only 262 test passengers, the uncertainty of that one number is about **±5 percentage points**. So "80.9%" really means "somewhere between 76% and 86%".

### What repeated tests say

One split can be lucky. The table below repeats the whole experiment on 31 different shuffles (seeds 1 to 30 and 42), training on 1,047 and testing on 262 each time.

| Model | Average test accuracy | Lowest to highest | Average training accuracy |
| --- | --- | --- | --- |
| Baseline | 61.8% | — | 61.8% |
| Starting rule | 67.5% | 63.7–71.4% | 68.8% |
| One question (sex) | 77.7% | 71.8–81.7% | 78.1% |
| **Library tree, depth 4 (the lesson's model)** | **80.0%** | **74.4–85.1%** | **81.9%** |
| Library tree, depth 3 | 80.9% | 75.6–85.1% | 81.5% |
| Library tree, depth 6 | 78.9% | 74.4–82.4% | 83.4% |
| Hand-written tree, depth 4 | 79.9% | 74.4–85.1% | 81.8% |
| Hand-written tree, depth 12 | 76.4% | 72.1–79.8% | 92.4% |

Three conclusions:

1. **The tree really is better than one question, but only a little.** It wins in 27 of the 31 shuffles, by 2.4 points on average (about 6 passengers out of 262).
2. **Overfitting is real, not an accident of seed 42.** The deep tree averages 76.4% on test with 92.4% on training.
3. **Depth 4 is a reasonable setting.** Depth 3 is slightly better on average, but the difference is under one point.

### Compared with other models

To check the library, **scikit-learn** (the standard Python library, version 1.9.1) was trained on exactly the same 31 splits and the same six inputs.

| Model (scikit-learn) | Average test accuracy |
| --- | --- |
| Decision tree, depth 4 | 79.9% |
| Decision tree, unlimited depth | 74.8% (96.8% on training) |
| Logistic regression | 78.1% |
| Random forest, 300 trees | 80.7% |
| Gradient boosting | 80.1% |
| Gradient boosting with extra inputs (title, port, family size) | 80.0% |

- **ml-cart matches scikit-learn's tree:** 80.0% against 79.9%. The library does what it should.
- **Stronger methods do not do better here.** Random forest and gradient boosting land at 80–81%. With these inputs, about 80% is the ceiling. The remaining 20% depends on things the table does not record, such as where a person was on the ship.
- **The tree is the best choice for teaching.** It matches the stronger models and students can read every question it asks. A random forest of 300 trees cannot be read.

### What the model actually learned

In scikit-learn's version of the same depth-4 tree, sex accounts for about 62% of the total improvement in purity, ticket class 20%, age 11%, and fare 4%. In words: "women survive, men do not, except very young boys in first and second class, and except many third-class women."

That is a pattern in who was put into lifeboats in 1912. It is useful for teaching and useless for predicting anything else.

### Limits to tell students about

- **One in five predictions is wrong,** and the mistakes are not spread evenly: the model almost never predicts that a man survived.
- **The test is slightly easier than a real one.** 111 of the 262 test passengers share a ticket with a training passenger, usually family. Families often shared an outcome.
- **We explored the whole table before splitting it,** so our choices already knew something about the test passengers.
- **There is no validation set.** The settings were fixed in advance and not tuned, which keeps the test fair, but they were not optimised either.
- **Accuracy is the only headline score.** The false positive and false negative columns say more, and chapter 6 uses them.

### Is ml-cart a good library?

For this lesson, yes.

- It is small, runs in the browser with no server, and trains on 1,047 passengers in about a third of a second.
- Its results match scikit-learn's.
- Its interface (`train`, `predict`) is the same pattern students will meet in every other library.

Know its limits:

- The last release was in January 2022. It works, but it is not actively developed.
- It has no built-in handling of missing values or text categories, no pruning, and no way to show which inputs mattered.
- It is slow on large tables, because it re-checks every row for every possible question.

For a real project, or a later course, use Python with scikit-learn. There is no reason to switch this lesson to a random forest in JavaScript: `ml-random-forest`, tried with one configuration on 11 splits, averaged 76.9%, below the single tree. One configuration is not a verdict on that library, but it gave no reason to change.

## Assessing the reports

Each pair hands in one report file. It opens in any browser and shows answers, guesses, code, and results by chapter.

| Look for | Where | Good evidence |
| --- | --- | --- |
| Uses rates and group sizes | Chapter 2, first box | A sentence with both a count and a percentage |
| Tested an own rule | Chapter 3, last box and the rule cell (marked "code edited") | A hypothesis, a result with numbers, and a named failure |
| Understands train and test | Chapter 5, "Check one record" | The three blanks filled correctly: 1,047, 212, 262 |
| Judges the model | Chapter 6, all three boxes | Compares with the baseline, mentions the shuffles, names the group with more mistakes |
| States limits | Chapter 8, "Before you finish" | Leakage, training score is not enough, patterns are not causes |

A wrong guess in a guess box is not a mistake. Grade the explanation that follows it.

## If something goes wrong

| Problem | What to do |
| --- | --- |
| A cell shows an error | Read the hint with the student. If it is not fixed in a minute, press **↺ Reset** on that cell |
| Many cells say "Waiting" | One earlier cell is broken. The message names the chapter. Fix or reset that cell |
| A result is hidden | It is a guess box. Type a guess |
| A student wants to start over | **Start the lesson again**, at the bottom of the page |
| Work from last session is gone | It is stored per browser and per computer. Use **Open saved work** with the report file from session 1 |
| The page is blank or the table does not load | Reload. With `npm start`, check that the terminal is still running |

## Changing the lesson

All lesson text and code is in `lesson.html`. Each `<script>` is one cell.

- `type="text/markdown"` is explanation. Add `data-note` to turn it into a Your turn box.
- `type="module"` is a code cell. Add `data-guess="Your question?"` to hide its result until the student guesses, and `data-open` to show its code from the start.
- `data-chapter="Title"` on a cell starts a new chapter.
- Give every new cell an `id` number that is not used yet.

The exit quiz questions are in `exit-quiz.js`.
