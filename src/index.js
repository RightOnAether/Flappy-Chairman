document.getElementById('changesBtn').addEventListener('click', ()=>{
  const overlay = document.getElementById('changesOverlay');
  overlay.style.display = overlay.style.display === 'block' ? 'none' : 'block';
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let backgroundImg = new Image();
let characterImg = new Image();
let topPipeImg = new Image();
let bottomPipeImg = new Image();
let gameOverImg = new Image(); gameOverImg.src = "game_over.png";

const flapSound = new Audio("assets/music/flap.mp3");
const hitSound = new Audio("assets/music/hit.mp3");
let bgMusic;

let bird = { x: 0, y: 0, width: 0, height: 0, gravity: 0, lift: 0, velocity: 0 };
let pipes = [];
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;
let frame = 0;
let gameInterval;
let isGameOver = false;
let isMuted = false;
let showHitboxes = true;

let pipeGap = 0.4; 
let pipeSpeed = 3; 
let pipeInterval = 180;

function resizeCanvas(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  bird.width = canvas.width * 0.06;
  bird.height = bird.width;
  bird.x = canvas.width * 0.15;
  bird.gravity = 0.5 * (canvas.height/600);
  bird.lift = -9.25 * (canvas.height/600);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function startGame(){
  const character = document.getElementById("character").value;
  characterImg.src = "assets/characters/" + character;

  if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }

  if (character === "Roaring.png") {
    bgMusic = new Audio("assets/music/roaring.mp3");
    backgroundImg.src = "assets/backgrounds/roaring_bg.png";
    topPipeImg.src = "assets/pipes/roaring_top_pipe.png";
    bottomPipeImg.src = "assets/pipes/roaring_bottom_pipe.png";
  } else {
    bgMusic = new Audio("assets/music/Music.mp3");
    backgroundImg.src = "assets/backgrounds/Background.png";
    topPipeImg.src = "assets/pipes/tube2.png";
    bottomPipeImg.src = "assets/pipes/tube.png";
  }
  bgMusic.loop = true;

  const difficulty = document.getElementById("difficulty").value;
  if(difficulty === "normal") { pipeGap = 0.45; pipeSpeed = 200; pipeInterval = 180; }
  if(difficulty === "hard") { pipeGap = 0.35; pipeSpeed = 25; pipeInterval = 150; }
  if(difficulty === "extreme") { pipeGap = 0.4; pipeSpeed = 30; pipeInterval = 40; }
  if(difficulty === "impossible") { pipeGap = 0.4; pipeSpeed = 25; pipeInterval = 10; }

  document.getElementById("menu").style.display = "none";
  document.getElementById("creditBox").style.display = "none";
  document.getElementById("charPreviewBox").style.display = "none";

  resetGame();
  if(!isMuted) bgMusic.play();
  gameInterval = setInterval(update, 20);

  document.addEventListener("keydown", function(event) {
    if (event.code === "Space") { event.preventDefault(); flap(); }
    if (event.code === "KeyF") { showHitboxes = !showHitboxes; }
  });
  canvas.addEventListener("click", flap);
}

document.getElementById("muteBtn").addEventListener("click", ()=>{
  isMuted = !isMuted;
  if(isMuted) bgMusic.pause();
  else if(!isGameOver) bgMusic.play();
});

document.getElementById("playAgainBtn").addEventListener("click", ()=>{
  document.getElementById("playAgainBtn").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  document.getElementById("creditBox").style.display = "flex";
  document.getElementById("charPreviewBox").style.display = "block";
});

function resetGame(){
  bird.y = canvas.height * 0.25;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frame = 0;
  isGameOver = false;
}

function flap(){
  if(!isGameOver){
    bird.velocity = bird.lift;
    flapSound.currentTime = 0;
    flapSound.play();
  }
}

function drawBird(){ 
  ctx.drawImage(characterImg, bird.x, bird.y, bird.width, bird.height); 
  if(showHitboxes){
    ctx.strokeStyle = "green"; ctx.lineWidth = 2;
    ctx.strokeRect(bird.x, bird.y, bird.width, bird.height);
  }
}

function drawPipes(){ 
  pipes.forEach(pipe => {
    ctx.drawImage(topPipeImg, pipe.x, 0, pipe.width, pipe.top);
    ctx.drawImage(bottomPipeImg, pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);

    // Tint upcoming 10th pipe yellow
    if((score + 1) % 10 === 0 && !pipe.scored){
      ctx.fillStyle = "rgba(255, 255, 0, 0.4)";
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
      ctx.fillRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    }

    if(showHitboxes){
      ctx.strokeStyle = "blue"; ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.top); 
      ctx.strokeRect(pipe.x, canvas.height - pipe.bottom, pipe.width, pipe.bottom);
    }
  });
}

function drawScore(){
  const isRoaring = document.getElementById("character").value === "Roaring.png";
  ctx.fillStyle = isRoaring ? "white" : "black";
  ctx.font = `${Math.floor(canvas.width * 0.05)}px sans-serif`;
  ctx.fillText("Score: " + score, 10, canvas.height * 0.15);
  ctx.font = `${Math.floor(canvas.width * 0.035)}px sans-serif`;
  ctx.fillText("High Score: " + highScore, 10, canvas.height * 0.15 + 40);
}

function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  if(!isGameOver){
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if(bird.y + bird.height > canvas.height || bird.y < -25){
      hitSound.currentTime = 0; hitSound.play(); triggerGameOver();
    }

    if(frame % pipeInterval === 0){
      let topHeight = Math.random() * (canvas.height - pipeGap*canvas.height - 100) + 50;
      pipes.push({ x: canvas.width, width: canvas.width * 0.12, top: topHeight, bottom: canvas.height - topHeight - pipeGap*canvas.height, scored: false });
    }

    pipes.forEach(pipe => {
      pipe.x -= pipeSpeed;
      if(bird.x < pipe.x + pipe.width && bird.x + bird.width > pipe.x){
        if(bird.y < pipe.top || bird.y + bird.height > canvas.height - pipe.bottom){
          hitSound.currentTime = 0; hitSound.play(); triggerGameOver();
        }
      }
      if(!pipe.scored && bird.x > pipe.x + pipe.width){
        score++;
        pipe.scored = true;

        if(score % 10 === 0){
          pipeSpeed += 0.5;
        }
      }
    });

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
  }

  drawPipes();
  drawBird();
  drawScore();

  if(isGameOver){
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const imgWidth = canvas.width * 0.6;
    const imgHeight = imgWidth * (gameOverImg.height / gameOverImg.width || 0.5);
    ctx.drawImage(gameOverImg, (canvas.width - imgWidth)/2, canvas.height*0.3 - imgHeight/2, imgWidth, imgHeight);

    ctx.fillStyle = "white";
    ctx.font = `${Math.floor(canvas.width*0.05)}px sans-serif`;
    ctx.fillText("Final Score: " + score, canvas.width*0.25, canvas.height*0.75);

    document.getElementById("playAgainBtn").style.display = "block";
  }

  frame++;
}

function triggerGameOver(){
  if(isGameOver) return;
  isGameOver = true;
  clearInterval(gameInterval);
  bgMusic.pause();
  if(score > highScore) { highScore = score; localStorage.setItem("highScore", highScore); }
}

document.getElementById("character").addEventListener("change", (e)=>{
  document.getElementById("charPreview").src = "assets/characters/" + e.target.value;
});
