(function() {
  // ---------- تنظیمات اولیه ----------
  const ENEMY_IMAGES = {
    normal: './img/amin.jpg',
    fast: './img/enemy_fast.jpg',
    big: './img/enemy_big.jpg',
    boss: './img/boss.jpg'
  };
  const BACKGROUNDS = [
    './img/bg1.jpg', './img/bg2.jpg', './img/bg3.jpg', './img/bg4.jpg', './img/bg5.jpg',
    './img/bg6.jpg', './img/bg7.jpg', './img/bg8.jpg', './img/bg9.jpg'
  ];
  let totalKillsAllTime = localStorage.getItem('totalKillsAllTime') ? parseInt(localStorage.getItem('totalKillsAllTime')) : 0;
  let totalCoins = localStorage.getItem('totalCoins') ? parseInt(localStorage.getItem('totalCoins')) : 0;
  let bestComboGlobal = localStorage.getItem('bestComboGlobal') ? parseInt(localStorage.getItem('bestComboGlobal')) : 0;
  let extraLife = localStorage.getItem('extraLife') ? parseInt(localStorage.getItem('extraLife')) : 0;
  let attackCooldownReduction = localStorage.getItem('attackCooldownReduction') ? parseInt(localStorage.getItem('attackCooldownReduction')) : 0;
  let coinBonus = localStorage.getItem('coinBonus') ? parseFloat(localStorage.getItem('coinBonus')) : 1;
  let startPowerup = localStorage.getItem('startPowerup') === 'true';

  // ---------- DOM elements ----------
  const mainMenu = document.getElementById('mainMenu');
  const gameContainer = document.getElementById('gameContainer');
  const game = document.getElementById('game');
  const playerDiv = document.getElementById('player');
  const enemyContainer = document.getElementById('enemyContainer');
  const itemsContainer = document.getElementById('itemsContainer');
  const attackEffect = document.getElementById('attackEffect');
  const whiteFlash = document.getElementById('whiteFlash');
  const warningMarker = document.getElementById('warningMarker');
  const scoreSpan = document.getElementById('my-emtiaz');
  const levelSpan = document.getElementById('my-level');
  const comboCountSpan = document.getElementById('combo-count');
  const highScoreSpan = document.getElementById('highscore');
  const livesSpan = document.getElementById('lives-count');
  const coinsSpan = document.getElementById('coins');
  const timerSpan = document.getElementById('timer');
  const totalCoinsSpan = document.getElementById('totalCoins');
  const totalKillsDisplay = document.getElementById('totalKillsDisplay');
  const bestComboDisplay = document.getElementById('bestComboDisplay');
  const bossHealthBar = document.getElementById('bossHealthBar');
  const bossHealthFill = bossHealthBar.querySelector('.boss-health-fill');
  const startBtn = document.getElementById('menuStartBtn');
  const menuShopBtn = document.getElementById('menuShopBtn');
  const achievementsBtn = document.getElementById('achievementsBtn');
  const inGameShopBtn = document.getElementById('inGameShopBtn');
  const closeShop = document.getElementById('closeShop');
  const closeAchievements = document.getElementById('closeAchievements');
  const backToMenuBtn = document.getElementById('backToMenuBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');
  const nightModeBtn = document.getElementById('nightModeBtn');
  const modeNormal = document.getElementById('modeNormal');
  const modeTimeAttack = document.getElementById('modeTimeAttack');
  const modeEndless = document.getElementById('modeEndless');
  const diffEasy = document.getElementById('diffEasy');
  const diffNormal = document.getElementById('diffNormal');
  const diffHard = document.getElementById('diffHard');
  const charAmir = document.getElementById('charAmir');
  const charKoshte = document.getElementById('charKoshte');
  const charSarbaz = document.getElementById('charSarbaz');
  const buyLife = document.getElementById('buyLife');
  const buyAttackSpeed = document.getElementById('buyAttackSpeed');
  const buyCoinBonus = document.getElementById('buyCoinBonus');
  const buyStartPowerup = document.getElementById('buyStartPowerup');

  totalCoinsSpan.innerText = totalCoins;
  totalKillsDisplay.innerText = totalKillsAllTime;
  bestComboDisplay.innerText = bestComboGlobal;

  // ---------- متغیرهای بازی ----------
  let gameActive = false;
  let animationId = null;
  let mode = 'normal';
  let difficulty = 'easy';
  let currentChar = 'amir';
  let playerX = 400, playerY = 250;
  let lives = 3 + extraLife;
  let points = 0;
  let combo = 0;
  let lastPointTime = 0;
  let coins = 0;
  let currentStage = 1;
  let enemies = [];
  let items = [];
  let attackCooldown = false;
  let attackCooldownTime = 200 - attackCooldownReduction * 2;
  let powerupActive = false;
  let powerupTimer = null;
  let multishotActive = false;
  let slowActive = false;
  let slowTimer = null;
  let shieldActive = false;
  let shieldTimer = null;
  let invincibleFrames = false;
  let invincibleTimer = null;
  let timeRemaining = 0;
  let bossActive = false;
  let bossHealth = 0;
  let bossMaxHealth = 0;
  let enemiesSpawnInterval = null;
  let stageCounter = 0;
  let currentBackgroundIndex = 0;
  let killsSinceLastMessage = 0;
  let normalSpawnDelay = 1500;   // فاصله spawn عادی
  let bossSpawnDelay = 3000;     // فاصله spawn در زمان باس

  // ---------- صداها ----------
  let audioCtx = null;
  function initAudio() { if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  function playSound(freq, type, duration, vol=0.2) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq; gain.gain.value = vol; osc.type = type;
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime+duration);
    osc.stop(audioCtx.currentTime+duration);
  }
  function playAttackSound() { playSound(600, 'square', 0.2); }
  function playHitSound() { playSound(200, 'sawtooth', 0.3, 0.3); }
  function playPowerupSound() { playSound(1200, 'triangle', 0.4, 0.15); }
  function playUpgradeSound() { playSound(800, 'sine', 0.3); }
  function playCoinSound() { playSound(1000, 'sine', 0.1, 0.1); }
  function playCelebrationSound() { playSound(1500, 'sine', 0.5, 0.2); }
  document.body.addEventListener('click', () => { if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); });

  const bgMusic = new Audio('bg-music.mp3');
  bgMusic.loop = true; bgMusic.volume = 0.2;
  let musicEnabled = true;
  function startMusic() { if(musicEnabled && gameActive) bgMusic.play().catch(e=>{}); }
  function stopMusic() { bgMusic.pause(); }
  musicToggleBtn.onclick = () => { 
    musicEnabled = !musicEnabled; 
    if(musicEnabled && gameActive) startMusic(); else stopMusic(); 
    musicToggleBtn.innerHTML = musicEnabled ? "🔇 بیصدا" : "🎵 موزیک"; 
  };
  nightModeBtn.onclick = () => { document.body.classList.toggle('night-mode'); nightModeBtn.innerHTML = document.body.classList.contains('night-mode') ? "☀️ روز" : "🌙 شب"; };

  // ---------- افکت‌ها ----------
  function createBloodParticles(x, y, isPlayer=false) {
    let count = isPlayer ? 25 : 15;
    for(let i=0;i<count;i++) {
      let blood = document.createElement('div');
      blood.style.position = 'absolute';
      blood.style.width = (3+Math.random()*8)+'px';
      blood.style.height = blood.style.width;
      blood.style.backgroundColor = `rgb(180,0,0)`;
      blood.style.borderRadius = '50%';
      blood.style.pointerEvents = 'none';
      blood.style.zIndex = '20';
      let angle = Math.random() * Math.PI * 2;
      let speed = 2 + Math.random() * 5;
      let vx = Math.cos(angle)*speed;
      let vy = Math.sin(angle)*speed - 2;
      blood.style.left = x+'px'; blood.style.top = y+'px';
      game.appendChild(blood);
      let posX=x, posY=y, opacity=1, life=0;
      function animate() {
        if(!blood.parentNode) return;
        posX+=vx; posY+=vy; life++;
        opacity = 1 - life/50;
        blood.style.left = posX+'px'; blood.style.top = posY+'px';
        blood.style.opacity = opacity;
        if(life<50) requestAnimationFrame(animate);
        else blood.remove();
      }
      requestAnimationFrame(animate);
    }
    if(isPlayer) {
      let splash = document.createElement('div');
      splash.style.position = 'absolute';
      splash.style.left = (x-30)+'px'; splash.style.top = (y-30)+'px';
      splash.style.width = '80px'; splash.style.height = '80px';
      splash.style.backgroundColor = 'rgba(180,0,0,0.5)';
      splash.style.borderRadius = '50%'; splash.style.filter = 'blur(10px)';
      splash.style.pointerEvents = 'none'; splash.style.zIndex = '15';
      splash.style.animation = 'bloodSplash 0.5s ease-out forwards';
      game.appendChild(splash);
      setTimeout(()=>splash.remove(),500);
    }
  }
  function showAttackEffect(x,y) {
    attackEffect.style.left = (x-25)+'px'; attackEffect.style.top = (y-25)+'px';
    attackEffect.classList.remove('hidden');
    setTimeout(()=>attackEffect.classList.add('hidden'),200);
  }
  function whiteFlashEffect() {
    whiteFlash.classList.remove('hidden');
    setTimeout(()=>whiteFlash.classList.add('hidden'),150);
  }
  function screenShake() {
    game.classList.add('shake');
    setTimeout(()=>game.classList.remove('shake'),300);
  }
  function addCoin(amount) {
    let finalAmount = Math.floor(amount * coinBonus);
    coins += finalAmount;
    totalCoins += finalAmount;
    coinsSpan.innerText = coins;
    totalCoinsSpan.innerText = totalCoins;
    localStorage.setItem('totalCoins', totalCoins);
    playCoinSound();
  }
  // گرفتن نام شخصیت فعال برای پیام تبریک
  function getCurrentCharacterName() {
    let activeChar = document.querySelector('.char-btn.active');
    if(activeChar) return activeChar.innerText.trim();
    return 'بازیکن';
  }
  function showCongratsMessage() {
    let playerName = getCurrentCharacterName();
    let msgDiv = document.createElement('div');
    msgDiv.className = 'congrats-message';
    msgDiv.innerText = `🎉 آفرین ${playerName}!  کیف توت 🎉`;
    game.appendChild(msgDiv);
    playCelebrationSound();
    setTimeout(() => { if(msgDiv.parentNode) msgDiv.remove(); }, 2000);
  }

  // ---------- حرکت بازیکن با ماوس ----------
  function handleMouseMove(e) {
    if(!gameActive) return;
    let rect = game.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    mouseX = Math.min(Math.max(mouseX, 30), game.clientWidth - 50);
    mouseY = Math.min(Math.max(mouseY, 30), game.clientHeight - 50);
    playerX = mouseX;
    playerY = mouseY;
    playerDiv.style.left = (playerX - 30) + 'px';
    playerDiv.style.top = (playerY - 30) + 'px';
  }
  game.addEventListener('mousemove', handleMouseMove);
  game.addEventListener('touchmove', (e) => {
    let rect = game.getBoundingClientRect();
    let touch = e.touches[0];
    let mouseX = touch.clientX - rect.left;
    let mouseY = touch.clientY - rect.top;
    mouseX = Math.min(Math.max(mouseX, 30), game.clientWidth - 50);
    mouseY = Math.min(Math.max(mouseY, 30), game.clientHeight - 50);
    playerX = mouseX; playerY = mouseY;
    playerDiv.style.left = (playerX-30)+'px'; playerDiv.style.top = (playerY-30)+'px';
  });

  // ---------- دشمنان هوشمند با افکت هشدار ----------
  function showWarningAtSpawn(x, y) {
    warningMarker.classList.remove('hidden');
    warningMarker.style.left = (x-30)+'px';
    warningMarker.style.top = (y-30)+'px';
    setTimeout(() => { warningMarker.classList.add('hidden'); }, 800);
  }
  function spawnEnemy() {
    if(!gameActive) return;
    // در زمان باس: حداکثر ۲ دشمن عادی اضافی (بعلاوه خود باس)
    if(bossActive && enemies.length >= 3) return;
    
    let types = ['normal', 'fast', 'big'];
    let type = types[Math.floor(Math.random()*types.length)];
    if(currentStage<2 && type==='big') type='normal';
    if(currentStage<3 && type==='fast') type='normal';
    let element = document.createElement('div');
    element.className = `enemy enemy-${type}`;
    element.style.backgroundImage = `url('${ENEMY_IMAGES[type]}')`;
    let side = Math.random() < 0.5 ? 'left' : 'right';
    let x, y;
    if(side === 'left') {
      x = -50;
      y = Math.random() * (game.clientHeight - 100) + 30;
    } else {
      x = game.clientWidth + 50;
      y = Math.random() * (game.clientHeight - 100) + 30;
    }
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    let speed = 1.5;
    if(difficulty==='easy') speed = 1.2;
    else if(difficulty==='hard') speed = 2;
    if(type==='fast') speed *= 1.8;
    if(type==='big') speed *= 0.7;
    enemyContainer.appendChild(element);
    enemies.push({ element, type, x, y, speed, health: type==='big'?3:1, pointsValue: type==='fast'?1:type==='big'?3:2 });
    if(Math.random() < 0.3) showWarningAtSpawn(x, y);
  }
  function updateEnemies() {
    for(let i=0;i<enemies.length;i++) {
      let e = enemies[i];
      let dx = playerX - e.x;
      let dy = playerY - e.y;
      let dist = Math.hypot(dx,dy);
      if(dist > 0) {
        let move = Math.min(e.speed, dist-10);
        e.x += (dx/dist) * move;
        e.y += (dy/dist) * move;
      }
      e.element.style.left = e.x + 'px';
      e.element.style.top = e.y + 'px';
      let playerRect = playerDiv.getBoundingClientRect();
      let enemyRect = e.element.getBoundingClientRect();
      if(enemyRect.right > playerRect.left && enemyRect.left < playerRect.right &&
         enemyRect.bottom > playerRect.top && enemyRect.top < playerRect.bottom) {
        if(!invincibleFrames && !shieldActive) loseLife();
        e.element.remove(); enemies.splice(i,1); i--;
      }
    }
  }
  function getNearestEnemy() {
    let minDist = Infinity;
    let nearest = null;
    for(let e of enemies) {
      let dx = e.x - playerX;
      let dy = e.y - playerY;
      let dist = Math.hypot(dx,dy);
      if(dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }
  function attack() {
    if(!gameActive || attackCooldown) return;
    let target = getNearestEnemy();
    if(!target) return;
    attackCooldown = true;
    setTimeout(()=>{ attackCooldown = false; }, attackCooldownTime);
    playAttackSound();
    whiteFlashEffect();
    let rect = target.element.getBoundingClientRect();
    createBloodParticles(rect.left+rect.width/2, rect.top+rect.height/2, false);
    showAttackEffect(rect.left+rect.width/2, rect.top+rect.height/2);
    let pointVal = (target.type==='fast'?1:target.type==='big'?3:2) * (powerupActive?2:1);
    if(combo>=3) pointVal*=2;
    if(combo>=7) pointVal*=2;
    points += pointVal;
    scoreSpan.innerText = points;
    addCoin(5 + (target.type==='big'?10:0));
    updateCombo();
    stageCounter++;
    killsSinceLastMessage++;
    if(killsSinceLastMessage >= 5) {
      showCongratsMessage();
      killsSinceLastMessage = 0;
    }
    if(mode==='timeattack') {
      timeRemaining += 2;
      timerSpan.innerText = Math.floor(timeRemaining);
    }
    if(bossActive) {
      bossHealth--;
      let percent = (bossHealth/bossMaxHealth)*100;
      bossHealthFill.style.width = percent+'%';
      if(bossHealth <= 0) {
        bossActive = false;
        bossHealthBar.classList.add('hidden');
        addCoin(100);
        points += 50;
        scoreSpan.innerText = points;
        showCongratsMessage();
        // پس از کشتن باس، سرعت spawn را به حالت عادی برگردان
        if(enemiesSpawnInterval) {
          clearInterval(enemiesSpawnInterval);
          enemiesSpawnInterval = setInterval(() => {
            if(gameActive && !bossActive && enemies.length < 8) spawnEnemy();
            else if(gameActive && bossActive && enemies.length < 3) spawnEnemy();
          }, normalSpawnDelay);
        }
      }
    } else {
      if(stageCounter % 5 === 0 && stageCounter>0) {
        currentStage++;
        if(currentStage % 5 === 0) spawnBoss();
        else changeBackground();
      }
    }
    target.element.remove();
    let idx = enemies.indexOf(target);
    if(idx!==-1) enemies.splice(idx,1);
    if(points > parseInt(highScoreSpan.innerText)) highScoreSpan.innerText = points;
    totalKillsAllTime++;
    totalKillsDisplay.innerText = totalKillsAllTime;
    localStorage.setItem('totalKillsAllTime', totalKillsAllTime);
    if(multishotActive) {
      let nextTarget = getNearestEnemy();
      if(nextTarget && nextTarget !== target) {
        setTimeout(() => { if(gameActive) attack(); }, 50);
      }
    }
  }
  function spawnBoss() {
    if(bossActive) return;
    bossActive = true;
    bossHealth = 20;
    bossMaxHealth = 20;
    bossHealthFill.style.width = '100%';
    bossHealthBar.classList.remove('hidden');
    let bossElement = document.createElement('div');
    bossElement.className = 'enemy enemy-boss';
    bossElement.style.backgroundImage = `url('${ENEMY_IMAGES.boss}')`;
    bossElement.style.left = game.clientWidth/2 - 60 + 'px';
    bossElement.style.top = 50 + 'px';
    enemyContainer.appendChild(bossElement);
    enemies.push({ element: bossElement, type: 'boss', x: game.clientWidth/2-60, y: 50, speed: 0.8, health: bossHealth, pointsValue: 20 });
    showWarningAtSpawn(game.clientWidth/2-60, 50);
    // در زمان باس، فاصله spawn دشمنان عادی را بیشتر کن (برای کاهش ازدحام)
    if(enemiesSpawnInterval) {
      clearInterval(enemiesSpawnInterval);
      enemiesSpawnInterval = setInterval(() => {
        if(gameActive && bossActive && enemies.length < 3) spawnEnemy();
        else if(gameActive && !bossActive && enemies.length < 8) spawnEnemy();
      }, bossSpawnDelay);
    }
  }
  function changeBackground() {
    currentBackgroundIndex = (currentBackgroundIndex+1) % BACKGROUNDS.length;
    game.style.backgroundImage = `url('${BACKGROUNDS[currentBackgroundIndex]}')`;
    levelSpan.innerText = currentStage;
  }
  function updateCombo() {
    let now = Date.now();
    if(now - lastPointTime < 2000) combo++; else combo=1;
    if(combo>10) combo=10;
    lastPointTime = now;
    comboCountSpan.innerText = combo;
    if(combo>bestComboGlobal) { bestComboGlobal=combo; bestComboDisplay.innerText=combo; localStorage.setItem('bestComboGlobal',combo); }
  }
  function loseLife() {
    if(invincibleFrames) return;
    lives--;
    livesSpan.innerText = lives;
    screenShake();
    playHitSound();
    whiteFlashEffect();
    let rect = playerDiv.getBoundingClientRect();
    createBloodParticles(rect.left+rect.width/2, rect.top+rect.height/2, true);
    invincibleFrames = true;
    if(invincibleTimer) clearTimeout(invincibleTimer);
    invincibleTimer = setTimeout(()=>{ invincibleFrames=false; }, 1000);
    if(lives<=0) gameOver();
  }
  function addLife() { lives++; livesSpan.innerText = lives; }

  // ---------- آیتم‌ها ----------
  function spawnItem() {
    let types = ['heart','lightning','shield','slow','multishot'];
    let type = types[Math.floor(Math.random()*types.length)];
    let itemDiv = document.createElement('div');
    itemDiv.className = `item item-${type}`;
    let x = Math.random() * (game.clientWidth-50) + 25;
    let y = Math.random() * (game.clientHeight-50) + 25;
    itemDiv.style.left = x+'px'; itemDiv.style.top = y+'px';
    itemsContainer.appendChild(itemDiv);
    items.push({ element: itemDiv, type, x, y });
  }
  function updateItems() {
    for(let i=0;i<items.length;i++) {
      let it = items[i];
      let itemRect = it.element.getBoundingClientRect();
      let playerRect = playerDiv.getBoundingClientRect();
      if(itemRect.right > playerRect.left && itemRect.left < playerRect.right &&
         itemRect.bottom > playerRect.top && itemRect.top < playerRect.bottom) {
        activateItem(it.type);
        it.element.remove(); items.splice(i,1); i--;
      }
    }
  }
  function activateItem(type) {
    playPowerupSound();
    switch(type) {
      case 'heart': addLife(); break;
      case 'lightning':
        attackCooldownTime = Math.max(attackCooldownTime-50, 100);
        setTimeout(()=>{ attackCooldownTime = 200 - attackCooldownReduction*2; }, 8000);
        break;
      case 'shield':
        shieldActive = true;
        if(shieldTimer) clearTimeout(shieldTimer);
        shieldTimer = setTimeout(()=>{ shieldActive=false; }, 5000);
        break;
      case 'slow':
        slowActive = true;
        for(let e of enemies) e.speed *= 0.5;
        if(slowTimer) clearTimeout(slowTimer);
        slowTimer = setTimeout(()=>{
          slowActive=false;
          for(let e of enemies) e.speed /= 0.5;
        }, 5000);
        break;
      case 'multishot':
        multishotActive = true;
        setTimeout(()=>{ multishotActive=false; }, 5000);
        break;
    }
  }

  // ---------- حلقه اصلی ----------
  function gameLoop() {
    if(!gameActive) return;
    updateEnemies();
    updateItems();
    if(mode==='timeattack') {
      timeRemaining -= 1/60;
      timerSpan.innerText = Math.max(0, Math.floor(timeRemaining));
      if(timeRemaining <= 0) gameOver();
    }
    if(mode==='endless') {
      for(let e of enemies) e.speed += 0.002;
    }
    animationId = requestAnimationFrame(gameLoop);
  }

  // ---------- رویداد حمله ----------
  function handleAttack(e) {
    if(!gameActive) return;
    e.preventDefault();
    attack();
  }
  game.addEventListener('click', handleAttack);
  window.addEventListener('keydown', (e) => {
    if(e.code === 'Space' && gameActive) {
      e.preventDefault();
      attack();
    }
    if(e.code === 'Space' && !mainMenu.classList.contains('hidden')) {
      e.preventDefault();
      startBtn.click();
    }
  });
  game.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- فروشگاه در بازی ----------
  function openShop() {
    document.getElementById('shopPanel').classList.remove('hidden');
  }
  menuShopBtn.onclick = openShop;
  inGameShopBtn.onclick = openShop;
  closeShop.onclick = () => document.getElementById('shopPanel').classList.add('hidden');
  achievementsBtn.onclick = () => {
    let list = document.getElementById('achievementsList');
    list.innerHTML = '';
    let achievements = [
      {name:"10 کومبو", condition:bestComboGlobal>=10, reward:"50 سکه"},
      {name:"100 کشته", condition:totalKillsAllTime>=100, reward:"100 سکه"},
      {name:"اولین باس", condition:totalKillsAllTime>=5, reward:"شخصیت جدید"},
    ];
    achievements.forEach(a=>{ let li=document.createElement('li'); li.innerText=`${a.name} ${a.condition?'✅':'❌'} (${a.reward})`; list.appendChild(li); });
    document.getElementById('achievementsPanel').classList.remove('hidden');
  };
  closeAchievements.onclick = () => document.getElementById('achievementsPanel').classList.add('hidden');
  buyLife.onclick = () => { if(totalCoins>=200) { totalCoins-=200; extraLife++; localStorage.setItem('extraLife',extraLife); totalCoinsSpan.innerText=totalCoins; alert('ارتقا خریداری شد!'); playUpgradeSound(); } else alert('سکه کافی نیست'); };
  buyAttackSpeed.onclick = () => { if(totalCoins>=150) { totalCoins-=150; attackCooldownReduction++; localStorage.setItem('attackCooldownReduction',attackCooldownReduction); totalCoinsSpan.innerText=totalCoins; alert('ارتقا خریداری شد!'); playUpgradeSound(); } else alert('سکه کافی نیست'); };
  buyCoinBonus.onclick = () => { if(totalCoins>=300) { totalCoins-=300; coinBonus=1.5; localStorage.setItem('coinBonus',coinBonus); totalCoinsSpan.innerText=totalCoins; alert('ارتقا خریداری شد!'); playUpgradeSound(); } else alert('سکه کافی نیست'); };
  buyStartPowerup.onclick = () => { if(totalCoins>=500) { totalCoins-=500; startPowerup=true; localStorage.setItem('startPowerup','true'); totalCoinsSpan.innerText=totalCoins; alert('ارتقا خریداری شد!'); playUpgradeSound(); } else alert('سکه کافی نیست'); };

  // ---------- شروع و پایان ----------
  function startGame() {
    gameActive = true;
    playerX = game.clientWidth/2;
    playerY = game.clientHeight/2;
    playerDiv.style.left = (playerX-30)+'px';
    playerDiv.style.top = (playerY-30)+'px';
    lives = 3 + extraLife;
    points = 0; combo = 0; coins = 0; stageCounter = 0; currentStage = 1; killsSinceLastMessage = 0;
    enemies = []; items = [];
    enemyContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    scoreSpan.innerText = '0'; comboCountSpan.innerText = '0'; livesSpan.innerText = lives;
    coinsSpan.innerText = '0'; levelSpan.innerText = '1';
    timeRemaining = mode==='timeattack' ? 60 : 0;
    timerSpan.innerText = '0';
    bossActive = false; bossHealthBar.classList.add('hidden');
    currentBackgroundIndex = 0;
    game.style.backgroundImage = `url('${BACKGROUNDS[0]}')`;
    if(startPowerup) activateItem('lightning');
    let spawnInterval = difficulty==='easy' ? 1500 : difficulty==='normal' ? 1200 : 900;
    normalSpawnDelay = spawnInterval;
    bossSpawnDelay = spawnInterval * 2;
    if(enemiesSpawnInterval) clearInterval(enemiesSpawnInterval);
    enemiesSpawnInterval = setInterval(() => {
      if(gameActive && !bossActive && enemies.length < 8) spawnEnemy();
      else if(gameActive && bossActive && enemies.length < 3) spawnEnemy();
    }, normalSpawnDelay);
    setInterval(() => { if(gameActive) spawnItem(); }, 10000);
    animationId = requestAnimationFrame(gameLoop);
    startMusic();
  }
  function gameOver() {
    gameActive = false;
    if(animationId) cancelAnimationFrame(animationId);
    if(enemiesSpawnInterval) clearInterval(enemiesSpawnInterval);
    stopMusic();
    let overlay = document.createElement('div');
    overlay.className = 'gameover-overlay';
    overlay.innerHTML = `<div class="gameover-text">💀 باختی ! 💀</div>
      <div>امتیاز: ${points}</div><div>سکه: ${coins}</div>
      <button class="restart-btn" id="gameoverRestart">🔄 دوباره</button>
      <button class="restart-btn" id="gameoverMenu">🏠 منو</button>`;
    game.appendChild(overlay);
    document.getElementById('gameoverRestart').onclick = () => { overlay.remove(); fullRestart(); };
    document.getElementById('gameoverMenu').onclick = () => { overlay.remove(); showMainMenu(); };
  }
  function fullRestart() {
    if(gameOverlay) gameOverlay.remove();
    gameContainer.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    startGameFromMenu();
  }
  function showMainMenu() {
    gameActive = false;
    if(animationId) cancelAnimationFrame(animationId);
    if(enemiesSpawnInterval) clearInterval(enemiesSpawnInterval);
    stopMusic();
    gameContainer.classList.add('hidden');
    mainMenu.classList.remove('hidden');
  }
  function startGameFromMenu() {
    mainMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    startGame();
  }

  // ---------- شخصیت، سختی، حالت ----------
  function setCharacter(char) {
    currentChar = char;
    playerDiv.classList.remove('character-amir','character-koshte','character-sarbaz');
    if(char==='amir') playerDiv.classList.add('character-amir');
    else if(char==='koshte') playerDiv.classList.add('character-koshte');
    else playerDiv.classList.add('character-sarbaz');
    document.querySelectorAll('.char-btn').forEach(btn=>btn.classList.remove('active'));
    if(char==='amir') charAmir.classList.add('active');
    else if(char==='koshte') charKoshte.classList.add('active');
    else charSarbaz.classList.add('active');
  }
  function setDifficulty(level) {
    difficulty = level;
    document.querySelectorAll('.diff-btn').forEach(btn=>btn.classList.remove('active'));
    if(level==='easy') diffEasy.classList.add('active');
    else if(level==='normal') diffNormal.classList.add('active');
    else diffHard.classList.add('active');
  }
  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode-btn').forEach(btn=>btn.classList.remove('active'));
    if(m==='normal') modeNormal.classList.add('active');
    else if(m==='timeattack') modeTimeAttack.classList.add('active');
    else modeEndless.classList.add('active');
  }
  charAmir.onclick = ()=>setCharacter('amir');
  charKoshte.onclick = ()=>setCharacter('koshte');
  charSarbaz.onclick = ()=>setCharacter('sarbaz');
  diffEasy.onclick = ()=>setDifficulty('easy');
  diffNormal.onclick = ()=>setDifficulty('normal');
  diffHard.onclick = ()=>setDifficulty('hard');
  modeNormal.onclick = ()=>setMode('normal');
  modeTimeAttack.onclick = ()=>setMode('timeattack');
  modeEndless.onclick = ()=>setMode('endless');
  startBtn.onclick = () => { initAudio(); startGameFromMenu(); };
  backToMenuBtn.onclick = showMainMenu;
  document.getElementById('menuHowBtn').onclick = () => alert("🎮 نحوه بازی:\nماوس را حرکت بده.\nبا کلیک چپ یا Space به نزدیک‌ترین دشمن شلیک کن.\nهر 5 کشته = مرحله جدید و پیام تشویقی.\nهر مرحله 5 یک باس (دشمنان عادی هم در زمان باس ظاهر می‌شوند).\nآیتم‌ها را جمع کن.\nسکه‌ها را در فروشگاه خرج کن.");

  setCharacter('amir'); setDifficulty('easy'); setMode('normal');
  gameActive = false;
})();