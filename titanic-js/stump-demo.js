export function scoreQuestion(rows, matches) {
  const groups = [rows.filter(matches), rows.filter(p => !matches(p))];
  const votes = groups.map(group => group.filter(p => p.survived === 1).length > group.length / 2 ? 1 : 0);
  const predict = p => votes[matches(p) ? 0 : 1];
  return {groups, votes, predict, correct: rows.filter(p => predict(p) === p.survived).length};
}

export function createStumpDemo(rows) {
  if (rows.length !== 10 || rows.some(p => !Number.isFinite(p.age) || ![0,1].includes(p.survived))) {
    throw new Error('Use 10 example rows with numeric ages and survived values of 0 or 1.');
  }
  const questions = [
    {label: 'Is ticket class 1?', matches: p => p.pclass === 1},
    {label: 'Is age below 16?', matches: p => p.age < 16}
  ];
  const scored = questions.map(q => ({...q, ...scoreQuestion(rows,q.matches)}));
  const winner = scored[1].correct > scored[0].correct ? 1 : 0;
  const titles = ['Start with 10 examples', 'Try question 1', 'Give each group one prediction', 'Try question 2', 'Count correct answers again', 'Keep the better question'];
  const descriptions = [
    'Each card is one made-up passenger. We already know the answers: 1 means survived, 0 means did not survive. These are learning examples.',
    'Ask the same yes/no question for every passenger. Move each card to the matching group. The answer labels stay with the cards.',
    'Count the answers in each group. Predict whichever answer is more common. A dashed border marks a wrong prediction. A tied group predicts 0.',
    'Use the same 10 passengers, but ask about age. Notice which cards move. Only the question changes; the real answers stay the same.',
    'Choose the majority answer in each new group. Count how many predictions now match the labels. Compare the two questions fairly on the same 10 examples.',
    'Keep the question with more correct training answers. Equal scores keep question 1. The other question is discarded. A stump uses just ONE question; a bigger tree can ask more.'
  ];
  const element = document.createElement('div');
  element.className = 'stump-demo';
  element.innerHTML = `<div class="demo-top"><span class="demo-badge">10 MADE-UP PASSENGERS · TRAINING ONLY</span><span class="demo-position"></span></div>
    <h3 class="demo-title"></h3><p class="demo-explanation" aria-live="polite"></p>
    <div class="demo-legend"><span>● 1 = survived</span><span>◆ 0 = did not survive</span><span>Dashed border = wrong prediction</span></div>
    <div class="demo-pool"></div>
    <div class="demo-tree" hidden><div class="demo-question"></div><div class="demo-connectors" aria-hidden="true">↙ &nbsp; &nbsp; &nbsp; ↘</div><div class="demo-branches"><div class="demo-branch"><h4>YES</h4><p class="demo-vote"></p><div class="demo-cards"></div></div><div class="demo-branch"><h4>NO</h4><p class="demo-vote"></p><div class="demo-cards"></div></div></div></div>
    <div class="demo-comparison" aria-live="polite"></div>
    <div class="demo-inference" hidden><label>Try a new age <input type="number" min="0" max="100" value="20" aria-label="Toy passenger age"></label><label>Ticket class <select aria-label="Toy ticket class"><option>1</option><option>2</option><option selected>3</option></select></label><p class="demo-new-result" aria-live="polite"></p><small>This person has no outcome label. We can predict, but cannot check if we are right.</small></div>
    <div class="demo-controls"><button class="demo-back">← Back</button><button class="demo-play">▶ Play animation</button><button class="demo-next">Next step →</button><button class="demo-reset">Restart</button></div>`;
  const cards = rows.map(p => {
    const card = document.createElement('div');
    card.className = `passenger-card outcome-${p.survived}`;
    const name = document.createElement('strong'); name.textContent = p.id;
    const details = document.createElement('span'); details.textContent = `Age ${p.age} · class ${p.pclass}`;
    const label = document.createElement('small'); label.textContent = `${p.survived ? '●' : '◆'} Real answer: ${p.survived}`;
    card.append(name,details,label);
    return card;
  });
  let step = 0, timer = null;
  function stop() {clearInterval(timer); timer=null; element.querySelector('.demo-play').textContent='▶ Play animation';}
  function inference() {
    const ageText = element.querySelector('input').value;
    const age = Number(ageText), pclass = Number(element.querySelector('select').value);
    const result = element.querySelector('.demo-new-result');
    if (ageText === '' || age < 0 || age > 100) {result.textContent = 'Enter an age from 0 to 100.'; return;}
    const model = scored[winner], passenger = {age,pclass};
    result.textContent = `${model.label} → ${model.matches(passenger) ? 'YES' : 'NO'} → predict ${model.predict(passenger)} (${model.predict(passenger) ? 'survival' : 'non-survival'}).`;
  }
  function render() {
    const before = cards.map(card => card.isConnected ? card.getBoundingClientRect() : null);
    const selected = step < 3 ? 0 : step === 5 ? winner : 1;
    const model = scored[selected];
    const showVote = [2,4,5].includes(step);
    element.querySelector('.demo-position').textContent = `STEP ${step+1} / 6`;
    element.querySelector('.demo-title').textContent = titles[step];
    element.querySelector('.demo-explanation').textContent = descriptions[step];
    element.querySelector('.demo-pool').hidden = step !== 0;
    element.querySelector('.demo-tree').hidden = step === 0;
    element.querySelector('.demo-question').textContent = model.label;
    const bins = [...element.querySelectorAll('.demo-cards')];
    cards.forEach((card,i) => {
      const branch = model.matches(rows[i]) ? 0 : 1;
      (step === 0 ? element.querySelector('.demo-pool') : bins[branch]).appendChild(card);
      card.classList.toggle('prediction-wrong', step !== 0 && showVote && model.predict(rows[i]) !== rows[i].survived);
      card.title = step !== 0 && showVote ? `Predicted ${model.predict(rows[i])}; actual ${rows[i].survived}` : 'Training example';
    });
    element.querySelectorAll('.demo-vote').forEach((label,i) => {
      const positives = model.groups[i].filter(p => p.survived === 1).length;
      label.textContent = showVote ? `${positives} survived · ${model.groups[i].length-positives} did not → predict ${model.votes[i]}` : `${model.groups[i].length} passengers · count their answers next`;
    });
    const scoreboard = element.querySelector('.demo-comparison'); scoreboard.replaceChildren();
    scored.forEach((candidate,i) => {
      const tried = i === 0 ? step >= 2 : step >= 4;
      const result = document.createElement('div');
      result.className = step === 5 && winner === i ? 'demo-score selected' : 'demo-score';
      result.textContent = `${candidate.label} — ${tried ? `${candidate.correct}/10 correct (${candidate.correct*10}%)` : 'not scored yet'}${step === 5 && winner === i ? ' · CHOSEN' : ''}`;
      scoreboard.appendChild(result);
    });
    element.querySelector('.demo-inference').hidden = step !== 5;
    element.querySelector('.demo-back').disabled = step === 0;
    element.querySelector('.demo-next').disabled = step === 5;
    if (step === 5) {stop(); inference();}
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) cards.forEach((card,i) => {
      const after = card.getBoundingClientRect(), old = before[i];
      if (old?.width && after.width) card.animate([{transform:`translate(${old.left-after.left}px,${old.top-after.top}px)`},{transform:'translate(0,0)'}],{duration:650,easing:'ease-in-out'});
    });
  }
  element.querySelector('.demo-next').onclick=()=>{stop();step=Math.min(5,step+1);render();};
  element.querySelector('.demo-back').onclick=()=>{stop();step=Math.max(0,step-1);render();};
  element.querySelector('.demo-reset').onclick=()=>{stop();step=0;render();};
  element.querySelector('.demo-play').onclick=()=>{
    if(timer){stop();return;}
    if(step===5){step=0;render();}
    element.querySelector('.demo-play').textContent='Pause';
    timer=setInterval(()=>{step=Math.min(5,step+1);render();},3500);
  };
  element.querySelector('input').oninput=inference;
  element.querySelector('select').onchange=inference;
  render();
  return {element,dispose:stop};
}
