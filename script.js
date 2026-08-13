// Interações para Biblioteca Noturna
// - mostra a estante ao clicar em #entrar
// - abre a página do livro ao clicar em .livro
// - preenche título, frase, música, artista
// - controla play/pause e estado visual de #luaMusica

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

  const livros = Array.from(document.querySelectorAll('.livro'));

  // Áudio compartilhado (se houver src será usado, caso contrário simulamos o estado)
  let audio = new Audio();
  let isSimulatedPlaying = false;
  let activeLivroButton = null;

  function showEstante() {
    if (introducao) introducao.style.display = 'none';
    if (estante) {
      estante.style.display = 'block';
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

    // preencher conteúdo
    if (tituloElem) tituloElem.textContent = titulo;
    if (fraseElem) fraseElem.textContent = frase;
    if (numeroElem) numeroElem.textContent = `Capítulo ${capitulo}`;
    if (nomeMusicaElem) nomeMusicaElem.textContent = musica;
    if (artistaMusicaElem) artistaMusicaElem.textContent = artista;

    // preparar áudio
    if (audioSrc) {
      audio.src = audioSrc;
      audio.load();
    } else {
      // nenhum arquivo de áudio fornecido — limpar src para evitar reprodução acidental
      audio.src = '';
      isSimulatedPlaying = false;
      updatePlayUI(false);
    }

    // mostrar página
    if (paginaLivro) {
      paginaLivro.style.display = 'block';
      paginaLivro.setAttribute('aria-hidden', 'false');
      paginaLivro.focus && paginaLivro.focus();
    }
  }

  function closePaginaLivro() {
    // parar áudio se estiver tocando
    try {
      if (!audio.paused && !audio.ended) audio.pause();
    } catch (e) {
      // ignore
    }
    audio.src = '';
    isSimulatedPlaying = false;
    updatePlayUI(false);

    if (paginaLivro) {
      paginaLivro.style.display = 'none';
      paginaLivro.setAttribute('aria-hidden', 'true');
    }

    // devolver foco ao botão do livro aberto ou ao botão entrar
    if (activeLivroButton) activeLivroButton.focus();
    else if (entrarBtn) entrarBtn.focus();

    activeLivroButton = null;
  }

  function updatePlayUI(playing) {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', String(!!playing));
    playBtn.textContent = playing ? '⏸' : '▶︎';
    if (luaMusica) {
      if (playing) luaMusica.classList.add('playing');
      else luaMusica.classList.remove('playing');
    }
  }

  // eventos
  if (entrarBtn) {
    entrarBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showEstante();
    });
  }

  livros.forEach((btn) => {
    btn.addEventListener('click', () => openPaginaLivro(btn));
  });

  if (fecharBtn) {
    fecharBtn.addEventListener('click', () => closePaginaLivro());
  }

  // suporte a ESC para fechar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      const isOpen = paginaLivro && paginaLivro.getAttribute('aria-hidden') === 'false';
      if (isOpen) closePaginaLivro();
    }
  });

  // play/pause
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      // se houver src, use o <audio>
      if (audio.src) {
        try {
          if (audio.paused) {
            await audio.play();
            updatePlayUI(true);
          } else {
            audio.pause();
            updatePlayUI(false);
          }
        } catch (err) {
          // reprodução falhou (sem permissões ou sem arquivo) — simular UI
          isSimulatedPlaying = !isSimulatedPlaying;
          updatePlayUI(isSimulatedPlaying);
        }
      } else {
        // sem arquivo: apenas alterna estado visual
        isSimulatedPlaying = !isSimulatedPlaying;
        updatePlayUI(isSimulatedPlaying);
      }
    });
  }

  // quando o áudio terminar, resetar UI
  audio.addEventListener('ended', () => {
    isSimulatedPlaying = false;
    updatePlayUI(false);
  });

  // Inicialização: esconder estante e página de livro até serem usados (caso HTML já não tenha)
  if (estante) {
    estante.style.display = estante.style.display || 'none';
    estante.setAttribute('aria-hidden', 'true');
  }
  if (paginaLivro) {
    paginaLivro.style.display = paginaLivro.style.display || 'none';
    paginaLivro.setAttribute('aria-hidden', 'true');
  }
});
