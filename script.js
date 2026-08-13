// script.js — Biblioteca Noturna com visualizador e reprodução robusta
// Substitui a versão anterior para garantir que a reprodução seja iniciada
// e que o visualizador (AnalyserNode) funcione com os áudios servidos via jsDelivr.

document.addEventListener('DOMContentLoaded', () => {
  const entrarBtn = document.getElementById('entrar');
  const estante = document.getElementById('estante');
  const introducao = document.getElementById('introducao');

  const paginaLivro = document.getElementById('paginaLivro');
  const fecharBtn = document.getElementById('fechar');

  const tituloElem = document.getElementById('tituloLivro');
  const fraseElem = document.getElementById('fraseLivro');
  const numeroElem = document.querySelector('.numero');

  const playBtn = document.getElementById('play');
  const nomeMusicaElem = document.getElementById('nomeMusica');
  const artistaMusicaElem = document.getElementById('artistaMusica');
  const luaMusica = document.getElementById('luaMusica');

  const canvas = document.getElementById('visualizer');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const livros = Array.from(document.querySelectorAll('.livro'));

  // Audio + WebAudio
  let audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.preload = 'none';

  let audioContext = null;
  let sourceNode = null;
  let analyser = null;
  let animationId = null;

  let isSimulatedPlaying = false;
  let activeLivroButton = null;
  let playRequestedBeforeCanPlay = false;

  function ensureAudioContext() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  function setupAnalyserForAudio(a) {
    try {
      if (sourceNode) {
        try { sourceNode.disconnect(); } catch (e) {}
        sourceNode = null;
      }
    } catch (e) {}

    ensureAudioContext();

    try {
      sourceNode = audioContext.createMediaElementSource(a);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (err) {
      // Some browsers may throw (e.g., if element not allowed). Clean fallback: no analyser.
      console.warn('Web Audio setup failed:', err);
      analyser = null;
    }
  }

  function startVisualizer() {
    if (!canvas || !ctx || !analyser) return;
    cancelAnimation();

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      const barCount = Math.min(64, bufferLength);
      const step = Math.floor(bufferLength / barCount);
      const barWidth = Math.max(2, Math.floor(width / barCount) - 2);
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const idx = i * step;
        const v = dataArray[idx] / 255;
        const barHeight = v * height;

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(240,230,255,0.98)');
        grad.addColorStop(0.5, 'rgba(170,80,120,0.9)');
        grad.addColorStop(1, 'rgba(70,20,40,0.6)');
        ctx.fillStyle = grad;

        const y = height - barHeight;
        const radius = Math.min(6, barWidth / 2);
        roundRect(ctx, x, y, barWidth, barHeight, radius, true, false);

        x += barWidth + 4;
      }
    }
    draw();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (r === undefined) r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function cancelAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;
  }

  function stopVisualizer() {
    cancelAnimation();
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function showEstante() {
    if (introducao) introducao.style.display = 'none';
    if (estante) {
      estante.style.display = 'grid';
      estante.setAttribute('aria-hidden', 'false');
    }
  }

  function openPaginaLivro(button) {
    if (!button) return;
    activeLivroButton = button;

    const titulo = button.dataset.titulo || button.textContent.trim();
    const frase = button.dataset.frase || '';
    const musica = button.dataset.musica || '';
    const artista = button.dataset.artista || '';
    const capitulo = button.dataset.capitulo || '1';
    const audioSrc = button.dataset.audio || '';

    if (tituloElem) tituloElem.textContent = titulo;
    if (fraseElem) fraseElem.textContent = frase;
    if (numeroElem) numeroElem.textContent = `Capítulo ${capitulo}`;
    if (nomeMusicaElem) nomeMusicaElem.textContent = musica;
    if (artistaMusicaElem) artistaMusicaElem.textContent = artista;

    if (audioSrc) {
      try { audio.pause(); } catch (e) {}
      audio = new Audio(audioSrc);
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      // prepare analyser but creating source must happen after Audio creation
      try { setupAnalyserForAudio(audio); } catch (e) { console.warn(e); }

      // handle canplay to auto-play if the user already pressed play
      audio.addEventListener('canplay', () => {
        if (playRequestedBeforeCanPlay) {
          playRequestedBeforeCanPlay = false;
          try { audio.play(); } catch (e) { console.warn('play after canplay failed', e); }
        }
      }, { once: true });

      attachAudioHandlers();
    } else {
      try { audio.pause(); } catch (e) {}
      audio = new Audio();
      isSimulatedPlaying = false;
      updatePlayUI(false);
      detachAudioHandlers();
      stopVisualizer();
    }

    if (canvas) {
      const computed = canvas.getBoundingClientRect();
      canvas.width = Math.max(240, Math.floor(computed.width));
      canvas.height = Math.max(48, Math.floor(computed.height));
    }

    if (paginaLivro) {
      paginaLivro.style.display = 'block';
      paginaLivro.setAttribute('aria-hidden', 'false');
      paginaLivro.setAttribute('tabindex', '-1');
      paginaLivro.focus && paginaLivro.focus();
    }
  }

  function closePaginaLivro() {
    try { if (!audio.paused && !audio.ended) audio.pause(); } catch (e) {}
    try { audio.src = ''; } catch (e) {}
    isSimulatedPlaying = false;
    updatePlayUI(false);
    stopLuaAnimation();
    stopVisualizer();

    if (paginaLivro) {
      paginaLivro.style.display = 'none';
      paginaLivro.setAttribute('aria-hidden', 'true');
    }

    if (activeLivroButton) activeLivroButton.focus();
    else if (entrarBtn) entrarBtn.focus();

    activeLivroButton = null;
  }

  function updatePlayUI(playing) {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', String(!!playing));
    playBtn.textContent = playing ? '⏸' : '▶︎';
    if (playing) startLuaAnimation(); else stopLuaAnimation();
  }

  // lua animation
  let luaAnimation = null;
  function startLuaAnimation() {
    if (!luaMusica) return;
    if (luaAnimation) return;
    luaAnimation = luaMusica.animate(
      [{ transform: 'translateY(0px) scale(1)', opacity: 0.9 },
       { transform: 'translateY(-6px) scale(1.04)', opacity: 1 }],
      { duration: 1200, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );
    luaMusica.classList.add('playing');
  }
  function stopLuaAnimation() {
    if (!luaMusica) return;
    if (luaAnimation) { try { luaAnimation.cancel(); } catch (e) {} luaAnimation = null; }
    luaMusica.classList.remove('playing');
  }

  // Events
  if (entrarBtn) {
    entrarBtn.addEventListener('click', (e) => { e.preventDefault(); showEstante(); entrarBtn.blur(); });
  }

  livros.forEach((btn) => btn.addEventListener('click', () => openPaginaLivro(btn)));

  if (fecharBtn) fecharBtn.addEventListener('click', () => closePaginaLivro());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      const isOpen = paginaLivro && paginaLivro.getAttribute('aria-hidden') === 'false';
      if (isOpen) closePaginaLivro();
    }
  });

  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      // resume audio context on user gesture
      try { if (audioContext && audioContext.state === 'suspended') await audioContext.resume(); } catch (e) {}

      if (audio && audio.src) {
        // If the browser hasn't loaded enough data yet, request play after canplay
        if (audio.readyState < 3) { // HAVE_FUTURE_DATA
          playRequestedBeforeCanPlay = true;
        }

        try {
          if (audio.paused) {
            await audio.play();
            updatePlayUI(true);
            if (analyser) startVisualizer();
          } else {
            audio.pause();
            updatePlayUI(false);
            if (analyser) stopVisualizer();
          }
        } catch (err) {
          console.error('audio.play() failed:', err);
          // fallback: try to resume audio context then retry
          try { ensureAudioContext(); audioContext.resume && await audioContext.resume(); await audio.play(); updatePlayUI(true); if (analyser) startVisualizer(); }
          catch (err2) {
            console.error('retry play failed:', err2);
            // visual fallback
            isSimulatedPlaying = !isSimulatedPlaying;
            updatePlayUI(isSimulatedPlaying);
            if (isSimulatedPlaying) startVisualizer(); else stopVisualizer();
          }
        }
      } else {
        isSimulatedPlaying = !isSimulatedPlaying;
        updatePlayUI(isSimulatedPlaying);
      }
    });
  }

  // audio event handlers
  function attachAudioHandlers() {
    if (!audio) return;
    audio.removeEventListener('play', onAudioPlay);
    audio.removeEventListener('pause', onAudioPause);
    audio.removeEventListener('ended', onAudioEnded);
    audio.addEventListener('play', onAudioPlay);
    audio.addEventListener('pause', onAudioPause);
    audio.addEventListener('ended', onAudioEnded);
  }
  function detachAudioHandlers() {
    if (!audio) return;
    audio.removeEventListener('play', onAudioPlay);
    audio.removeEventListener('pause', onAudioPause);
    audio.removeEventListener('ended', onAudioEnded);
  }
  function onAudioPlay() { isSimulatedPlaying = false; updatePlayUI(true); if (analyser) startVisualizer(); }
  function onAudioPause() { updatePlayUI(false); if (analyser) stopVisualizer(); }
  function onAudioEnded() { isSimulatedPlaying = false; updatePlayUI(false); stopVisualizer(); }

  // Initial hide
  if (estante) { estante.style.display = estante.style.display || 'none'; estante.setAttribute('aria-hidden', 'true'); }
  if (paginaLivro) { paginaLivro.style.display = paginaLivro.style.display || 'none'; paginaLivro.setAttribute('aria-hidden', 'true'); }
});
