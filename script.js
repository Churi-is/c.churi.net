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
  });
}
function loadTrack(index, autoplay) {
  currentIndex = (index + playlist.length) % playlist.length; // wraps around both directions
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
closeBtn.addEventListener('click', () => {
  widget.pause();
  win.style.display = 'none';
});

// Volume slider: 0-100, feeds straight into the SoundCloud widget API
volumeSlider.addEventListener('input', () => {
  const vol = Number(volumeSlider.value);
  widget.setVolume(vol);
  volumeIcon.textContent = vol === 0 ? '🔇' : (vol < 50 ? '🔉' : '🔊');
});

/* ===== SHOYAN construction window controls =====
   The GIF itself opens YouTube via the wrapping <a> tag in index.html,
   so we only need to wire up the XP-style minimize / close buttons here. */
const shoyanWin = document.getElementById('xpShoyan');
const shoyanMinBtn = document.getElementById('shoyanMinBtn');
const shoyanCloseBtn = document.getElementById('shoyanCloseBtn');

if (shoyanMinBtn) {
  shoyanMinBtn.addEventListener('click', () => {
    shoyanWin.classList.toggle('minimized');
  });
}
if (shoyanCloseBtn) {
  shoyanCloseBtn.addEventListener('click', () => {
    shoyanWin.style.display = 'none';
  });
}