document.addEventListener("DOMContentLoaded", function () {
  
const botao = document.getElementById("botao");
const telaInicial = document.querySelector(".tela-inicial");
const videoContainer = document.getElementById("videoContainer");
const video = document.getElementById("video");

botao.addEventListener("click", function() {
  telaInicial.style.display = "none";
  videoContainer.style.display = "flex";
  video.play();
});
});
