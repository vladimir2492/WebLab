import { NotebookRuntime, observe, FileAttachment } from '@observablehq/notebook-kit/runtime';
import * as Inputs from '@observablehq/inputs';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';
import MarkdownIt from 'markdown-it';
import lessonSource from './lesson.html?raw';

const runtime = new NotebookRuntime({Inputs: () => Inputs, Plot: () => Plot, d3: () => d3, FileAttachment: () => FileAttachment});
const markdown = new MarkdownIt();
const storageKey = 'titanic-editable-notebook-v2';
const host = document.querySelector('#cells');
let cells = [];
let nextId = 100;
const chapters = ['Meet the passengers', 'Find patterns', 'Make your rule', 'Teach a model', 'Try a prediction', 'Your learning board'];
const chapterIds = [[1,32,20,2,33,34,3,4],[5,6,7,8,9,10],[11,12,13,14,15,16,17,18,19],[40,41,42,43,21,22,23,24,25,26,27,35,36,37,44,45,46],[28,29,30],[31]];
let activeChapter = 0;
const lessonDocument = new DOMParser().parseFromString(lessonSource, 'text/html');
const templateCells = [...lessonDocument.querySelectorAll('notebook > script')].map(script => ({
  id: Number(script.id), type: script.type === 'module' ? 'js' : 'markdown',
  code: script.textContent.replace(/^    /gm, '').trim()
}));
const templateIds = templateCells.map(cell => cell.id);

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({templateIds, templateSources: Object.fromEntries(templateCells.map(cell => [cell.id, cell.code])), cells: cells.map(({id, type, code}) => ({id, type, code}))}));
    document.querySelector('#saved').textContent = 'Saved in this browser';
  } catch { document.querySelector('#saved').textContent = 'Browser storage unavailable — download to save'; }
}

function renderCell(cell, before = null) {
  const section = document.createElement('section');
  cell.element = section;
  section.dataset.chapter = cell.chapter ?? activeChapter;
  section.hidden = Number(section.dataset.chapter) !== activeChapter;
  if (cell.type === 'markdown') {
    section.className = 'prose';
    section.innerHTML = markdown.render(cell.code);
  } else {
    section.className = 'code-cell';
    section.dataset.cellId = cell.id;
    section.innerHTML = '<div class="cell-bar"><strong>EXPERIMENT</strong><span class="status">Not run</span><button class="edit" aria-expanded="false">Edit code</button><button class="run">▶ Run</button><button class="add" title="Add a code cell below">+</button><button class="remove" title="Remove this cell">Remove</button></div><textarea hidden spellcheck="false" aria-label="JavaScript code"></textarea><div class="output"></div>';
    const editor = section.querySelector('textarea');
    editor.value = cell.code;
    editor.rows = Math.min(18, Math.max(3, cell.code.split('\n').length));
    if ([41,45].includes(cell.id)) {
      editor.hidden = false;
      section.querySelector('.edit').textContent = 'Hide code';
      section.querySelector('.edit').setAttribute('aria-expanded', 'true');
    }
    cell.state = {root: section.querySelector('.output'), expanded: [], variables: []};
    section.querySelector('.edit').onclick = () => {
      editor.hidden = !editor.hidden;
      section.querySelector('.edit').textContent = editor.hidden ? 'Edit code' : 'Hide code';
      section.querySelector('.edit').setAttribute('aria-expanded', String(!editor.hidden));
      if (!editor.hidden) editor.focus();
    };
    editor.addEventListener('input', () => {
      cell.code = editor.value;
      section.querySelector('.status').textContent = 'Edited — press Run';
      save();
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
    section.querySelector('.remove').onclick = () => {
      cell.state.variables.forEach(variable => variable.delete());
      cells = cells.filter(other => other !== cell);
      section.remove(); save();
    };
  }
  host.insertBefore(section, before);
}

async function run(cell) {
  const button = cell.element.querySelector('.run');
  const status = cell.element.querySelector('.status');
  button.disabled = true;
  status.textContent = 'Running…';
  try {
    const response = await fetch('/api/compile', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({code: cell.code})});
    const compiled = await response.json();
    if (!response.ok) throw new Error(compiled.error);
    // Compile student-authored JavaScript into Observable's cell definition.
    const definition = {...compiled, id: cell.id, body: new Function(`return (${compiled.body});`)()};
    cell.state.variables.forEach(variable => variable.delete());
    cell.state.variables = [];
    runtime.define(cell.state, definition, (state, options) => {
      const observer = observe(state, options);
      return {...observer,
        pending() {observer.pending.call(this); status.textContent = 'Running…';},
        fulfilled(value) {observer.fulfilled.call(this, value); status.textContent = 'Done';},
        rejected(error) {observer.rejected.call(this, error); status.textContent = 'Error';}
      };
    });
  } catch (error) {
    status.textContent = 'Error';
    cell.state.root.replaceChildren();
    const message = document.createElement('pre');
    message.className = 'observablehq--error';
    message.textContent = error.message;
    cell.state.root.appendChild(message);
  } finally {button.disabled = false;}
}

function add(after) {
  const cell = {id: nextId++, type: 'js', chapter: after?.chapter ?? activeChapter, code: '// Try a question about the passengers\npassengers.length'};
  const index = after ? cells.indexOf(after) + 1 : cells.findLastIndex(item => item.chapter === activeChapter) + 1;
  const before = cells[index]?.element ?? null;
  cells.splice(index, 0, cell);
  renderCell(cell, before); save();
  cell.element.querySelector('.edit').click();
}

document.querySelector('#run-all').onclick = async () => {
  const button = document.querySelector('#run-all');
  button.disabled = true;
  document.querySelector('#lesson-status').textContent = 'Running the experiments…';
  try {for (const cell of cells) if (cell.type === 'js') await run(cell);}
  finally {button.disabled = false; document.querySelector('#lesson-status').textContent = 'Lesson loaded · explore the chapters';}
};
document.querySelector('#add-top').onclick = () => add();
document.querySelector('#add-bottom').onclick = () => add();
document.querySelector('#download').onclick = () => {
  const source = '<!doctype html>\n<notebook>\n<title>Titanic learning notebook</title>\n' + cells.map(cell =>
    `<script id="${cell.id}" type="${cell.type === 'js' ? 'module' : 'text/markdown'}"${cell.type === 'js' ? ' pinned' : ''}>\n${cell.code.replace(/<\/script/gi, '<\\/script').split('\n').map(line => '    ' + line).join('\n')}\n</script>`
  ).join('\n') + '\n</notebook>';
  const url = URL.createObjectURL(new Blob([source], {type: 'text/html'}));
  const link = document.createElement('a'); link.href = url; link.download = 'titanic-notebook.html'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
  const savedCells = Array.isArray(saved) ? saved : saved?.cells;
  if (Array.isArray(savedCells) && savedCells.every(cell => Number.isInteger(cell.id) && ['js', 'markdown'].includes(cell.type) && typeof cell.code === 'string')) {
    const previousIds = new Set(saved?.templateIds ?? Array.from({length: 19}, (_, i) => i + 1));
    const savedById = new Map(savedCells.map(cell => [cell.id, cell]));
    const extras = new Map();
    let anchor = null;
    for (const cell of savedCells) {
      if (previousIds.has(cell.id)) anchor = cell.id;
      else { if (!extras.has(anchor)) extras.set(anchor, []); extras.get(anchor).push(cell); }
    }
    cells.push(...(extras.get(null) ?? []));
    for (const template of templateCells) {
      const old = savedById.get(template.id);
      // Refresh lesson explanations, preserve edited code and intentionally removed cells.
      const originalVisitorInputs = 'const visitorClass = view(Inputs.select([1, 2, 3], {label: "Ticket class", value: 3}));\nconst visitorAge = view(Inputs.range([0, 80], {label: "Age in years", value: 25, step: 1}));\nconst visitorSex = view(Inputs.select(["female", "male"], {label: "Recorded sex", value: "female"}));';
      const originalVisitorOutput = 'const visitor = {pclass: visitorClass, age: visitorAge, sex: visitorSex};\nconst visitorPrediction = learned.model.predict(visitor);\ndisplay(`Model prediction: ${visitorPrediction === 1 ? "survival" : "non-survival"}.`);\ndisplay(`Explanation: ${learned.model.question} → ${learned.model.matches(visitor) ? "YES" : "NO"} branch.`);\ndisplay("This is a historical-data classroom model, not a statement about what would happen to a real individual.");';
      const unchanged = old && (old.code === saved?.templateSources?.[template.id] ||
        (template.id === 29 && old.code === originalVisitorInputs) ||
        (template.id === 30 && old.code === originalVisitorOutput));
      if (old || !previousIds.has(template.id)) cells.push(template.type === 'js' && old && !unchanged ? old : {...template});
      cells.push(...(extras.get(template.id) ?? []));
    }
  }
} catch { /* Start from the lesson if saved data is unavailable. */ }
if (!cells.length) {
  cells = templateCells.map(cell => ({...cell}));
}
nextId = Math.max(100, ...cells.map(cell => cell.id + 1));
let lastChapter = 0;
cells.forEach(cell => {
  const chapter = chapterIds.findIndex(ids => ids.includes(cell.id));
  if (chapter >= 0) lastChapter = chapter;
  cell.chapter = lastChapter;
  renderCell(cell);
});
function showChapter(index) {
  activeChapter = index;
  cells.forEach(cell => cell.element.hidden = cell.chapter !== index);
  document.querySelectorAll('#chapters button').forEach((button,i) => button.setAttribute('aria-current', String(i === index)));
  document.querySelector('#chapter-label').textContent = `CHAPTER ${index+1} OF 6 / ${chapters[index]}`;
  document.querySelector('#previous').disabled = index === 0;
  document.querySelector('#next').disabled = index === chapters.length-1;
}
chapters.forEach((title,index) => {
  const button = document.createElement('button');
  button.textContent = `${String(index+1).padStart(2,'0')}  ${title}`;
  button.onclick = () => showChapter(index);
  document.querySelector('#chapters').appendChild(button);
});
document.querySelector('#previous').onclick = () => {showChapter(activeChapter-1); document.querySelector('#chapters').scrollIntoView({behavior:'smooth'});};
document.querySelector('#next').onclick = () => {showChapter(activeChapter+1); document.querySelector('#chapters').scrollIntoView({behavior:'smooth'});};
showChapter(0);
save();
document.querySelector('#run-all').click();
