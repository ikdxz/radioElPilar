const playPauseBtn = document.getElementById('play-pause');
const rewindBtn = document.getElementById('rewind');
const fastForwardBtn = document.getElementById('fast-forward');

// radio.js

const STREAM_URL    = 'http://192.168.0.23:8000/stream';
const FALLBACK_URL  = '/audio/lofi.mp3';
const INFO_ENDPOINT = '/program-info';
const POLL_INTERVAL = 10000; // 10s

// Elementos del DOM
const audioPlayer        = document.getElementById('audio-player');
const titleEl            = document.getElementById('program-title');
const descEl             = document.getElementById('program-description');
const imageEl            = document.getElementById('program-image');

/**
 * Carga la información del programa y actualiza UI + audio
 */
let setSyncedStartTime = null;
let handlePodcastEnded = null;

async function actualizarPrograma() {
  try {
    const res  = await fetch(INFO_ENDPOINT);
    const data = await res.json();

    // 1) Actualizar UI
    titleEl.textContent = data.title || '';
    descEl.textContent  = data.description || '';
    if (data.image) {
      imageEl.src = data.image + '?v=' + Date.now();
    }

    // 2) Determinar modo deseado
    let desiredMode, audioSrc;
    if (data.mode === 'stream' || data.streamActive) {
      desiredMode = 'stream';
      audioSrc    = STREAM_URL;
    } else if (data.mode === 'podcast') {
      desiredMode = 'podcast';
      audioSrc    = data.audio;
    } else {
      desiredMode = 'fallback';
      audioSrc    = FALLBACK_URL;
    }

    const currentMode = audioPlayer.getAttribute('data-mode');
    // Recarga stream siempre
    if (desiredMode === 'stream') {
      // no hacemos return, sigue al reload
    }
    // Re-sincronizar podcast si no cambió de modo
    else if (desiredMode === 'podcast' && currentMode === 'podcast') {
      syncPodcastPosition(data);
      return;
    }
    // Evitar recarga inútil en fallback
    else if (desiredMode === 'fallback' && currentMode === 'fallback') {
      return;
    }

    // 3) Quitamos listeners de modo previo
    if (setSyncedStartTime) {
      audioPlayer.removeEventListener('loadedmetadata', setSyncedStartTime);
      setSyncedStartTime = null;
    }
    if (handlePodcastEnded) {
      audioPlayer.removeEventListener('ended', handlePodcastEnded);
      handlePodcastEnded = null;
    }

    // 4) Configuramos según modo
    audioPlayer.loop = (desiredMode === 'fallback');
    audioPlayer.src  = audioSrc;
    audioPlayer.setAttribute('data-mode', desiredMode);

    if (desiredMode === 'stream') {
      // Reactivar controles
      rewindBtn.disabled      = false;
      fastForwardBtn.disabled = false;

    } else if (desiredMode === 'podcast') {
      // Desactivar controles
      rewindBtn.disabled      = true;
      fastForwardBtn.disabled = true;

      // Listener para cuando termine el podcast
      handlePodcastEnded = async () => {
        console.log('Podcast terminado — pidiendo limpieza al servidor');
        try {
          const resp = await fetch('/clear-podcast', { method: 'POST' });
          if (!resp.ok) throw new Error(`Status ${resp.status}`);
          // Tras limpiar, recargamos el estado para volver al offline/directo
          await actualizarPrograma();
        } catch (err) {
          console.error('No se pudo limpiar podcast:', err);
        }
      };
      audioPlayer.addEventListener('ended', handlePodcastEnded);

      // Sincronizar la posición inicial justo antes de play
      syncPodcastPosition(data);

    } else {
      // fallback LoFi: sincronizar con el reloj
      rewindBtn.disabled      = false;
      fastForwardBtn.disabled = false;

      setSyncedStartTime = () => {
        const dur     = audioPlayer.duration;
        const now     = new Date();
        const secs    = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        audioPlayer.currentTime = secs % dur;
      };
      audioPlayer.addEventListener('loadedmetadata', setSyncedStartTime);
    }

    // 5) Carga y reproducción
    await audioPlayer.load();
    await audioPlayer.play().catch(e => console.warn('play() falló:', e));

  } catch (err) {
    console.error('Error al actualizar programa:', err);
  }
}



// Sincroniza la posición del podcast según serverTime y schedule
function syncPodcastPosition(data) {
  if (!data.schedule || !data.serverTime) return;
  const nowMs   = new Date(data.serverTime).getTime();
  const startMs = new Date(data.schedule).getTime();
  const elapsed = Math.max(0, (nowMs - startMs) / 1000);
  audioPlayer.currentTime = elapsed;
}

// Inicialización al cargar página
window.addEventListener('DOMContentLoaded', () => {
  audioPlayer.setAttribute('data-mode', 'none');
  actualizarPrograma();
  setInterval(actualizarPrograma, POLL_INTERVAL);
});

// Play / pause
playPauseBtn.addEventListener('click', () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.innerHTML = `<i class='bx bx-pause'></i>`;
  } else {
    audioPlayer.pause();
    playPauseBtn.innerHTML = `<i class='bx bx-play'></i>`;
  }
});

// Adelantar / retroceder (solo funciona fuera de podcast)
rewindBtn.addEventListener('click', () => {
  audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 10);
});
fastForwardBtn.addEventListener('click', () => {
  audioPlayer.currentTime = Math.min(audioPlayer.duration, audioPlayer.currentTime + 10);
});

// Actualizar icono al cambiar estado
audioPlayer.addEventListener('pause', () => {
  playPauseBtn.innerHTML = `<i class='bx bx-play'></i>`;
});
audioPlayer.addEventListener('play', () => {
  playPauseBtn.innerHTML = `<i class='bx bx-pause'></i>`;
});
