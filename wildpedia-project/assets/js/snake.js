// --------- Canvas & Context ----------
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
let box = 10;

// --------- Game state ----------
let snake = [];
let direction = "RIGHT";
let canChangeDirection = true;
let food = []; // either object or array
let obstacles = [];
let score = 0;
let highscore = parseInt(localStorage.getItem("highscore")) || 0;
let game_interval = null;
let speed = 150;
let originalSpeed = 150;
let speedMultiplier = 1; // used during speed potion
let gameOver = false;
let last_spawn_score = 0;
let lastExtraSpawnScore = 0;
let currentMode = "EASY";
let foodValue = 1;
let foodRespawnInterval = null;
let maxDelay, minDelay;
let foodRespawnTimeout = null;

// obstacle refresh timer for HARD mode
let obstacleRefreshTimer = null;

// Potions state & timers (centralized)
const potions = {
  growth_potion: { x: 0, y: 0, active: false },
  speed_potion: { x: 0, y: 0, active: false },
  double_points_potion: { x: 0, y: 0, active: false },
};

const potionTimers = {
  growth_potion: { spawn: null, remove: null },
  speed_potion: { spawn: null, remove: null },
  double_points_potion: { spawn: null, remove: null },
};

// Effect flags
let growth_active = false; // normal food growth = 2 when true
let double_points_active = false;

// UI Elements
const container_title = document.getElementById("container-title");
const back_btn = document.getElementById("back-btn");
const guide_btn = document.getElementById("guide-btn");
const start_btn = document.getElementById("start-btn");
const canvas_area = document.getElementById("canvas-area");
const difficulties_container = document.getElementById(
  "difficulties-container"
);
const difficulty_screen = document.getElementById("difficulty-screen");
const guide_mode = document.getElementById("guide-mode");
const guide_main = document.getElementById("guide-main");
const food_count = document.getElementById("food-count");
const score_value = document.getElementById("score-value");
const potionCD = document.getElementById("potion-cd");

// Utilities
function randCell(cols, rows, margin = 1) {
  return {
    x: Math.floor(Math.random() * (cols - 2 * margin) + margin) * box,
    y: Math.floor(Math.random() * (rows - 2 * margin) + margin) * box,
  };
}

function colsRows() {
  return {
    cols: Math.floor(canvas.width / box),
    rows: Math.floor(canvas.height / box),
  };
}

function isPositionTaken(x, y) {
  // Check snake
  if (snake.some((s) => s.x === x && s.y === y)) return true;
  // Check food
  if (Array.isArray(food)) {
    if (food.some((f) => f.x === x && f.y === y)) return true;
  } else if (food && food.x === x && food.y === y) return true;
  // Check obstacles
  if (obstacles.some((o) => o.x === x && o.y === y)) return true;
  // Check potions
  for (const key of Object.keys(potions)) {
    const p = potions[key];
    if (p.active && p.x === x && p.y === y) return true;
  }
  return false;
}

// Slightly different name for occupancy check using a position object
function isOccupied(pos) {
  return isPositionTaken(pos.x, pos.y);
}

// Score
function update_score(points = 1) {
  if (double_points_active) points *= 2;
  score += points;
  if (score_value) score_value.innerText = score;

  if (score > highscore) {
    highscore = score;
    localStorage.setItem("highscore", highscore);
  }
  const hsEl = document.getElementById("highscore-value");
  if (hsEl) hsEl.innerText = highscore;

  if (currentMode === "EASY" && score >= 20 && !obstacleRefreshTimer) {
    startObstacleRefreshCycle(45000, 50000);
  }
  if (score >= 20 && obstacles.length === 0)
    // spawn obstacles logic (legacy behavior kept)
    spawn_obstacles(10);

  if (score % 10 === 0 && score >= 30 && score !== last_spawn_score) {
    spawn_obstacles(3);
    last_spawn_score = score;
  }

  if (score - lastExtraSpawnScore >= 15) {
    spawnExtraFood();
    lastExtraSpawnScore = score;
  }
}

// Game control helpers
function clearAllPotionTimers() {
  for (const key of Object.keys(potionTimers)) {
    clearTimeout(potionTimers[key].spawn);
    clearTimeout(potionTimers[key].remove);
    potionTimers[key].spawn = potionTimers[key].remove = null;
  }
  // clear potion UI
  if (potionCD) potionCD.innerHTML = "";
}

function resetEffectsAndPotions() {
  growth_active = false;
  double_points_active = false;
  speedMultiplier = 1;
  for (const k of Object.keys(potions))
    potions[k] = { x: 0, y: 0, active: false };
  clearAllPotionTimers();
}

// Stop obstacle refresh (used on end/back)
function stopObstacleRefresh() {
  if (obstacleRefreshTimer) {
    clearTimeout(obstacleRefreshTimer);
    obstacleRefreshTimer = null;
  }
}

// Start the HARD-mode full obstacle refresh cycle
function startObstacleRefreshCycle(minDelay = 10000, maxDelay = 15000) {
  stopObstacleRefresh();
  const randomDelay =
    Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay; // 10-15s
  obstacleRefreshTimer = setTimeout(() => {
    refreshObstacles(); // wipe and regenerate
    startObstacleRefreshCycle(maxDelay, minDelay); // schedule next
  }, randomDelay);
}

function refreshObstacles() {
  let count = obstacles.length;

  // Only HARD mode or if obstacles already exist
  if (currentMode === "HARD") {
    if (count === 0) count = 6; // default for HARD
  } else {
    if (count === 0) return; // Easy/Medium: do nothing if no obstacles yet
  }

  obstacles = generateObstacles(count);
  draw_game();
}

// Create initial obstacles for MEDIUM/HARD
function generateInitialObstacles(count = 1) {
  obstacles = generateObstacles(count);
}

// Generic single random obstacle spawn (kept if needed elsewhere)
function spawnRandomObstacle() {
  const { cols, rows } = colsRows();
  let tries = 0;
  while (tries < 500) {
    const c = randCell(cols, rows, 1);
    if (!isPositionTaken(c.x, c.y)) {
      obstacles.push(c);
      draw_game();
      return;
    }
    tries++;
  }
  // fallback: do nothing if no space found after many tries
}

// Spawn multiple obstacles at once
function spawn_obstacles(count = 10) {
  const newObs = generateObstacles(count);
  obstacles.push(...newObs);
}

// Generate obstacles helper (no duplicates, avoids occupied cells)
function generateObstacles(count) {
  const obs = [];
  const { cols, rows } = colsRows();
  let safety = 0;
  while (obs.length < count && safety < count * 500) {
    const c = randCell(cols, rows, 1);
    if (
      !isPositionTaken(c.x, c.y) &&
      !obs.some((o) => o.x === c.x && o.y === c.y)
    ) {
      obs.push(c);
    }
    safety++;
  }
  return obs;
}

// Potions: durations per mode
function getPotionDurations(mode) {
  switch (mode) {
    case "EASY":
      return { duration: 20000, respawn: 25000 };
    case "MEDIUM":
      return { duration: 15000, respawn: 20000 };
    case "HARD":
      return { duration: 10000, respawn: 15000 };
    default:
      return { duration: 15000, respawn: 20000 };
  }
}

function spawnPotion(potionKey, immediate = false) {
  // cancel existing spawn timer for this potion to avoid duplicates
  clearTimeout(potionTimers[potionKey].spawn);
  clearTimeout(potionTimers[potionKey].remove);

  const { duration, respawn } = getPotionDurations(currentMode);
  const { cols, rows } = colsRows();

  // random delay between 5s to 10s (in milliseconds)
  const randomDelay = Math.floor(Math.random() * 5000) + 5000;

  function createPotionNow() {
    let candidate;
    let tries = 0;
    do {
      candidate = randCell(cols, rows, 1);
      tries++;
      if (tries > 500) break; // safety
    } while (isPositionTaken(candidate.x, candidate.y));

    potions[potionKey] = { x: candidate.x, y: candidate.y, active: true };

    // schedule auto-remove after duration (then respawn after respawn delay)
    potionTimers[potionKey].remove = setTimeout(() => {
      if (potions[potionKey].active) {
        potions[potionKey].active = false;
        const nextSpawnDelay =
          respawn + Math.floor(Math.random() * 5000) + 5000;
        potionTimers[potionKey].spawn = setTimeout(
          () => spawnPotion(potionKey, true),
          nextSpawnDelay
        );
      }
    }, duration);

    draw_game(); // redraw immediately
  }

  if (immediate) {
    // delayed spawn even on immediate = true (for realism)
    setTimeout(createPotionNow, randomDelay);
  } else {
    potionTimers[potionKey].spawn = setTimeout(createPotionNow, randomDelay);
  }
}

// Drawing
function drawPotions() {
  for (const key of Object.keys(potions)) {
    const p = potions[key];
    if (!p || !p.active) continue;
    let color = "orange";
    if (key === "speed_potion") color = "blue";
    if (key === "double_points_potion") color = "red";

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x + box / 2, p.y + box / 2, box * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

function drawFood() {
  ctx.fillStyle = "green";
  if (!food) return;
  if (Array.isArray(food)) {
    food.forEach((f) => ctx.fillRect(f.x, f.y, box, box));
  } else {
    ctx.fillRect(food.x, food.y, box, box);
  }
}

function drawObstacles() {
  ctx.fillStyle = "#555";
  obstacles.forEach((b) => ctx.fillRect(b.x, b.y, box, box));
}

function drawSnake() {
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? "#0f0" : "#9f9";
    ctx.fillRect(seg.x, seg.y, box, box);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(seg.x, seg.y, box, box);
  });
}

function draw_game() {
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw order: obstacles, food, potions, snake
  drawObstacles();
  drawFood();
  drawPotions();
  drawSnake();

  ctx.strokeStyle = "white";
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// --------- Movement & Collision ----------
document.addEventListener("keydown", directionControl);

function directionControl(event) {
  if (!canChangeDirection) return;
  const k = event.key;
  if ((k === "ArrowLeft" || k.toLowerCase() === "a") && direction !== "RIGHT")
    direction = "LEFT";
  else if ((k === "ArrowUp" || k.toLowerCase() === "w") && direction !== "DOWN")
    direction = "UP";
  else if (
    (k === "ArrowRight" || k.toLowerCase() === "d") &&
    direction !== "LEFT"
  )
    direction = "RIGHT";
  else if ((k === "ArrowDown" || k.toLowerCase() === "s") && direction !== "UP")
    direction = "DOWN";
  canChangeDirection = false;
}

function moveSnake() {
  const head = { x: snake[0].x, y: snake[0].y };
  if (direction === "LEFT") head.x -= box;
  if (direction === "UP") head.y -= box;
  if (direction === "RIGHT") head.x += box;
  if (direction === "DOWN") head.y += box;

  const growthWanted = eatFood(head);
  snake.unshift(head);

  if (growthWanted === 0) {
    snake.pop();
  } else {
    const extra = Math.max(0, growthWanted - 1);
    for (let i = 0; i < extra; i++) {
      snake.push({ ...snake[snake.length - 1] });
    }
  }

  canChangeDirection = true;
  checkCollisions();
}

function updateGameInterval() {
  clearInterval(game_interval);
  game_interval = setInterval(() => {
    moveSnake();
    draw_game();
  }, speed / speedMultiplier);
}

// Eat food & potions handling
function eatFood(head) {
  let growthWanted = 0;

  // === FOOD EATING ===
  if (Array.isArray(food)) {
    for (let i = 0; i < food.length; i++) {
      const f = food[i];
      if (!f) continue;
      if (head.x === f.x && head.y === f.y) {
        growthWanted = growth_active ? 2 : 1;
        update_score(1);

        // Remove eaten food from actual array
        food.splice(i, 1);

        // Always spawn a replacement food
        spawnExtraFood();

        break;
      }
    }
  } else {
    if (head.x === food.x && head.y === food.y) {
      growthWanted = growth_active ? 2 : 1;
      update_score(1);

      // Reposition single food
      const { cols, rows } = colsRows();
      let candidate;
      do {
        candidate = randCell(cols, rows, 2);
      } while (isPositionTaken(candidate.x, candidate.y));
      food = candidate;
    }
  }

  // === POTIONS PICKUP ===
  // Growth potion
  if (
    potions.growth_potion.active &&
    head.x === potions.growth_potion.x &&
    head.y === potions.growth_potion.y
  ) {
    potions.growth_potion.active = false;
    growth_active = true;
    showPotionCountdown(
      "growth",
      "orange",
      Math.floor(getPotionDurations(currentMode).duration / 1000)
    );
    clearTimeout(potionTimers.growth_potion.remove);
    potionTimers.growth_potion.remove = setTimeout(() => {
      growth_active = false;
      spawnPotion("growth_potion", true);
    }, getPotionDurations(currentMode).duration);
  }

  // Speed potion
  if (
    potions.speed_potion.active &&
    head.x === potions.speed_potion.x &&
    head.y === potions.speed_potion.y
  ) {
    potions.speed_potion.active = false;
    speedMultiplier = 2;
    updateGameInterval();
    showPotionCountdown(
      "speed",
      "blue",
      Math.floor(getPotionDurations(currentMode).duration / 1000)
    );
    clearTimeout(potionTimers.speed_potion.remove);
    potionTimers.speed_potion.remove = setTimeout(() => {
      speedMultiplier = 1;
      updateGameInterval();
      spawnPotion("speed_potion", true);
    }, getPotionDurations(currentMode).duration);
  }

  // Double points potion
  if (
    potions.double_points_potion.active &&
    head.x === potions.double_points_potion.x &&
    head.y === potions.double_points_potion.y
  ) {
    potions.double_points_potion.active = false;
    double_points_active = true;
    showPotionCountdown(
      "double",
      "red",
      Math.floor(getPotionDurations(currentMode).duration / 1000)
    );
    clearTimeout(potionTimers.double_points_potion.remove);
    potionTimers.double_points_potion.remove = setTimeout(() => {
      double_points_active = false;
      spawnPotion("double_points_potion", true);
    }, getPotionDurations(currentMode).duration);
  }

  updateGameInterval();
  return growthWanted;
}

function respawnAllFood() {
  if (!Array.isArray(food)) return;

  const { cols, rows } = colsRows();
  const newFood = [];

  for (let i = 0; i < food.length; i++) {
    let candidate;
    do {
      candidate = randCell(cols, rows, 2);
    } while (
      isPositionTaken(candidate.x, candidate.y) ||
      newFood.some((f) => f.x === candidate.x && f.y === candidate.y)
    );
    newFood.push(candidate);
  }

  food = newFood;
}

function startFoodRespawnLoop() {
  if (foodRespawnInterval) clearInterval(foodRespawnInterval);
  if (foodRespawnTimeout) clearTimeout(foodRespawnTimeout);

  const t = Math.random() * 5000 + 10000;
  foodRespawnTimeout = setTimeout(() => {
    respawnAllFood(); // first respawn
    foodRespawnInterval = setInterval(respawnAllFood, 15000);
  }, t);
}

function spawnExtraFood() {
  const maxFood = 12;
  if (Array.isArray(food) && food.length >= maxFood) return; // stop kung puno na

  const { cols, rows } = colsRows();
  let tries = 0;
  while (tries < 500) {
    const c = randCell(cols, rows, 1);
    if (!isPositionTaken(c.x, c.y)) {
      food.push(c);
      break; // matagumpay, exit loop
    }
    tries++;
  }
}

// Collisions & game end
function checkCollisions() {
  const head = snake[0];
  // wall
  if (
    head.x < 0 ||
    head.y < 0 ||
    head.x >= canvas.width ||
    head.y >= canvas.height
  ) {
    alert("Game Over! You hit the wall.");
    endGame();
    return;
  }

  // obstacle
  if (checkObstacleCollision(head)) {
    alert("Game Over! You hit the obstacle.");
    endGame();
    return;
  }

  // self
  if (collision(head, snake.slice(1))) {
    alert("Game Over! You hit yourself.");
    endGame();
    return;
  }
}

function checkObstacleCollision(head) {
  return obstacles.some((b) => b.x === head.x && b.y === head.y);
}

function collision(head, array) {
  return array.some((seg) => seg.x === head.x && seg.y === head.y);
}

function endGame() {
  gameOver = true;
  clearInterval(game_interval);

  stopObstacleRefresh();
  disable_buttons(false);
  resetEffectsAndPotions();

  lastExtraSpawnScore = 0;

  // Restore speed fallback
  if (currentMode === "EASY") speed = 150;
  else if (currentMode === "MEDIUM") speed = 100;
  else speed = 70;
  originalSpeed = speed;

  if (potionCD) potionCD.innerHTML = "";

  // Clear food respawn timers
  if (foodRespawnInterval) clearInterval(foodRespawnInterval);
  foodRespawnInterval = null;
  if (foodRespawnTimeout) clearTimeout(foodRespawnTimeout);
  foodRespawnTimeout = null;
}

// Potion countdown UI
function showPotionCountdown(type, color, durationSeconds) {
  if (!potionCD) return;
  const boxEl = document.createElement("div");
  const hoverSpan = document.createElement("span");
  boxEl.classList.add("potion-box");
  hoverSpan.classList.add("hover-label");
  boxEl.style.backgroundColor = color;
  boxEl.textContent = durationSeconds;

  if (type === "growth")
    hoverSpan.textContent = "Growth Potion (+2 size per food eaten)";
  else if (type === "speed") hoverSpan.textContent = "Speed Potion (faster)";
  else if (type === "double")
    hoverSpan.textContent = "Double Points (2x score)";

  boxEl.appendChild(hoverSpan);
  potionCD.appendChild(boxEl);

  let remaining = durationSeconds;
  const interval = setInterval(() => {
    remaining--;
    boxEl.firstChild.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(interval);
      boxEl.remove();
    }
  }, 1000);
}

// Mode & Setup
function setMode(mode) {
  currentMode = mode;
  container_title.innerText =
    mode.charAt(0) + mode.slice(1).toLowerCase() + " Mode";
  difficulties_container.style.width = "0%";
  difficulties_container.style.opacity = "0";
  difficulties_container.style.visibility = "hidden";
  difficulty_screen.style.visibility = "visible";
  difficulty_screen.style.width = "100%";
  difficulty_screen.style.opacity = "1";
  canvas_area.style.opacity = "1";

  const fv = parseInt(food_count.value) || 1;
  setup_mode(mode, fv);
}

function setup_mode(mode, fv = 1) {
  const { cols, rows } = colsRows();
  snake = [{ x: Math.floor(cols / 2) * box, y: Math.floor(rows / 2) * box }];
  obstacles = [];
  resetEffectsAndPotions();
  foodValue = fv;

  switch (mode) {
    case "EASY":
      speed = originalSpeed = 150;
      obstacles = [];
      break;
    case "MEDIUM":
      speed = originalSpeed = 100;
      generateInitialObstacles(5);
      startObstacleRefreshCycle(25000, 30000);
      break;
    case "HARD":
      speed = originalSpeed = 70;
      generateInitialObstacles(10);
      startObstacleRefreshCycle(10000, 15000);
      break;
    default:
      speed = originalSpeed = 150;
  }
  speedMultiplier = 1;
}

// Start / Back
function back_page() {
  container_title.innerText = "Snake Game";
  difficulties_container.style.width = "100%";
  difficulty_screen.style.visibility = "hidden";
  difficulty_screen.style.width = "0%";
  difficulty_screen.style.opacity = "0";
  difficulties_container.style.opacity = "1";
  difficulties_container.style.visibility = "visible";
  canvas_area.style.opacity = "0";

  score = 0;
  if (score_value) score_value.innerText = score;
  food_count.value = "";
  clearInterval(game_interval);
  stopObstacleRefresh();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resetEffectsAndPotions();
}

function start_game() {
  // --- Food value check ---
  const fv = parseInt(food_count.value);
  if (isNaN(fv) || fv < 1 || fv > 5) {
    alert("Please enter amount of food [1 - 5]");
    return;
  }
  foodValue = fv;

  // --- Clear previous intervals/timers ---
  clearInterval(game_interval);
  clearInterval(foodRespawnInterval);
  stopObstacleRefresh();
  resetEffectsAndPotions(); // also clears potion timers

  // --- Reset snake & direction ---
  snake = [{ x: 40 * box, y: 25 * box }];
  direction = "RIGHT";
  canChangeDirection = true;

  // --- Reset score ---
  score = 0;
  lastExtraSpawnScore = 0; // safe for extra food
  if (score_value) score_value.innerText = score;

  // --- Generate initial food ---
  food_init(foodValue);

  // --- Speed & obstacles per mode ---
  obstacles = [];
  switch (currentMode) {
    case "EASY":
      speed = originalSpeed = 150;
      break;
    case "MEDIUM":
      speed = originalSpeed = 100;
      generateInitialObstacles(5);
      startObstacleRefreshCycle(25000, 30000);
      break;
    case "HARD":
      speed = originalSpeed = 70;
      generateInitialObstacles(10);
      startObstacleRefreshCycle(10000, 15000);
      break;
    default:
      speed = originalSpeed = 150;
  }
  speedMultiplier = 1;

  // --- Spawn potions safely ---
  spawnPotion("growth_potion", true);
  spawnPotion("speed_potion", true);
  spawnPotion("double_points_potion", true);

  startFoodRespawnLoop();
  updateGameInterval();
  disable_buttons(true);
}

function back_settings_mode() {
  guide_main.style.width = "0%";
  guide_mode.style.width = "40%";

  guide_main.style.opacity = "0";
  guide_mode.style.opacity = "1";

  guide_main.style.visibility = "hidden";
  guide_mode.visibility = "visible";
}

function guide_content() {
  guide_main.style.opacity = "1";
  guide_mode.style.width = "0";

  guide_main.style.width = "40%";
  guide_mode.style.opacity = "0";

  guide_main.style.visibility = "visible";
  guide_mode.visibility = "hidden";
}

// Disable UI buttons while running
function disable_buttons(state) {
  if (back_btn) back_btn.disabled = state;
  if (guide_btn) guide_btn.disabled = state;
  if (start_btn) start_btn.disabled = state;
}

// Food
function food_init(fv = 1) {
  const { cols, rows } = colsRows();
  if (fv === 1) {
    let candidate;
    do {
      candidate = randCell(cols, rows, 2);
    } while (isPositionTaken(candidate.x, candidate.y));
    food = candidate;
  } else {
    const arr = [];
    while (arr.length < fv) {
      const candidate = randCell(cols, rows, 2);
      if (
        !arr.some((a) => a.x === candidate.x && a.y === candidate.y) &&
        !isPositionTaken(candidate.x, candidate.y)
      )
        arr.push(candidate);
    }
    food = arr;
  }
}

// Initial draw to make sure canvas not blank
draw_game();

// Debug helper
function debugState() {
  console.log({
    snakeLen: snake.length,
    score,
    potions,
    potionTimers,
    speed,
    speedMultiplier,
    food,
    obstaclesLength: obstacles.length,
  });
}

// expose some functions for console testing
window.DEBUG = {
  spawnPotion,
  draw_game,
  debugState,
  start_game,
  setup_mode,
  setMode,
  spawn_obstacles,
  spawnRandomObstacle,
  refreshObstacles,
  stopObstacleRefresh,
};
