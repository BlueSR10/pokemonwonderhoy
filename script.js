const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
  x: canvas.width / 2 - 40, // 주인공의 시작 위치
  y: canvas.height - 100,
  width: 80, // 주인공의 너비
  height: 80, // 주인공의 높이
  speed: 5, // 이동 속도
  direction: "up", // 초기 방향
};

let bullets = [];
let obstacles = [];
let keys = {};
let playerEnergy = 10;
let gameTime = 0; // 게임 시간 초기화

// 배경 음악
const backgroundMusic = document.getElementById("backgroundMusic");
backgroundMusic.volume = 0.5;

// 배경 음악 재생 함수
function playBackgroundMusic() {
  if (backgroundMusic.paused) {
    backgroundMusic.play().catch((error) => {
      console.error("Error playing background music:", error);
    });
  }
}

// 충돌 효과음
const collisionSound = document.getElementById("collisionSound");

// 주인공 이미지
const playerImage = new Image();
playerImage.src = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"; // 피카츄

// 장애물 이미지 배열
let obstacleImages = [];
async function loadObstacleImages() {
  for (let i = 1; i <= 10; i++) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${Math.floor(Math.random() * 151) + 1}`);
    const data = await response.json();
    const img = new Image();
    img.src = data.sprites.front_default;
    obstacleImages.push(img);
  }
}

// 주인공 그리기
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

// 총알 그리기
function drawBullets() {
  bullets.forEach((bullet, index) => {
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;

    if (
      bullet.x < 0 ||
      bullet.x > canvas.width ||
      bullet.y < 0 ||
      bullet.y > canvas.height
    ) {
      bullets.splice(index, 1);
    }

    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

// 장애물 생성
function spawnObstacle() {
  const width = Math.random() * 50 + 30;
  const height = 30;
  const speed = Math.random() * 3 + 2;

  const direction = Math.floor(Math.random() * 4);
  let x, y, speedX = 0, speedY = 0;

  if (direction === 0) {
    x = Math.random() * canvas.width;
    y = 0;
    speedY = speed;
  } else if (direction === 1) {
    x = Math.random() * canvas.width;
    y = canvas.height;
    speedY = -speed;
  } else if (direction === 2) {
    x = 0;
    y = Math.random() * canvas.height;
    speedX = speed;
  } else if (direction === 3) {
    x = canvas.width;
    y = Math.random() * canvas.height;
    speedX = -speed;
  }

  const imageIndex = Math.floor(Math.random() * obstacleImages.length);
  const image = obstacleImages[imageIndex]; // 고정된 이미지 선택

  obstacles.push({
    x,
    y,
    width,
    height,
    speedX,
    speedY,
    image, // 선택된 이미지 저장
  });
}

// 장애물 그리기
// 장애물 그리기
function drawObstacles() {
    obstacles.forEach((obstacle, index) => {
      obstacle.x += obstacle.speedX;
      obstacle.y += obstacle.speedY;
  
      if (
        obstacle.y > canvas.height ||
        obstacle.y + obstacle.height < 0 ||
        obstacle.x > canvas.width ||
        obstacle.x + obstacle.width < 0
      ) {
        obstacles.splice(index, 1); // 화면 밖으로 나가면 제거
      }
  
      const image = obstacle.image;
  
      if (image.complete) {
        // 이미지 비율 계산
        const aspectRatio = image.width / image.height;
        const drawWidth = obstacle.width; // 설정된 폭 사용
        const drawHeight = drawWidth / aspectRatio; // 비율에 맞는 높이 계산
  
        ctx.drawImage(image, obstacle.x, obstacle.y, drawWidth, drawHeight);
      }
    });
  }
  

// 충돌 처리
function handleCollisions() {
  bullets.forEach((bullet, bIndex) => {
    obstacles.forEach((obstacle, oIndex) => {
      if (
        bullet.x < obstacle.x + obstacle.width &&
        bullet.x + bullet.width > obstacle.x &&
        bullet.y < obstacle.y + obstacle.height &&
        bullet.y + bullet.height > obstacle.y
      ) {
        bullets.splice(bIndex, 1);
        obstacles.splice(oIndex, 1);
      }
    });
  });

  obstacles.forEach((obstacle, oIndex) => {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.y < obstacle.y + obstacle.height &&
      player.y + player.height > obstacle.y
    ) {
      obstacles.splice(oIndex, 1);
      playerEnergy -= 1;
      collisionSound.currentTime = 0;
      collisionSound.play();

      if (playerEnergy <= 0) {
        alert("Game Over!");
        location.reload();
      }
    }
  });
}

// HUD 표시 함수
function displayHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Energy: ${playerEnergy}`, 10, 30);
  ctx.fillText(`Time: ${gameTime}s`, canvas.width - 120, 30); // 현재 게임 시간 표시
}

// 플레이어 이동 처리
function updatePlayerPosition() {
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
    player.direction = "left";
  }
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) {
    player.x += player.speed;
    player.direction = "right";
  }
  if (keys["ArrowUp"] && player.y > 0) {
    player.y -= player.speed;
    player.direction = "up";
  }
  if (keys["ArrowDown"] && player.y + player.height < canvas.height) {
    player.y += player.speed;
    player.direction = "down";
  }
}

// 키 이벤트 처리
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  if (e.key === " ") {
    let bulletSpeedX = 0;
    let bulletSpeedY = 0;

    if (player.direction === "left") bulletSpeedX = -10;
    if (player.direction === "right") bulletSpeedX = 10;
    if (player.direction === "up") bulletSpeedY = -10;
    if (player.direction === "down") bulletSpeedY = 10;

    bullets.push({
      x: player.x + player.width / 2 - 5,
      y: player.y + player.height / 2 - 5,
      width: 10,
      height: 10,
      speedX: bulletSpeedX,
      speedY: bulletSpeedY,
    });
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// 게임 루프
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayerPosition(); // 플레이어 이동 업데이트
  drawPlayer();           // 플레이어 그리기
  drawBullets();          // 총알 그리기
  drawObstacles();        // 장애물 그리기
  handleCollisions();     // 충돌 처리
  displayHUD();           // HUD 표시

  requestAnimationFrame(update); // 게임 루프
}

// 1초마다 게임 시간 증가
setInterval(() => gameTime++, 1000);

// 배경 음악 클릭 이벤트
window.addEventListener("click", playBackgroundMusic);

// 게임 시작
setInterval(spawnObstacle, 1000);
loadObstacleImages();
update();
