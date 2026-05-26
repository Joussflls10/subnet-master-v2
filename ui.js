/***********************************
 * SubnetMaster v2 — UI Framework
 * Section 2: State, Sidebar, Loader,
 * Exercise System, & Celebration
 ***********************************/

/* ───── State ───── */
// TOTAL will be set by lesson data script

let state = {
  current: 1,
  completed: new Set(),
  wrongAttempts: {}
};

function load() {
  try {
    const raw = localStorage.getItem('subnet_v2_progress');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.current === 'number') state.current = parsed.current;
      if (Array.isArray(parsed.completed)) {
        state.completed = new Set(parsed.completed);
      }
      if (parsed.wrongAttempts && typeof parsed.wrongAttempts === 'object') {
        state.wrongAttempts = parsed.wrongAttempts;
      }
    }
  } catch (e) {
    console.warn('subnet v2: failed to load progress', e);
  }
}

function save() {
  try {
    localStorage.setItem('subnet_v2_progress', JSON.stringify({
      current: state.current,
      completed: Array.from(state.completed),
      wrongAttempts: state.wrongAttempts
    }));
  } catch (e) {
    console.warn('subnet v2: failed to save progress', e);
  }
}

/* ───── DOM refs ───── */
const $ = (sel) => document.querySelector(sel);

const els = {
  sidebar:         document.getElementById('sidebar'),
  contentInner:    document.getElementById('content-inner'),
  exerciseArea:    document.getElementById('exercise-area'),
  nextArea:        document.getElementById('next-area'),
  nextBtn:         document.getElementById('next-btn'),
  nextTitle:       document.getElementById('next-title'),
  progressFill:    document.getElementById('progress-fill'),
  progressPct:     document.getElementById('progress-pct'),
  celebration:     document.getElementById('celebration'),
  sidebarToggle:   document.getElementById('sidebar-toggle')
};

/* ───── Sidebar ───── */
function renderSidebar() {
  if (!els.sidebar || typeof MODULES === 'undefined') return;

  let html = '';
  let globalLessonNum = 0;

  MODULES.forEach((mod, modIdx) => {
    html += `<div class="mod-group" data-mod="${modIdx}">`;
    html +=   `<div class="mod-title">${escapeHtml(mod.title)}</div>`;
    html +=   `<ul class="mod-list">`;

    mod.lessons.forEach((lesson, lessonIdx) => {
      globalLessonNum++;
      const isActive  = globalLessonNum === state.current;
      const isDone    = state.completed.has(globalLessonNum);
      const isLocked  = globalLessonNum > 1 && !state.completed.has(globalLessonNum - 1);

      let icon = '';
      if (isDone)   icon = '✅';
      else if (isLocked) icon = '🔒';
      else               icon = `<span class="lesson-num-circle">${globalLessonNum}</span>`;

      const cls = ['lesson-btn'];
      if (isActive) cls.push('active');
      if (isDone)   cls.push('completed');
      if (isLocked) cls.push('locked');

      html += '<li class="' + cls.join(' ') + '">' +
                '<button onclick="loadLesson(' + globalLessonNum + ')" ' + (isLocked ? 'disabled' : '') + '>' +
                  icon + ' ' + escapeHtml(lesson.title) +
                '</button></li>';
    });

    html +=   `</ul>`;
    html += `</div>`;
  });

  els.sidebar.innerHTML = html;
}

/* ───── Lesson Loader ───── */
function loadLesson(id) {
  if (id < 1 || id > TOTAL) return;
  state.current = id;
  save();

  // clear previous content & exercise
  els.contentInner.innerHTML = '';
  els.exerciseArea.innerHTML = '';
  els.exerciseArea.style.display = 'none';
  els.nextArea.style.display = 'none';
  window._exerciseData = null;

  // find lesson data
  let targetLesson = null;
  let globalNum = 0;
  outer: for (const mod of MODULES) {
    for (const l of mod.lessons) {
      globalNum++;
      if (globalNum === id) { targetLesson = l; break outer; }
    }
  }
  if (!targetLesson) return;

  // render steps
  const steps = targetLesson.steps || [];
  steps.forEach((step, idx) => {
    els.contentInner.insertAdjacentHTML('beforeend', renderStep(step, idx, steps.length));
  });

  // wire demo events AFTER DOM injection
  steps.forEach((step, idx) => {
    if (step.type === 'demo' && typeof step.init === 'function') {
      step.init();
    }
  });

  // init exercise if the last step is one
  if (steps.length > 0 && steps[steps.length - 1].type === 'exercise') {
    setTimeout(initExercise, 50);
  }

  updateProgress();
  renderSidebar();
  scrollToTop();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (els.contentInner) els.contentInner.scrollTop = 0;
}

/* ───── Step Renderer ───── */
function renderStep(step, index, totalSteps) {
  const stepNum = index + 1;
  let cardBody = '';

  switch (step.type) {
    case 'explain':
      cardBody = `<div class="info-card">${step.html || ''}</div>`;
      break;
    case 'demo':
      cardBody = `<div class="demo-card">${step.html || ''}</div>`;
      break;
    case 'exercise':
      cardBody = `<div class="exercise-card">${step.html || ''}</div>`;
      break;
    default:
      cardBody = `<div class="info-card">${step.html || ''}</div>`;
  }

  return `<div class="step" data-step="${index}" data-type="${step.type}">` +
           `<div class="step-header">` +
             `<span class="step-num-circle">${stepNum}</span>` + ' ' +
             `<span class="step-label">${escapeHtml(step.label || step.type)}</span>` +
             `<span class="step-meta">${stepNum}/${totalSteps}</span>` +
           `</div>` +
           `<div class="step-body">${cardBody}</div>` +
         `</div>`;
}

/* ───── Progress ───── */
function updateProgress() {
  const done = state.completed.size;
  const pct  = Math.round((done / TOTAL) * 100);
  if (els.progressFill) els.progressFill.style.width = pct + '%';
  if (els.progressPct)  els.progressPct.textContent = pct + '%';
}

/* ───── Exercise System ───── */
function initExercise() {
  // find exercise step
  const lastStepCard = els.contentInner.querySelector('.step[data-type="exercise"]');
  if (!lastStepCard) return;

  // retrieve lesson object to call generate()
  let targetLesson = null;
  let globalNum = 0;
  outer: for (const mod of MODULES) {
    for (const l of mod.lessons) {
      globalNum++;
      if (globalNum === state.current) { targetLesson = l; break outer; }
    }
  }
  if (!targetLesson) return;

  const steps = targetLesson.steps || [];
  const exerciseStep = steps[steps.length - 1];
  if (!exerciseStep || exerciseStep.type !== 'exercise' || typeof exerciseStep.generate !== 'function') return;

  const data = exerciseStep.generate();
  window._exerciseData = data;

  // render exercise UI into #exercise-area
  let html = `<div class="exercise-box">`;
  html +=    `<div class="question">${data.question || ''}</div>`;
  html +=    `<div class="fields">`;

  data.fields.forEach((f) => {
    html +=  `<div class="field-wrap">` +
               `<label for="ex-${f.id}">${escapeHtml(f.label)}</label>` +
               `<input type="text" id="ex-${f.id}" class="ex-input" autocomplete="off" spellcheck="false">` +
             `</div>`;
  });

  html +=    `</div>`;
  html +=    `<div class="ex-actions">` +
               `<button id="check-btn" class="btn btn-primary">Check</button>` +
               `<button id="hint-btn" class="btn btn-hint" style="display:none">Hint</button>` +
             `</div>`;
  html +=    `<div id="feedback" class="feedback" style="display:none"></div>`;
  html +=  `</div>`;

  els.exerciseArea.innerHTML = html;
  els.exerciseArea.style.display = 'block';

  // attach listeners
  const checkBtn = document.getElementById('check-btn');
  const hintBtn  = document.getElementById('hint-btn');
  if (checkBtn) checkBtn.addEventListener('click', checkExercise);
  if (hintBtn)  hintBtn.addEventListener('click', showHint);

  // allow Enter key
  const inputs = els.exerciseArea.querySelectorAll('input[type="text"]');
  inputs.forEach((inp) => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkExercise();
    });
  });
}

function checkExercise() {
  if (!window._exerciseData) return;

  const data = window._exerciseData;
  const fields = data.fields;
  const feedbackEl = document.getElementById('feedback');
  const hintBtn    = document.getElementById('hint-btn');

  let allCorrect = true;
  const wrongIds = [];

  fields.forEach((f) => {
    const el = document.getElementById(`ex-${f.id}`);
    if (!el) return;
    const val = el.value.trim();
    const ok = typeof f.check === 'function' ? f.check(val) : false;
    el.classList.remove('correct', 'wrong');
    if (ok) {
      el.classList.add('correct');
    } else {
      el.classList.add('wrong');
      allCorrect = false;
      wrongIds.push(f.id);
    }
  });

  if (allCorrect) {
    // passed
    if (feedbackEl) {
      feedbackEl.className = 'feedback pass';
      feedbackEl.style.display = 'block';
      feedbackEl.textContent = data.successMsg || 'Correct! Great job.';
    }

    // mark complete
    if (!state.completed.has(state.current)) {
      state.completed.add(state.current);
      save();
      updateProgress();
      renderSidebar();
    }

    celebrate();
    showNextButton();
    if (hintBtn) hintBtn.style.display = 'none';
  } else {
    // failed
    if (feedbackEl) {
      feedbackEl.className = 'feedback fail';
      feedbackEl.style.display = 'block';
      feedbackEl.textContent = data.failMsg || 'Not quite — try again.';
    }

    // track wrong attempts
    const lessonId = state.current;
    state.wrongAttempts[lessonId] = (state.wrongAttempts[lessonId] || 0) + 1;
    save();

    // show hint button after 3 tries
    if (hintBtn && state.wrongAttempts[lessonId] >= 3) {
      hintBtn.style.display = 'inline-block';
    }
  }
}

function showHint() {
  if (!window._exerciseData) return;
  const data = window._exerciseData;
  const feedbackEl = document.getElementById('feedback');
  if (data.hint && feedbackEl) {
    feedbackEl.style.display = 'block';
    feedbackEl.innerHTML += `<div class="hint-text">💡 Hint: ${escapeHtml(data.hint)}</div>`;
  }
}

function showNextButton() {
  if (!els.nextArea || !els.nextTitle) return;
  let nextId = state.current + 1;
  if (nextId > TOTAL) {
    els.nextArea.style.display = 'none';
    return;
  }

  let nextTitle = 'Finish';
  let globalNum = 0;
  outer: for (const mod of MODULES) {
    for (const l2 of mod.lessons) {
      globalNum++;
      if (globalNum === nextId) { nextTitle = l2.title; break outer; }
    }
  }

  els.nextTitle.textContent = nextTitle;
  els.nextArea.style.display = 'block';
  els.nextBtn.onclick = nextLesson;

  // auto-scroll if needed
  setTimeout(() => {
    els.nextArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/* ───── Celebration ───── */
function celebrate() {
  if (!els.celebration) return;
  const colors = ['#ff595e','#ffca3a','#8ac926','#1982c4','#6a4c93','#f72585','#4cc9f0'];
  const count  = Math.floor(Math.random() * 31) + 50; // 50–80

  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = 'confetti';
    d.style.left = Math.random() * 100 + 'vw';
    d.style.top  = '-10px';
    d.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    d.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    d.style.width  = (Math.random() * 8 + 6) + 'px';
    d.style.height = (Math.random() * 8 + 6) + 'px';
    d.style.position = 'fixed';
    d.style.zIndex = '9999';
    d.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    els.celebration.appendChild(d);
  }

  setTimeout(() => {
    els.celebration.innerHTML = '';
  }, 3000);
}

/* ───── Next Lesson ───── */
function nextLesson() {
  // clear exercise and next area before loading next lesson
  els.exerciseArea.innerHTML = '';
  els.exerciseArea.style.display = 'none';
  els.nextArea.style.display = 'none';
  window._exerciseData = null;

  const nextId = state.current + 1;
  if (nextId <= TOTAL) {
    loadLesson(nextId);
  }
}

/* ───── Sidebar Toggle ───── */
if (els.sidebarToggle) {
  els.sidebarToggle.addEventListener('click', () => {
    document.body.classList.toggle('sidebar-open');
  });
}

/* ───── Utility ───── */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Boot code is in the lesson data script block (script 3)
