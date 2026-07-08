const TASKBAR_HEIGHT = 30;
let topZ = 100;

const windowMeta = {
  xpShoyan:        { icon: '🔨', title: 'SHOYAN' },
  xpMc:            { icon: '🟩', title: 'play.lemoncloud.org' },
  xpPlayer:        { icon: '🎵', getTitle: () => document.getElementById('xpTitlebarText').textContent || 'now_playing.mp3' },
  xpTestimonials:  { icon: '💬', title: 'ai_testimonials.txt' }
};

const closedWindows = new Set();
const tbTray = document.getElementById('tbTray');

function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
}

function closeWindow(win) {
  const id = win.id;
  if (!windowMeta[id]) return;
  if (id === 'xpPlayer') widget.pause();
  win.classList.add('closed');
  closedWindows.add(id);
  renderTray();
}

function restoreWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('closed');
  closedWindows.delete(id);
  bringToFront(win);
  renderTray();
}

function getWindowTitle(id) {
  const meta = windowMeta[id];
  if (!meta) return id;
  return meta.getTitle ? meta.getTitle() : meta.title;
}

function renderTray() {
  tbTray.innerHTML = '';
  closedWindows.forEach(id => {
    const meta = windowMeta[id];
    if (!meta) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tb-item';
    btn.title = `Restore ${getWindowTitle(id)}`;
    btn.innerHTML =
      `<span class="tb-item-icon">${meta.icon}</span>` +
      `<span class="tb-item-label"></span>`;
    btn.querySelector('.tb-item-label').textContent = getWindowTitle(id);
    btn.addEventListener('click', () => restoreWindow(id));
    tbTray.appendChild(btn);
  });
}

function makeDraggable(win) {
  const titlebar = win.querySelector('.xp-titlebar');
  if (!titlebar) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;
  let movedToExplicitPos = false;

  titlebar.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.xp-titlebar-buttons')) return;
    if (win.classList.contains('closed')) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    if (!movedToExplicitPos) {
      const rect = win.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      win.style.left = startLeft + 'px';
      win.style.top = startTop + 'px';
      win.style.right = 'auto';
      win.style.bottom = 'auto';
      movedToExplicitPos = true;
    } else {
      startLeft = parseFloat(win.style.left) || 0;
      startTop  = parseFloat(win.style.top)  || 0;
    }

    win.classList.add('dragging');
    bringToFront(win);
    try { titlebar.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  titlebar.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newLeft = startLeft + dx;
    let newTop  = startTop  + dy;

    newTop = Math.max(0, Math.min(newTop, window.innerHeight - TASKBAR_HEIGHT - 24));
    newLeft = Math.min(newLeft, window.innerWidth - 40);
    newLeft = Math.max(newLeft, 40 - win.offsetWidth);

    win.style.left = newLeft + 'px';
    win.style.top  = newTop  + 'px';
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    win.classList.remove('dragging');
    try { titlebar.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  titlebar.addEventListener('pointerup', endDrag);
  titlebar.addEventListener('pointercancel', endDrag);
}

['xpShoyan', 'xpMc', 'xpPlayer', 'xpTestimonials'].forEach(id => {
  const w = document.getElementById(id);
  if (w) {
    makeDraggable(w);
    w.addEventListener('pointerdown', () => bringToFront(w));
  }
});

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('tbClock').textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);

const playlist = [
  "https://soundcloud.com/korewamoemoemoe/connection",
  "https://soundcloud.com/telemist/envy",
  "https://soundcloud.com/3xod1a/rayquaza"
];
let currentIndex = 0;
let isPlaying = false;
const iframe = document.getElementById('scPlayer');
const widget = SC.Widget(iframe);
const playBtn = document.getElementById('xpPlayBtn');
const prevBtn = document.getElementById('xpPrevBtn');
const nextBtn = document.getElementById('xpNextBtn');
const win = document.getElementById('xpPlayer');
const minBtn = document.getElementById('xpMinBtn');
const closeBtn = document.getElementById('xpCloseBtn');
const scrubFill = document.getElementById('xpScrubFill');
const titlebarText = document.getElementById('xpTitlebarText');
const trackTitle = document.getElementById('xpTrackTitle');
const trackArtist = document.getElementById('xpTrackArtist');
const artwork = document.getElementById('xpArtwork');
const volumeSlider = document.getElementById('xpVolumeSlider');
const volumeIcon = document.getElementById('xpVolumeIcon');

function refreshNowPlaying() {
  widget.getCurrentSound((sound) => {
    if (!sound) return;
    trackTitle.textContent = sound.title || 'Unknown title';
    trackArtist.textContent = sound.user ? sound.user.username : '';
    titlebarText.textContent = sound.title || 'now_playing.mp3';
    const artUrl = sound.artwork_url || (sound.user ? sound.user.avatar_url : null);
    if (artUrl) {
      artwork.style.backgroundImage = `url('${artUrl}')`;
    } else {
      artwork.style.backgroundImage = '';
    }
    renderTray();
  });
}
function loadTrack(index, autoplay) {
  currentIndex = (index + playlist.length) % playlist.length;
  const url = playlist[currentIndex];
  widget.load(url, {
    auto_play: autoplay,
    callback: () => {
      refreshNowPlaying();
      isPlaying = autoplay;
      playBtn.classList.toggle('playing', autoplay);
      scrubFill.style.width = '0%';
      widget.setVolume(Number(volumeSlider.value));
    }
  });
}
widget.bind(SC.Widget.Events.READY, () => {
  refreshNowPlaying();
  widget.setVolume(Number(volumeSlider.value));
});
playBtn.addEventListener('click', () => {
  if (isPlaying) {
    widget.pause();
  } else {
    widget.play();
  }
});
prevBtn.addEventListener('click', () => loadTrack(currentIndex - 1, true));
nextBtn.addEventListener('click', () => loadTrack(currentIndex + 1, true));
widget.bind(SC.Widget.Events.PLAY, () => {
  isPlaying = true;
  playBtn.classList.add('playing');
});
widget.bind(SC.Widget.Events.PAUSE, () => {
  isPlaying = false;
  playBtn.classList.remove('playing');
});
widget.bind(SC.Widget.Events.FINISH, () => {
  loadTrack(currentIndex + 1, true);
});
widget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
  scrubFill.style.width = data.relativePosition * 100 + '%';
});
minBtn.addEventListener('click', () => {
  win.classList.toggle('minimized');
});
closeBtn.addEventListener('click', () => closeWindow(win));

volumeSlider.addEventListener('input', () => {
  const vol = Number(volumeSlider.value);
  widget.setVolume(vol);
  volumeIcon.textContent = vol === 0 ? '🔇' : (vol < 50 ? '🔉' : '🔊');
});

const shoyanWin = document.getElementById('xpShoyan');
const shoyanMinBtn = document.getElementById('shoyanMinBtn');
const shoyanCloseBtn = document.getElementById('shoyanCloseBtn');

if (shoyanMinBtn) {
  shoyanMinBtn.addEventListener('click', () => shoyanWin.classList.toggle('minimized'));
}
if (shoyanCloseBtn) {
  shoyanCloseBtn.addEventListener('click', () => closeWindow(shoyanWin));
}

const testimonialsWin       = document.getElementById('xpTestimonials');
const testimonialsMinBtn    = document.getElementById('testimonialsMinBtn');
const testimonialsCloseBtn  = document.getElementById('testimonialsCloseBtn');

if (testimonialsMinBtn) {
  testimonialsMinBtn.addEventListener('click', () => testimonialsWin.classList.toggle('minimized'));
}
if (testimonialsCloseBtn) {
  testimonialsCloseBtn.addEventListener('click', () => closeWindow(testimonialsWin));
}

const MC_SERVER = 'play.lemoncloud.org';
const mcWin       = document.getElementById('xpMc');
const mcMinBtn    = document.getElementById('mcMinBtn');
const mcCloseBtn  = document.getElementById('mcCloseBtn');
const mcStatusEl  = document.getElementById('mcStatus');
const mcPlayersEl = document.getElementById('mcPlayers');
const mcMotdEl    = document.getElementById('mcMotd');
const mcIconEl    = document.getElementById('mcIcon');

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[c]);
}

function setOffline(msg) {
  mcStatusEl.textContent = msg || 'Offline';
  mcStatusEl.className = 'mc-value mc-offline';
}

async function refreshMcStatus() {
  const url = `https://api.mcsrvstat.us/3/${encodeURIComponent(MC_SERVER)}?t=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.online) {
      setOffline('Offline');
      mcPlayersEl.textContent = '--';
      mcMotdEl.innerHTML       = '';
      return;
    }
    mcStatusEl.textContent = 'Online';
    mcStatusEl.className   = 'mc-value mc-online';

    const online = data.players?.online ?? 0;
    const max    = data.players?.max    ?? 0;
    mcPlayersEl.textContent = `${online} / ${max}`;

    if (data.icon) {
      mcIconEl.style.backgroundImage = `url('${data.icon}')`;
    }

    const motdLines = data.motd?.clean || [];
    mcMotdEl.innerHTML = motdLines
      .map(line => `<div>${escapeHtml(line) || '&nbsp;'}</div>`)
      .join('');
  } catch (e) {
    console.error('MC status fetch failed:', e);
    setOffline('Error');
  }
}

if (mcMinBtn) {
  mcMinBtn.addEventListener('click', () => mcWin.classList.toggle('minimized'));
}
if (mcCloseBtn) {
  mcCloseBtn.addEventListener('click', () => closeWindow(mcWin));
}

refreshMcStatus();
setInterval(refreshMcStatus, 60000);

const fumo = document.getElementById('fumo');
let fumoDragging = false;
let fumoStartX = 0, fumoStartY = 0;
let fumoStartLeft = 0, fumoStartTop = 0;
let fumoMoved = false;

fumo.addEventListener('pointerdown', (e) => {
  fumoDragging = true;
  fumoStartX = e.clientX;
  fumoStartY = e.clientY;
  if (!fumoMoved) {
    const rect = fumo.getBoundingClientRect();
    fumoStartLeft = rect.left;
    fumoStartTop = rect.top;
    fumo.style.left = fumoStartLeft + 'px';
    fumo.style.top = fumoStartTop + 'px';
    fumo.style.right = 'auto';
    fumoMoved = true;
  } else {
    fumoStartLeft = parseFloat(fumo.style.left) || 0;
    fumoStartTop = parseFloat(fumo.style.top) || 0;
  }
  fumo.style.cursor = 'grabbing';
  try { fumo.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
});

fumo.addEventListener('pointermove', (e) => {
  if (!fumoDragging) return;
  fumo.style.left = (fumoStartLeft + (e.clientX - fumoStartX)) + 'px';
  fumo.style.top = (fumoStartTop + (e.clientY - fumoStartY)) + 'px';
});

function endFumoDrag(e) {
  if (!fumoDragging) return;
  fumoDragging = false;
  fumo.style.cursor = 'grab';
  try { fumo.releasePointerCapture(e.pointerId); } catch (_) {}
}
fumo.addEventListener('pointerup', endFumoDrag);
fumo.addEventListener('pointercancel', endFumoDrag);

const startBtn = document.getElementById('startBtn');
const startOverlay = document.createElement('div');
startOverlay.id = 'startOverlay';
startOverlay.textContent = '*starts*';
document.body.appendChild(startOverlay);

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('visible');
  setTimeout(() => {
    startOverlay.classList.remove('visible');
  }, 1000);
});
