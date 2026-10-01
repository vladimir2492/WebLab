// Six questions to check the main ideas of the lesson.
// `answer` is the index of the correct option.
const questions = [
  {text: 'Which field must NOT be given to the model as an input?',
    options: ['age', 'fare', 'boat', 'pclass'], answer: 2,
    why: 'A lifeboat number is only known after the rescue began, so it reveals the answer. This is called data leakage.'},
  {text: 'Your rule is 62% accurate. Always predicting “did not survive” is also 62% accurate. What does this tell you?',
    options: ['The rule is good, because 62% is more than half', 'The rule is no better than the simplest possible guess', 'The data must contain mistakes', 'The rule is overfitting'], answer: 1,
    why: 'A score only means something when you compare it with a baseline. Matching the baseline means the rule adds nothing.'},
  {text: 'A deep tree scores 93% on its training passengers and 79% on test passengers. What is the best explanation?',
    options: ['The test passengers are harder people to predict', 'The tree fitted small details of its training examples that do not help on other passengers', 'The tree needs to be even deeper', 'The test set is too big'], answer: 1,
    why: 'A large gap between training and test scores is the sign of overfitting.'},
  {text: 'Why do we keep a test set that the model never trains on?',
    options: ['To make training faster', 'To have more examples to learn from', 'To estimate how the model works on passengers it has not seen', 'To remove missing values'], answer: 2,
    why: 'A model can simply remember its training examples. Only unseen examples show whether it learned a useful rule.'},
  {text: 'The model predicts “survives” for a 30-year-old woman in first class. What does that mean?',
    options: ['She survived', 'She had a 100% chance of surviving', 'Most similar passengers in the training data survived', 'Being in first class caused people to survive'], answer: 2,
    why: 'The model repeats a pattern from a group. It does not know what happened to one person, and it does not explain why.'},
  {text: 'You change the shuffle seed. Test accuracy moves from 79% to 82% with the same code. What should you conclude?',
    options: ['The second seed is the correct one', 'The model improved', 'The code has a bug', 'Scores change with which passengers land in the test set, so small differences prove little'], answer: 3,
    why: 'With 262 test passengers, a few points of difference can come from the shuffle alone. Compare models over several shuffles.'}
];
const storageKey = 'titanic-lab-quiz';

export function createExitQuiz() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') ?? {}; } catch { /* Start with no answers. */ }
  const picks = Array.isArray(saved.picks) ? saved.picks : [];
  let checked = saved.checked === true;
  const element = document.createElement('div');
  element.className = 'exit-quiz';
  const list = document.createElement('ol');
  questions.forEach((question, i) => {
    const item = document.createElement('li'), group = document.createElement('div'), text = document.createElement('p');
    text.className = 'quiz-question';
    text.id = `quiz-question-${i}`;
    text.textContent = question.text;
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', text.id);
    group.append(text);
    question.options.forEach((option, j) => {
      const label = document.createElement('label'), input = document.createElement('input');
      input.type = 'radio'; input.name = `quiz-${i}`; input.value = j; input.checked = picks[i] === j;
      input.onchange = () => { picks[i] = j; checked = false; render(); };
      label.append(input, option);
      group.append(label);
    });
    const feedback = document.createElement('p');
    feedback.className = 'quiz-feedback';
    group.append(feedback);
    item.append(group);
    list.append(item);
  });
  const controls = document.createElement('div');
  controls.className = 'quiz-controls';
  controls.innerHTML = '<button class="quiz-check">Check my answers</button><span class="quiz-score" aria-live="polite"></span>';
  controls.querySelector('button').onclick = () => { checked = true; render(); };
  element.append(list, controls);
  function render() {
    const answered = questions.filter((_, i) => picks[i] != null).length;
    const right = questions.filter((question, i) => picks[i] === question.answer).length;
    element.querySelectorAll('.quiz-feedback').forEach((feedback, i) => {
      const question = questions[i];
      feedback.hidden = !checked || picks[i] == null;
      feedback.className = `quiz-feedback ${picks[i] === question.answer ? 'right' : 'wrong'}`;
      feedback.textContent = picks[i] === question.answer ? `Correct. ${question.why}` : `Not yet. Think again, then change your answer. Hint: ${question.why}`;
    });
    controls.querySelector('.quiz-score').textContent = !checked ? `${answered} of ${questions.length} answered`
      : answered < questions.length ? `${right} correct so far · ${questions.length - answered} not answered`
      : `${right} of ${questions.length} correct`;
    try { localStorage.setItem(storageKey, JSON.stringify({picks, checked})); } catch { /* The quiz still works without storage. */ }
  }
  render();
  return element;
}
