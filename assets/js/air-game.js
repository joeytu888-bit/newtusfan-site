(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-air-game]');
  Array.prototype.forEach.call(roots, function (root) {
    var canvas = root.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var startButton = root.querySelector('[data-game-start]');
    var pauseButton = root.querySelector('[data-game-pause]');
    var scoreNode = root.querySelector('[data-game-score]');
    var livesNode = root.querySelector('[data-game-lives]');
    var messageNode = root.querySelector('[data-game-message]');
    var lang = root.getAttribute('data-lang') === 'zh' ? 'zh' : 'en';
    var W = 720, H = 480, running = false, started = false, last = 0;
    var score = 0, lives = 3, spawnTimer = 0, shotTimer = 0;
    var player, bullets, enemies, stars, keys = {};
    var copy = lang === 'zh' ? {
      start: '开始游戏', restart: '重新开始', pause: '暂停', resume: '继续',
      ready: '点击开始，移动飞机躲避敌机。', paused: '游戏已暂停', over: '游戏结束 · 得分 '
    } : {
      start: 'Start game', restart: 'Play again', pause: 'Pause', resume: 'Resume',
      ready: 'Press start, then move to dodge incoming aircraft.', paused: 'Game paused', over: 'Game over · Score '
    };

    function reset() {
      score = 0; lives = 3; spawnTimer = 0; shotTimer = 0;
      player = { x: W / 2, y: H - 58, w: 34, h: 38, targetX: W / 2, invincible: 0 };
      bullets = []; enemies = [];
      stars = Array.from({ length: 55 }, function () {
        return { x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .3, speed: Math.random() * 28 + 12 };
      });
      updateHud();
    }

    function updateHud() {
      scoreNode.textContent = score;
      livesNode.textContent = lives;
    }

    function setMessage(text, show) {
      messageNode.textContent = text;
      messageNode.classList.toggle('is-hidden', !show);
    }

    function start() {
      if (!started || lives <= 0) reset();
      started = true; running = true; last = performance.now();
      startButton.textContent = copy.restart;
      pauseButton.disabled = false;
      pauseButton.textContent = copy.pause;
      setMessage('', false);
      requestAnimationFrame(loop);
    }

    function togglePause() {
      if (!started || lives <= 0) return;
      running = !running;
      pauseButton.textContent = running ? copy.pause : copy.resume;
      setMessage(running ? '' : copy.paused, !running);
      if (running) { last = performance.now(); requestAnimationFrame(loop); }
    }

    function hit(a, b) {
      return a.x - a.w / 2 < b.x + b.w / 2 && a.x + a.w / 2 > b.x - b.w / 2 &&
        a.y - a.h / 2 < b.y + b.h / 2 && a.y + a.h / 2 > b.y - b.h / 2;
    }

    function update(dt) {
      stars.forEach(function (s) { s.y += s.speed * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
      var direction = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
      if (direction) player.targetX += direction * 330 * dt;
      player.targetX = Math.max(24, Math.min(W - 24, player.targetX));
      player.x += (player.targetX - player.x) * Math.min(1, dt * 14);
      player.invincible = Math.max(0, player.invincible - dt);

      shotTimer -= dt;
      if (shotTimer <= 0) {
        bullets.push({ x: player.x, y: player.y - 25, w: 4, h: 14, speed: 520 });
        shotTimer = .22;
      }
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        var size = 25 + Math.random() * 16;
        enemies.push({ x: 28 + Math.random() * (W - 56), y: -30, w: size, h: size, speed: 95 + Math.min(170, score * 1.5) + Math.random() * 55 });
        spawnTimer = Math.max(.28, .78 - score * .004);
      }

      bullets.forEach(function (b) { b.y -= b.speed * dt; });
      enemies.forEach(function (e) { e.y += e.speed * dt; });

      for (var i = enemies.length - 1; i >= 0; i--) {
        var enemy = enemies[i];
        var destroyed = false;
        for (var j = bullets.length - 1; j >= 0; j--) {
          if (hit(enemy, bullets[j])) {
            enemies.splice(i, 1); bullets.splice(j, 1); score += 10; destroyed = true; updateHud(); break;
          }
        }
        if (destroyed) continue;
        if (enemy.y > H + 35) { enemies.splice(i, 1); continue; }
        if (player.invincible <= 0 && hit(enemy, player)) {
          enemies.splice(i, 1); lives -= 1; player.invincible = 1.25; updateHud();
          if (lives <= 0) {
            running = false; pauseButton.disabled = true; setMessage(copy.over + score, true);
          }
        }
      }
      bullets = bullets.filter(function (b) { return b.y > -20; });
    }

    function drawPlane(x, y, scale, color, enemy) {
      ctx.save(); ctx.translate(x, y); if (enemy) ctx.rotate(Math.PI);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, -20 * scale); ctx.lineTo(10 * scale, 8 * scale);
      ctx.lineTo(22 * scale, 15 * scale); ctx.lineTo(7 * scale, 14 * scale);
      ctx.lineTo(4 * scale, 21 * scale); ctx.lineTo(-4 * scale, 21 * scale);
      ctx.lineTo(-7 * scale, 14 * scale); ctx.lineTo(-22 * scale, 15 * scale);
      ctx.lineTo(-10 * scale, 8 * scale); ctx.closePath(); ctx.fill(); ctx.restore();
    }

    function draw() {
      var gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#07182d'); gradient.addColorStop(1, '#0d3f68');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      stars.forEach(function (s) { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#8edbff'; bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y - 8, 4, 14); });
      enemies.forEach(function (e) { drawPlane(e.x, e.y, e.w / 42, '#ef8354', true); });
      if (player.invincible <= 0 || Math.floor(player.invincible * 10) % 2 === 0) drawPlane(player.x, player.y, .9, '#f7fbff', false);
    }

    function loop(now) {
      if (!running) { draw(); return; }
      var dt = Math.min(.034, (now - last) / 1000); last = now;
      update(dt); draw();
      if (running) requestAnimationFrame(loop);
    }

    function point(event) {
      var rect = canvas.getBoundingClientRect();
      player.targetX = (event.clientX - rect.left) * W / rect.width;
    }

    canvas.addEventListener('pointerdown', function (e) { if (started) { canvas.setPointerCapture(e.pointerId); point(e); } });
    canvas.addEventListener('pointermove', function (e) { if (started && (e.pointerType === 'mouse' || e.buttons)) point(e); });
    window.addEventListener('keydown', function (e) { keys[e.key] = true; if (['ArrowLeft', 'ArrowRight', ' '].indexOf(e.key) >= 0 && document.activeElement === canvas) e.preventDefault(); });
    window.addEventListener('keyup', function (e) { keys[e.key] = false; });
    startButton.addEventListener('click', start);
    pauseButton.addEventListener('click', togglePause);
    document.addEventListener('visibilitychange', function () { if (document.hidden && running) togglePause(); });
    reset(); draw(); setMessage(copy.ready, true); pauseButton.disabled = true;
  });
})();