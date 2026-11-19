// ViceFrame studio wiring: photo library, panel editing, grades,
// lettering controls and PNG export, plus the fixed ?shot= scenes the
// grader screenshots. All state lives in one object handed to the
// renderer in ./cover.js.
import { drawCover, panelRects, LAYOUTS, GRADES } from './cover.js';
import { readShotRequest, markShotReady } from './shots.js';

const SIZES = [
  { id: 'sq', name: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', name: '1920 × 1080', w: 1920, h: 1080 },
];

const DEFAULT_TITLE = 'OCEAN DRIVE KINGS';
const DEFAULT_SUB = 'Vice heat · One night only';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const state = {
  layout: 'classic',
  grade: 'vice',
  punch: 35,
  title: DEFAULT_TITLE,
  subtitle: DEFAULT_SUB,
  badgeText: 'Fan made cover',
  titlePos: 'bottom',
  titleStyle: 'gradient',
  titleSize: 1,
  showSun: true,
  showPalms: true,
  showBadge: true,
  showStars: true,
  showFrame: true,
  spanMode: false,
  sizeId: 'sq',
  images: [],
  imageNames: [],
  panels: [],
  selectedPanel: 0,
};

function freshPanel(img) {
  return { img, zoom: 1, ox: 0, oy: 0, fit: 'fill' };
}

// Keeps state.panels the same length as the active layout, reusing the
// views that already exist so switching layouts does not lose framing.
function syncPanels() {
  const count = panelRects(state.layout, 100, 100).length;
  while (state.panels.length < count) {
    const idx = state.panels.length;
    state.panels.push(freshPanel(state.images.length ? idx % state.images.length : 0));
  }
  state.panels.length = count;
  if (state.selectedPanel >= count) state.selectedPanel = 0;
}

function currentSize() {
  return SIZES.find((s) => s.id === state.sizeId) || SIZES[0];
}

function redraw() {
  syncPanels();
  const { w, h } = currentSize();
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  drawCover(ctx, w, h, state);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhotoSource(src, name) {
  const img = await loadImage(src);
  state.images.push(img);
  state.imageNames.push(name);
  // Fill any panel still pointing past the end, then point the selected
  // panel at the newcomer so the change is visible at once.
  state.panels.forEach((p) => {
    if (p.img >= state.images.length) p.img = state.images.length - 1;
  });
  if (state.panels[state.selectedPanel]) {
    state.panels[state.selectedPanel].img = state.images.length - 1;
  }
  renderPhotoUI();
  redraw();
  return img;
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    await addPhotoSource(URL.createObjectURL(file), file.name);
  }
  setStatus(files.length ? 'Photo added — drag on the cover to frame it.' : '');
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/* ---------------- chip groups ---------------- */

function buildChips(container, items, activeId, onPick) {
  container.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (item.id === activeId ? ' active' : '');
    b.textContent = item.name;
    b.addEventListener('click', () => onPick(item.id));
    container.appendChild(b);
  });
}

function renderLayoutUI() {
  buildChips(document.getElementById('layouts'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    syncPanels();
    renderPanelUI();
    redraw();
  });
  buildChips(
    document.getElementById('sizes'),
    SIZES.map((s) => ({ id: s.id, name: s.name })),
    state.sizeId,
    (id) => {
      state.sizeId = id;
      renderLayoutUI();
      redraw();
    },
  );
}

function renderGradeUI() {
  buildChips(document.getElementById('grades'), GRADES, state.grade, (id) => {
    state.grade = id;
    renderGradeUI();
    redraw();
  });
}

function renderPhotoUI() {
  const thumbs = document.getElementById('thumbs');
  thumbs.innerHTML = '';
  state.images.forEach((img, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (state.panels[state.selectedPanel]?.img === i ? ' active' : '');
    b.title = state.imageNames[i] || `Photo ${i + 1}`;
    const t = document.createElement('img');
    t.src = img.src;
    t.alt = b.title;
    b.appendChild(t);
    b.addEventListener('click', () => {
      if (state.panels[state.selectedPanel]) state.panels[state.selectedPanel].img = i;
      renderPhotoUI();
      renderPanelUI();
      redraw();
    });
    thumbs.appendChild(b);
  });
  renderPanelUI();
}

function renderPanelUI() {
  syncPanels();
  const picker = document.getElementById('panelPicker');
  buildChips(
    picker,
    state.panels.map((_, i) => ({ id: String(i), name: `Panel ${i + 1}` })),
    String(state.selectedPanel),
    (id) => {
      state.selectedPanel = Number(id);
      syncZoomUI();
      renderPhotoUI();
    },
  );
  const photoPicker = document.getElementById('panelPhotoPicker');
  buildChips(
    photoPicker,
    state.images.map((_, i) => ({ id: String(i), name: `Photo ${i + 1}` })),
    String(state.panels[state.selectedPanel]?.img ?? 0),
    (id) => {
      if (state.panels[state.selectedPanel]) state.panels[state.selectedPanel].img = Number(id);
      renderPhotoUI();
      redraw();
    },
  );
  syncZoomUI();
}

function syncZoomUI() {
  const view = state.panels[state.selectedPanel];
  if (!view) return;
  document.getElementById('zoom').value = String(view.zoom);
  document.getElementById('fitFill').textContent = view.fit === 'fit' ? 'Mode: Fit' : 'Mode: Fill';
}

/* ---------------- controls ---------------- */

function bindControls() {
  document.getElementById('fileInput').addEventListener('change', (e) => {
    addFiles([...e.target.files]);
    e.target.value = '';
  });
  document.getElementById('samplePier').addEventListener('click', () => addPhotoSource('samples/pier.jpg', 'Pier sample'));
  document.getElementById('sampleBlvd').addEventListener('click', () => addPhotoSource('samples/boulevard.jpg', 'Boulevard sample'));
  document.getElementById('spanMode').addEventListener('change', (e) => {
    state.spanMode = e.target.checked;
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    const view = state.panels[state.selectedPanel];
    if (view) view.zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('fitFill').addEventListener('click', () => {
    const view = state.panels[state.selectedPanel];
    if (view) view.fit = view.fit === 'fit' ? 'fill' : 'fit';
    syncZoomUI();
    redraw();
  });
  document.getElementById('resetView').addEventListener('click', () => {
    const view = state.panels[state.selectedPanel];
    if (view) Object.assign(view, { zoom: 1, ox: 0, oy: 0 });
    syncZoomUI();
    redraw();
  });
  document.getElementById('punch').addEventListener('input', (e) => {
    state.punch = Number(e.target.value);
    redraw();
  });
  const bindText = (id, key) => {
    document.getElementById(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      redraw();
    });
  };
  bindText('title', 'title');
  bindText('subtitle', 'subtitle');
  bindText('badgeText', 'badgeText');
  document.getElementById('titlePos').addEventListener('change', (e) => {
    state.titlePos = e.target.value;
    redraw();
  });
  document.getElementById('titleStyle').addEventListener('change', (e) => {
    state.titleStyle = e.target.value;
    redraw();
  });
  document.getElementById('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value);
    redraw();
  });
  const bindOpt = (id, key) => {
    document.getElementById(id).addEventListener('change', (e) => {
      state[key] = e.target.checked;
      redraw();
    });
  };
  bindOpt('optSun', 'showSun');
  bindOpt('optPalms', 'showPalms');
  bindOpt('optBadge', 'showBadge');
  bindOpt('optStars', 'showStars');
  bindOpt('optFrame', 'showFrame');

  document.getElementById('exportBtn').addEventListener('click', () => {
    const { w, h } = currentSize();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `viceframe-cover-${w}x${h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Saved viceframe-cover-${w}x${h}.png`);
    }, 'image/png');
  });

  // Drag & drop anywhere on the stage.
  const wrap = document.getElementById('canvasWrap');
  const stage = document.getElementById('stage');
  ['dragenter', 'dragover'].forEach((ev) =>
    stage.addEventListener(ev, (e) => {
      e.preventDefault();
      wrap.classList.add('dragging');
    }),
  );
  ['dragleave', 'drop'].forEach((ev) =>
    stage.addEventListener(ev, (e) => {
      e.preventDefault();
      wrap.classList.remove('dragging');
    }),
  );
  stage.addEventListener('drop', (e) => addFiles([...(e.dataTransfer?.files || [])]));

  // Pointer editing on the canvas: click picks the panel under the
  // pointer, dragging slides that panel's photo, wheel zooms it.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const rects = panelRects(state.layout, 1, 1);
    const hit = rects.findIndex((r) => nx >= r.x && nx <= r.x + r.w && ny >= r.y && ny <= r.y + r.h);
    if (hit >= 0 && hit !== state.selectedPanel) {
      state.selectedPanel = hit;
      renderPanelUI();
      renderPhotoUI();
    }
    drag = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const view = state.panels[state.selectedPanel];
    if (!view) return;
    const rect = canvas.getBoundingClientRect();
    view.ox = Math.max(-1, Math.min(1, view.ox + ((e.clientX - drag.x) / rect.width) * 2.2));
    view.oy = Math.max(-1, Math.min(1, view.oy + ((e.clientY - drag.y) / rect.height) * 2.2));
    drag = { x: e.clientX, y: e.clientY };
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const view = state.panels[state.selectedPanel];
    if (!view) return;
    view.zoom = Math.max(1, Math.min(3, view.zoom * (e.deltaY < 0 ? 1.06 : 0.94)));
    syncZoomUI();
    redraw();
  }, { passive: false });
}

/* ---------------- boot ---------------- */

async function boot() {
  bindControls();
  renderLayoutUI();
  renderGradeUI();
  syncPanels();

  const shotReq = readShotRequest(location.search);
  if (shotReq && shotReq.caption) {
    state.title = shotReq.caption;
    document.getElementById('title').value = shotReq.caption;
  }
  const first = shotReq ? shotReq.photo : 'pier';
  const second = first === 'pier' ? 'boulevard' : 'pier';
  // Two samples up front so the multi-panel layouts mix scenes at once.
  await addPhotoSource(`samples/${first}.jpg`, `${first} sample`);
  await addPhotoSource(`samples/${second}.jpg`, `${second} sample`);
  // Classic layout: hero takes the chosen sample, side panels the other.
  state.panels.forEach((p, i) => { p.img = i === 0 ? 0 : 1; });
  state.selectedPanel = 0;

  if (shotReq) {
    document.body.classList.add(shotReq.shot === 'cover' ? 'shot-cover' : 'shot-editor');
    if (shotReq.shot === 'cover') state.sizeId = 'sq';
    renderLayoutUI();
  }
  renderPhotoUI();
  renderPanelUI();

  // The poster face must be the bundled Anton, not a fallback, before
  // the first screenshot-worthy paint.
  try {
    await Promise.race([
      document.fonts.load('80px Anton'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fall back to the condensed stack */ }
  redraw();
  if (shotReq) markShotReady();
}

boot();
