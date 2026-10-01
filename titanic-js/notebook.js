import { NotebookRuntime, observe, FileAttachment } from '@observablehq/notebook-kit/runtime';
import { transpileJavaScript } from '@observablehq/notebook-kit';
import * as Inputs from '@observablehq/inputs';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import MarkdownIt from 'markdown-it';
import lessonSource from './lesson.html?raw';

const runtime = new NotebookRuntime({Inputs: () => Inputs, Plot: () => Plot, d3: () => d3, FileAttachment: () => FileAttachment});
const builtinNames = ['Inputs', 'Plot', 'd3', 'FileAttachment', 'display', 'view'];
const markdown = new MarkdownIt();
const storageKey = 'titanic-lab-v3';
const host = document.querySelector('#cells');
const $ = selector => document.querySelector(selector);
const escapeHtml = text => String(text).replace(/[&<>"]/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[character]));

// The lesson: a data-chapter attribute starts a chapter, data-note adds an answer box,
// data-guess hides a result until the student commits to a guess.
const chapters = [];
const lessonDocument = new DOMParser().parseFromString(lessonSource, 'text/html');
const templateCells = [...lessonDocument.querySelectorAll('notebook > script')].map(script => {
  if (script.dataset.chapter) chapters.push(script.dataset.chapter);
  return {
    id: Number(script.id),
    type: script.type === 'module' ? 'js' : 'note' in script.dataset ? 'note' : 'markdown',
    code: script.textContent.replace(/^    /gm, '').trim(),
    chapter: Math.max(0, chapters.length - 1),
    guess: script.dataset.guess ?? null,
    open: 'open' in script.dataset
  };
});
const templateById = new Map(templateCells.map(cell => [cell.id, cell]));

// Student work kept in this browser: edited code, added cells, answers, and guesses.
function normalizeWork(saved) {
  const text = value => typeof value === 'string' ? value : '';
  const record = value => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).filter(([, entry]) => typeof entry === 'string')) : {};
  return {
    edits: record(saved?.edits), notes: record(saved?.notes), guesses: record(saved?.guesses),
    extras: Array.isArray(saved?.extras) ? saved.extras.filter(extra => Number.isInteger(extra?.id) && typeof extra.code === 'string') : [],
    student: text(saved?.student),
    chapter: Number.isInteger(saved?.chapter) && saved.chapter >= 0 && saved.chapter < chapters.length ? saved.chapter : 0
  };
}
let work;
try { work = normalizeWork(JSON.parse(localStorage.getItem(storageKey) ?? 'null')); }
catch { work = normalizeWork(null); }

let cells = [];
let activeChapter = work.chapter;
const addedCell = (extra, chapter) => ({id: extra.id, type: 'js', code: extra.code, added: true, chapter});
const extrasByAnchor = d3.group(work.extras, extra => templateById.has(extra.anchor) ? extra.anchor : null);
cells.push(...(extrasByAnchor.get(null) ?? []).map(extra => addedCell(extra, 0)));
for (const template of templateCells) {
  cells.push({...template, code: template.type === 'js' ? work.edits[template.id] ?? template.code : template.code});
  cells.push(...(extrasByAnchor.get(template.id) ?? []).map(extra => addedCell(extra, template.chapter)));
}
let nextId = Math.max(1000, ...cells.map(cell => cell.id + 1));

function save() {
  work.edits = {};
  work.extras = [];
  let anchor = null;
  for (const cell of cells) {
    if (cell.added) work.extras.push({id: cell.id, code: cell.code, anchor});
    else {
      anchor = cell.id;
      if (cell.type === 'js' && cell.code !== templateById.get(cell.id).code) work.edits[cell.id] = cell.code;
    }
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(work));
    $('#saved').textContent = 'Saved in this browser';
  } catch { $('#saved').textContent = 'Browser storage unavailable — use Save my work'; }
  updateProgress();
}

// display("text") shows as plain text rather than as a quoted JavaScript string.
const plainText = new MutationObserver(records => {
  for (const {addedNodes} of records) for (const node of addedNodes) {
    if (node.nodeType !== 1 || !node.classList.contains('observablehq')) continue;
    if (!node.querySelector(':scope > .observablehq--inspect > .observablehq--string:only-child')) continue;
    try {
      const text = JSON.parse(node.textContent);
      node.className = 'plain-text';
      node.textContent = text;
    } catch { /* Keep the inspector view for strings it shows in another form. */ }
  }
});

function renderCell(cell, before = null) {
  const section = document.createElement('section');
  cell.element = section;
  section.hidden = cell.chapter !== activeChapter;
  if (cell.type === 'markdown') {
    section.className = 'prose';
    section.innerHTML = markdown.render(cell.code);
  } else if (cell.type === 'note') {
    section.className = 'note';
    section.innerHTML = `<div class="note-prompt">${markdown.render(cell.code)}</div><textarea rows="3" placeholder="Write your answer here…" aria-label="Your answer"></textarea>`;
    const answer = section.querySelector('textarea');
    answer.value = work.notes[cell.id] ?? '';
    answer.addEventListener('input', () => { work.notes[cell.id] = answer.value; save(); });
  } else {
    section.className = 'code-cell';
    section.dataset.cellId = cell.id;
    section.innerHTML = `<div class="cell-bar"><strong>${cell.added ? 'YOUR EXPERIMENT' : 'EXPERIMENT'}</strong><span class="status">Not run</span><button class="edit" aria-expanded="false">Edit code</button><button class="run">▶ Run</button><button class="reset" title="Put back the original code" hidden>↺ Reset</button><button class="add" title="Add a code cell below">+</button><button class="remove" title="Remove this cell" hidden>Remove</button></div><textarea class="code" hidden spellcheck="false" aria-label="JavaScript code"></textarea><div class="cell-error" role="alert" hidden></div><form class="guess" hidden><label><strong>Guess first</strong><span class="guess-question"></span><input type="text" maxlength="200" placeholder="Type your guess…" aria-label="Your guess"></label><button>Lock in my guess and show the result</button></form><p class="guess-made" hidden></p><div class="output" data-empty="Run this experiment to see its result."></div>`;
    const editor = section.querySelector('.code');
    const toggle = section.querySelector('.edit');
    editor.value = cell.code;
    editor.rows = Math.min(24, Math.max(3, cell.code.split('\n').length));
    const showEditor = visible => {
      editor.hidden = !visible;
      toggle.textContent = visible ? 'Hide code' : 'Edit code';
      toggle.setAttribute('aria-expanded', String(visible));
    };
    if (cell.open) showEditor(true);
    cell.state = {root: section.querySelector('.output'), expanded: [], variables: []};
    plainText.observe(cell.state.root, {childList: true});
    toggle.onclick = () => { showEditor(editor.hidden); if (!editor.hidden) editor.focus(); };
    const edited = () => {
      section.querySelector('.reset').hidden = cell.added || cell.code === templateById.get(cell.id).code;
    };
    editor.addEventListener('input', () => {
      cell.code = editor.value;
      section.querySelector('.status').textContent = 'Edited — press Run';
      edited(); save();
    });
    editor.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.shiftKey) {event.preventDefault(); run(cell);}
      if (event.key === 'Tab') {
        event.preventDefault();
        editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
        editor.dispatchEvent(new Event('input'));
      }
    });
    section.querySelector('.run').onclick = () => run(cell);
    section.querySelector('.add').onclick = () => add(cell);
    section.querySelector('.reset').onclick = () => {
      if (!confirm('Put back the original code for this cell? Your changes to it will be lost.')) return;
      cell.code = editor.value = templateById.get(cell.id).code;
      edited(); save(); run(cell);
    };
    // Lesson cells can be reset but not removed: other cells depend on them.
    section.querySelector('.remove').hidden = !cell.added;
    section.querySelector('.remove').onclick = () => {
      if (!confirm('Remove this cell and its code?')) return;
      cell.state.variables.forEach(variable => variable.delete());
      cells = cells.filter(other => other !== cell);
      section.remove(); save();
    };
    section.querySelector('.guess-question').textContent = cell.guess ?? '';
    section.querySelector('.guess').onsubmit = event => {
      event.preventDefault();
      const guess = section.querySelector('.guess input').value.trim();
      if (!guess) { section.querySelector('.guess input').focus(); return; }
      work.guesses[cell.id] = guess;
      renderGuess(cell); save();
    };
    edited();
    renderGuess(cell);
  }
  host.insertBefore(section, before);
}

function renderGuess(cell) {
  const guess = work.guesses[cell.id];
  const locked = Boolean(cell.guess) && !guess;
  cell.element.querySelector('.guess').hidden = !locked;
  cell.state.root.hidden = locked;
  const made = cell.element.querySelector('.guess-made');
  made.hidden = !cell.guess || !guess;
  made.textContent = guess ? `${cell.guess} Your guess: ${guess}` : '';
}

// Say where the mistake is and what to look for, in plain language.
function explainSyntaxError(error, code) {
  const [, lineNumber, column] = /\((\d+):(\d+)\)\s*$/.exec(error.message) ?? [];
  const message = error.message.replace(/\s*\(\d+:\d+\)\s*$/, '');
  const hint = /^Unexpected token/.test(message) ? 'JavaScript stopped at the ^ mark. The mistake is often just before it: look for a missing ) ] } or a missing comma or quote mark.'
    : /^Unterminated/.test(message) ? 'A piece of text is missing its closing quote mark.'
    : /has already been declared/.test(message) ? 'This name is created twice in the same cell. Use a different name for one of them.'
    : /^Assignment to external variable/.test(message) ? 'This name was created in another cell, and only that cell can change it. Create a new name here instead.'
    : 'Check this line and the line above it.';
  const title = document.createElement('strong');
  title.textContent = lineNumber ? `JavaScript could not read line ${lineNumber}: ${message}` : `JavaScript could not read this code: ${message}`;
  const parts = [title];
  if (lineNumber) {
    const source = document.createElement('pre');
    source.textContent = `${code.split('\n')[lineNumber - 1] ?? ''}\n${' '.repeat(Number(column))}^`;
    parts.push(source);
  }
  const advice = document.createElement('p');
  advice.textContent = hint;
  return [...parts, advice];
}

function closestName(name, known) {
  const distance = (a, b) => {
    let row = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row = next;
    }
    return row[b.length];
  };
  const [best] = known.map(other => [other, distance(name.toLowerCase(), other.toLowerCase())]).sort((a, b) => a[1] - b[1]);
  return best && best[1] <= Math.max(1, Math.floor(name.length / 3)) ? best[0] : null;
}

function explainRuntimeError(error) {
  const message = String(error?.message ?? error);
  const missing = /^(\S+) is not defined$/.exec(message);
  if (missing) {
    const near = closestName(missing[1], [...builtinNames, ...cells.flatMap(cell => cell.defines ?? [])]);
    return near ? `Check the spelling: did you mean ${near}? Names must match exactly, including capital letters.`
      : `No cell creates ${missing[1]}. Check the spelling, or create it first with: const ${missing[1]} = …`;
  }
  if (/is defined more than once$/.test(message)) return 'Two cells create the same name. Each name can be created only once, so use a different name in one of them.';
  if (/is not a function$/.test(message)) return 'Check the spelling of the function name, and that the value before the dot is what you expect.';
  if (/^Cannot read properties of (undefined|null)/.test(message)) return 'The value before the dot is missing. Check that it exists and has a value.';
  return null;
}

// A failed cell reports its error once; cells that depend on it only say they are waiting.
// The runtime names the failed input, which leads back to the cell that creates it.
function reportError(cell, error) {
  const status = cell.element.querySelector('.status');
  let owner = cells.find(other => other !== cell && other.defines?.includes(error?.input));
  while (owner?.blockedBy && owner.blockedBy !== cell) owner = owner.blockedBy;
  cell.blockedBy = owner ?? null;
  const note = document.createElement('p');
  if (owner) {
    status.textContent = 'Waiting';
    note.className = 'waiting';
    note.textContent = owner.chapter === cell.chapter ? 'Waiting: an earlier experiment in this chapter has an error. Fix it and this result will update.'
      : `Waiting: an experiment in chapter ${owner.chapter + 1}, “${chapters[owner.chapter]}”, has an error. Fix it and this result will update.`;
    cell.state.root.replaceChildren(note);
    return;
  }
  status.textContent = 'Error';
  const hint = explainRuntimeError(error);
  if (!hint) return;
  note.className = 'hint';
  note.textContent = hint;
  cell.state.root.append(note);
}

function run(cell) {
  const status = cell.element.querySelector('.status');
  const errorBox = cell.element.querySelector('.cell-error');
  let compiled;
  try {
    // Compile student-authored JavaScript into Observable's cell definition.
    compiled = transpileJavaScript(cell.code, {resolveLocalImports: true});
  } catch (error) {
    const stale = cell.state.variables.length > 0;
    status.textContent = stale ? 'Error — showing your last working result' : 'Error';
    errorBox.replaceChildren(...explainSyntaxError(error, cell.code));
    errorBox.hidden = false;
    cell.state.root.classList.toggle('stale', stale);
    return;
  }
  errorBox.hidden = true;
  cell.state.root.classList.remove('stale');
  cell.defines = compiled.outputs;
  const definition = {...compiled, id: cell.id, body: new Function(`return (${compiled.body});`)()};
  cell.state.variables.forEach(variable => variable.delete());
  cell.state.variables = [];
  runtime.define(cell.state, definition, (state, options) => {
    const observer = observe(state, options);
    return {...observer,
      pending() {observer.pending.call(this); status.textContent = 'Running…';},
      fulfilled(value) {
        observer.fulfilled.call(this, value);
        status.textContent = 'Done';
        cell.blockedBy = null;
        state.root.dataset.empty = cell.defines.length
          ? `✓ Ran. This cell creates ${cell.defines.join(', ')}. The cells that use ${cell.defines.length > 1 ? 'them' : 'it'} show the results.`
          : '✓ Ran. This code shows no result. Use display(…) to show a value.';
      },
      rejected(error) {observer.rejected.call(this, error); reportError(cell, error);}
    };
  });
}

function add(after) {
  const cell = {id: nextId++, type: 'js', added: true, chapter: after?.chapter ?? activeChapter, code: '// Try a question about the passengers\npassengers.length'};
  const index = after ? cells.indexOf(after) + 1 : cells.findLastIndex(item => item.chapter === activeChapter) + 1;
  const before = cells[index]?.element ?? null;
  cells.splice(index, 0, cell);
  renderCell(cell, before); save();
  cell.element.querySelector('.edit').click();
}

// A readable copy of the student's work: explanations, answers, guesses, code, and results.
function snapshot(root) {
  const copy = root.cloneNode(true);
  const controls = 'input, select, textarea, button';
  const frozen = copy.querySelectorAll(controls);
  root.querySelectorAll(controls).forEach((control, i) => {
    const twin = frozen[i];
    if (control.type === 'checkbox' || control.type === 'radio') twin.toggleAttribute('checked', control.checked);
    else if (control.tagName === 'SELECT') [...twin.options].forEach((option, j) => option.toggleAttribute('selected', control.options[j].selected));
    else if (control.tagName === 'TEXTAREA') twin.textContent = control.value;
    else if (control.tagName === 'INPUT') twin.setAttribute('value', control.value);
    twin.setAttribute('disabled', '');
  });
  return copy.innerHTML;
}

function reportCell(cell) {
  if (cell.type === 'markdown') return `<section class="prose">${markdown.render(cell.code)}</section>`;
  if (cell.type === 'note') {
    const answer = (work.notes[cell.id] ?? '').trim();
    return `<section class="note"><div class="note-prompt">${markdown.render(cell.code)}</div><p class="report-answer${answer ? '' : ' empty'}">${answer ? escapeHtml(answer) : 'No answer yet.'}</p></section>`;
  }
  const guess = work.guesses[cell.id];
  const changed = cell.added || cell.code !== templateById.get(cell.id).code;
  const label = cell.added ? 'YOUR EXPERIMENT' : changed ? 'EXPERIMENT · code edited' : 'EXPERIMENT';
  const guessLine = cell.guess ? `<p class="guess-made">${escapeHtml(cell.guess)} ${guess ? `Your guess: ${escapeHtml(guess)}` : 'No guess yet.'}</p>` : '';
  const output = cell.guess && !guess ? '<p class="report-answer empty">Result hidden until a guess is made.</p>' : snapshot(cell.state.root);
  return `<section class="code-cell"><div class="cell-bar"><strong>${label}</strong></div>${guessLine}<details${changed ? ' open' : ''}><summary>Code</summary><pre>${escapeHtml(cell.code)}</pre></details><div class="output">${output}</div></section>`;
}

function reportHtml() {
  const css = [...document.styleSheets].flatMap(sheet => {
    try { return [...sheet.cssRules].map(rule => rule.cssText); } catch { return []; }
  }).join('\n');
  const student = work.student.trim() || 'No name given';
  const body = chapters.map((title, index) =>
    `<h2 class="report-chapter">Chapter ${index + 1} · ${escapeHtml(title)}</h2>` + cells.filter(cell => cell.chapter === index).map(reportCell).join('\n')
  ).join('\n');
  // The saved work is also embedded as data so "Open saved work" can load it again.
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Titanic Lab · ${escapeHtml(student)}</title>\n<style>${css.replace(/<\/style/gi, '<\\/style')}</style>\n</head>\n<body class="report">\n<header><span class="brand">TITANIC<span>LAB / REPORT</span></span><div class="report-meta"><strong>${escapeHtml(student)}</strong><span>Saved ${escapeHtml(new Date().toLocaleString())}</span></div></header>\n<main id="cells">\n${body}\n</main>\n<script type="application/json" id="titanic-lab-work">${JSON.stringify(work).replace(/</g, '\\u003c')}</script>\n</body>\n</html>\n`;
}

$('#run-all').onclick = () => {
  for (const cell of cells) if (cell.type === 'js') run(cell);
  $('#lesson-status').textContent = 'Lesson loaded · explore the chapters';
};
$('#add-top').onclick = () => add();
$('#add-bottom').onclick = () => add();
$('#download').onclick = () => {
  const name = work.student.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  const url = URL.createObjectURL(new Blob([reportHtml()], {type: 'text/html'}));
  const link = document.createElement('a'); link.href = url; link.download = `titanic-lab-${name || 'report'}.html`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('#open').onclick = () => $('#open-file').click();
$('#open-file').onchange = async event => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  try {
    const [, data] = /<script type="application\/json" id="titanic-lab-work">([\s\S]*?)<\/script>/.exec(await file.text());
    const opened = normalizeWork(JSON.parse(data));
    if (!confirm('Replace the work in this browser with the work from this file?')) return;
    localStorage.setItem(storageKey, JSON.stringify(opened));
    location.reload();
  } catch { $('#saved').textContent = 'That file is not a Titanic Lab report'; }
};
$('#reset-lesson').onclick = () => {
  if (!confirm('Start the lesson again? This erases your code changes, answers, and guesses in this browser. Use Save my work first if you want to keep them.')) return;
  Object.keys(localStorage).filter(key => key.startsWith('titanic-lab')).forEach(key => localStorage.removeItem(key));
  location.reload();
};
$('#student').value = work.student;
$('#student').addEventListener('input', event => { work.student = event.target.value; save(); });

// Each chapter button counts the answer boxes and guesses completed in that chapter.
function updateProgress() {
  document.querySelectorAll('#chapters button').forEach((button, index) => {
    const tasks = cells.filter(cell => cell.chapter === index && (cell.type === 'note' || cell.guess));
    const done = tasks.filter(cell => (cell.type === 'note' ? work.notes[cell.id] : work.guesses[cell.id])?.trim()).length;
    button.querySelector('small').textContent = tasks.length ? (done === tasks.length ? '✓ all answered' : `${done} of ${tasks.length} answered`) : '';
  });
}
function showChapter(index, {scroll = true} = {}) {
  activeChapter = work.chapter = index;
  cells.forEach(cell => cell.element.hidden = cell.chapter !== index);
  document.querySelectorAll('#chapters button').forEach((button, i) => button.setAttribute('aria-current', String(i === index)));
  $('#chapter-label').textContent = `CHAPTER ${index + 1} OF ${chapters.length} / ${chapters[index]}`;
  $('#previous').disabled = index === 0;
  $('#next').disabled = index === chapters.length - 1;
  document.body.classList.toggle('first-chapter', index === 0);
  save();
  if (!scroll) return;
  // Start each chapter at its top, just below the chapter buttons when they stay on screen.
  const nav = $('#chapters');
  const offset = getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
  const top = $('.lesson-intro').getBoundingClientRect().top + scrollY - offset - 12;
  scrollTo({top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
}

cells.forEach(cell => renderCell(cell));
chapters.forEach((title, index) => {
  const button = document.createElement('button');
  const label = document.createElement('span');
  label.textContent = `${String(index + 1).padStart(2, '0')}  ${title}`;
  button.append(label, document.createElement('small'));
  button.onclick = () => showChapter(index);
  $('#chapters').appendChild(button);
});
$('#previous').onclick = () => showChapter(activeChapter - 1);
$('#next').onclick = () => showChapter(activeChapter + 1);
showChapter(activeChapter, {scroll: false});
$('#run-all').click();
