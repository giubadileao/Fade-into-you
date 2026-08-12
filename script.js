async function tocarVideo() {
  const videoContainer = document.getElementById('videoContainer');
  const video = document.getElementById('video');

  if (!video) {
    console.error('Vídeo não encontrado (#video).');
    return;
  }

  // mostra o container caso esteja oculto
  if (videoContainer) videoContainer.style.display = 'block';

  // tenta entrar em tela cheia (prefere o elemento <video>)
  const el = video;
  const requestFS = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;

  try {
    if (requestFS) {
      await requestFS.call(el);
    } else if (el.webkitEnterFullscreen) {
      // iOS Safari
      try { el.webkitEnterFullscreen(); } catch (e) { console.warn('webkitEnterFullscreen falhou', e); }
    }
  } catch (err) {
    console.warn('Não foi possível entrar em tela cheia:', err);
  }

  // inicia a reprodução (o clique no botão conta como user gesture)
  try {
    await video.play();
  } catch (err) {
    console.warn('Falha ao reproduzir vídeo:', err);
  }
}
