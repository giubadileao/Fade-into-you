function tocarVideo() {
document.querySelector(".tela-inicial").style.display = "none";
document.getElementById("videoContainer").style.display = "flex";
const video = document.getElementById("video");
  video.play();
}
