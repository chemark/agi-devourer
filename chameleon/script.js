const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- AUDIO SYSTEM (Web Audio API) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    // 背景音乐：第一次用户交互时启动（浏览器要求必须有用户操作才能自播）
    const bgm = document.getElementById('bgm');
    if (bgm && bgm.paused) {
        bgm.volume = 0.35; // 较低音量，不掩盖音效
        bgm.play().catch(() => {}); // 忽略自播拦截错误
    }
}

function playTone(freq, type, duration, vol=0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; 
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime); 
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playShootSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

function playEatSound() {
    playTone(600, 'sine', 0.1, 0.4);
    setTimeout(() => playTone(880, 'sine', 0.15, 0.4), 80);
}

function playBurpSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 1.2);
    osc.detune.setValueAtTime(0, audioCtx.currentTime);
    osc.detune.linearRampToValueAtTime(500, audioCtx.currentTime + 0.2);
    osc.detune.linearRampToValueAtTime(-500, audioCtx.currentTime + 0.6);
    osc.detune.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
    gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
}

// 胜利音效：上升多阶山 fanfare（小尔多式和弦上迸）
function playWinSound() {
    if (!audioCtx) return;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.15);
        osc.stop(audioCtx.currentTime + i * 0.15 + 0.4);
    });
    // 最后来一个连续长馌音
    setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1047, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(1318, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.0);
    }, 600);
}

// 失败音效：下降沪谣步法（起侏魂音乐风）
function playLoseSound() {
    if (!audioCtx) return;
    const notes = [392, 349, 311, 261]; // G4 F4 Eb4 C4 下行
    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.22);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + i * 0.22);
        gain.gain.linearRampToValueAtTime(0.28, audioCtx.currentTime + i * 0.22 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.22 + 0.38);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.22);
        osc.stop(audioCtx.currentTime + i * 0.22 + 0.42);
    });
    // 最后拖长的一声屯丢音
    setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    }, 900);
}
// ========== CSS 飘动云彩系统（独立于游戏循环）==========
function initClouds() {
    const layer = document.getElementById('cloud-layer');
    // 生成 12 朵大小/速度/位置各异的云
    for (let i = 0; i < 12; i++) {
        // 每朵云由 3-5 个重叠 div 组成，模拟蓬松积云
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        const topPct   = 5 + Math.random() * 75;   // 天空纵向位置 5%~80%
        const startX   = Math.random() * 120 - 10;  // 起始横向位置 -10%~110%
        const duration = 18 + Math.random() * 40;   // 漂移时长 18~58s（慢云远、快云近）
        const delay    = -Math.random() * duration;  // 负延迟让云一开始就在运动中
        const scale    = 0.6 + Math.random() * 1.2;  // 整体大小倍数

        wrapper.style.cssText = `
            position: absolute;
            top: ${topPct}%;
            left: ${startX}%;
            width: ${120 * scale}px; height: ${60 * scale}px;
            animation: cloudDrift ${duration}s ${delay}s linear infinite;
            opacity: ${0.55 + Math.random() * 0.35};
        `;

        // 每朵云的气泡圆
        const puffCount = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < puffCount; j++) {
            const puff = document.createElement('div');
            const r = (25 + Math.random() * 35) * scale;
            const ox = j * (30 * scale) * (0.5 + Math.random() * 0.5);
            const oy = (Math.random() - 0.5) * 20 * scale;
            puff.style.cssText = `
                position: absolute;
                width: ${r * 2}px; height: ${r * 2}px;
                border-radius: 50%;
                background: radial-gradient(ellipse at 35% 30%,
                    rgba(255,255,255,0.98) 0%,
                    rgba(225,238,255,0.82) 55%,
                    rgba(200,220,255,0) 100%);
                left: ${ox}px; top: ${oy + 10 * scale}px;
            `;
            wrapper.appendChild(puff);
        }
        layer.appendChild(wrapper);
    }
}
// =====================================

// ========== 去除变色龙 PNG 白底，实现实色显示 ==========
function removeWhiteBackground(img, threshold = 38) {
    const tmp = document.createElement('canvas');
    tmp.width  = img.naturalWidth;
    tmp.height = img.naturalHeight;
    const c = tmp.getContext('2d');
    c.drawImage(img, 0, 0);
    const id = c.getImageData(0, 0, tmp.width, tmp.height);
    const d = id.data, w = tmp.width, h = tmp.height;

    // BFS 从图片四周边缘向内洋论充，只删边缘连通的白色像素
    const visited = new Uint8Array(w * h);
    const queue = [];
    const isWhite = px => {
        const i = px * 4;
        return d[i] >= 255-threshold && d[i+1] >= 255-threshold && d[i+2] >= 255-threshold;
    };
    // 初始化四边属白色像素
    for (let x = 0; x < w; x++) { if (isWhite(x)) queue.push(x); if (isWhite((h-1)*w+x)) queue.push((h-1)*w+x); }
    for (let y = 1; y < h-1; y++) { if (isWhite(y*w)) queue.push(y*w); if (isWhite(y*w+w-1)) queue.push(y*w+w-1); }

    while (queue.length) {
        const px = queue.pop();
        if (px < 0 || px >= w*h || visited[px] || !isWhite(px)) continue;
        visited[px] = 1;
        d[px*4+3] = 0; // 透明
        const x = px % w;
        if (x > 0)   queue.push(px-1);
        if (x < w-1) queue.push(px+1);
        if (px >= w) queue.push(px-w);
        if (px < (h-1)*w) queue.push(px+w);
    }
    c.putImageData(id, 0, 0);
    return tmp.toDataURL('image/png');
}

function initTransparentChameleon() {
    const el = document.getElementById('chameleon');
    try {
        const dataUrl = removeWhiteBackground(el);
        el.src = dataUrl;
        el.style.mixBlendMode = 'normal';  // 去掉混合模式，变色龙现在实色
        el.style.filter = 'contrast(1.1) brightness(1.0) saturate(1.6)'; // 默认原色
        el.style.transition = 'filter 0.5s ease';
        console.log('✅ 变色龙白底已移除，实色模式开启');
    } catch(e) {
        console.warn('白底移除失败，保留混合模式:', e);
    }
}

// 图片加载完成后处理（如果已加载完直接调用）
const _chameleonEl = document.getElementById('chameleon');
if (_chameleonEl.complete && _chameleonEl.naturalWidth > 0) {
    initTransparentChameleon();
} else {
    _chameleonEl.addEventListener('load', initTransparentChameleon, { once: true });
}
// =====================================================

// Game State
let gameState = 'start'; 
let score = 0;
const INITIAL_TIME = 60;  // 统一管理游戏时长，修改只需改这一处
let timeLeft = INITIAL_TIME;
let lastTime = 0;
const TARGET_SCORE = 4000;

// Chameleon Head (Reticle)
const head = {
    x: 0,
    y: 0,
    baseAngle: -Math.PI / 2, 
    swingRange: Math.PI / 3.5, 
    angle: -Math.PI / 2,
    swingSpeed: 1.2, // 从 2.2 降到 1.2，允许玩家有充足的反应时间
    direction: 1
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    head.x = canvas.width * 0.50;   // 水平居中
    head.y = canvas.height * 0.68;  // 上移至变色龙嘴部高度
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
initClouds(); // 初始化云彩

// Tongue State
const tongue = {
    active: false,
    x: head.x,
    y: head.y,
    length: 0,
    targetLength: 0, 
    speed: 2500, 
    phase: 'extending', 
    caughtFly: null 
};

// Flies Array - WITH BASE VALUES
const flies = [];
// 变色龙底色是青蓝色 (色相 ≈190°)。
// hue 字段是用于 sepia 基底(≈30°)的 hue-rotate 偏移量，目标色 = 30° + hue
const flyWords = [
    { text: 'OpenAI',  name: '闭源王者OpenAI',  value: 300, hue:  90 }, // 30+90=120°  翠绿 (OpenAI)
    { text: 'Claude',  name: '长文刺客Claude',  value: 280, hue:   5 }, // 30+5=35°    珊瑚橙 (Anthropic)
    { text: 'Gemini',  name: '全能怪兽Gemini',  value: 280, hue: 180 }, // 30+180=210° 宝石蓝 (Google)
    { text: 'Grok',    name: '大嘴巴推特Grok',  value: 200, hue: 310 }, // 30+310=340° 暗玫红 (X/Twitter)
    { text: 'Qwen',    name: '通义千问',          value: 220, hue: 320 }, // 30+320=350° 中国红 (阿里)
    { text: 'Kimi',    name: '卷王之Kimi',       value: 200, hue: 150 }, // 30+150=180° 青碧 (Moonshot)
    { text: 'MiniMax', name: '星野MiniMax',       value: 150, hue: 250 }, // 30+250=280° 星空紫
    { text: 'Doubao',  name: '字节豆包',          value: 180, hue:  30 }, // 30+30=60°   金黄 (ByteDance)
    { text: 'Llama3',  name: '开源Llama3',       value: 250, hue: 215 }, // 30+215=245° Meta蓝
];

let stomach = [];
let eatenModels = []; // 记录本局吃过的所有模型（用于结局 API 调用）

// DOM Elements
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const stomachEl = document.getElementById('stomach-items');
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const messageOverlay = document.getElementById('message-overlay');
const geminiMessage = document.getElementById('gemini-message');
const geminiScore = document.getElementById('gemini-score');
const gameContainer = document.getElementById('game-container');
const restartBtn = document.getElementById('restart-btn');
const aiStoryEl = document.getElementById('ai-story');

// ===== 结局时调用 DeepSeek 生成专属故事 =====
const WORKER_URL = 'https://agi-tongue-proxy.chengchuanhao728494.workers.dev';

async function showEndgameResult(isWin) {
    // 提取本局吃过的模型名，去重 + 最多叕6个
    const uniqueModels = [...new Set(eatenModels)];
    const sample = uniqueModels.slice(0, 6);
    const modelList = sample.length > 0 ? sample.join('、') : '一个模型也没吃到';

    // 显示结算界面，先用加载提示占位
    aiStoryEl.innerHTML = '⏳ AI 正在弄文案，稍等……';

    const promptWin  = `一只变色龙在60秒内吸收了「${modelList}」，终于突破奇点进化为AGI！用60字内荒诞科技黑话写一段史诗胜利宣言，最后加一句毒舌赞语。纯JSON返回：{"story":"..."}`;
    const promptLose = `一只变色龙吸收了「${modelList}」，却只积累了${score}点，距AGI还有${Math.max(0, 4000 - score)}点就力竭而死。用60字内荒诞科技黑话写最后一嗝的气息，要幽默而凄凉。纯JSON返回：{"story":"..."}`;

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是毒舌AI科技解说员，只返回纯JSON。' },
                    { role: 'user',   content: isWin ? promptWin : promptLose }
                ],
                temperature: 1.3,
                stream: false
            })
        });
        const json = await res.json();
        const raw = json.choices?.[0]?.message?.content ?? '';
        const match = raw.match(/\{[\s\S]*?"story"\s*:\s*"([\s\S]*?)"[\s\S]*?\}/);
        const story = match ? match[1].replace(/\\n/g, ' ') : raw.slice(0, 80);
        aiStoryEl.innerHTML = `💬 ${story}`;
    } catch (e) {
        // API 失败用备用文案
        const fallback = isWin
            ? '🎵 内部AGI就序已可展开，变色龙打了一个截断半个网络的异度思维混天大嗓。'
            : '💨 局部神经元风暴完解，变色龙发出最后一个如过拟合的废气就死了。';
        aiStoryEl.innerHTML = fallback;
    }
}
// =====================================================


// Win check logic
function checkWin() {
    if (score >= TARGET_SCORE && gameState !== 'gameover') {
        gameState = 'gameover';
        const bgm = document.getElementById('bgm');
        if (bgm) { bgm.pause(); bgm.currentTime = 0; }
        playWinSound();
        messageOverlay.classList.remove('hidden');
        messageOverlay.style.background = 'rgba(0, 40, 20, 0.93)';
        restartBtn.style.display = 'block';
        document.getElementById('continue-hint').style.display = 'none';
        geminiMessage.innerHTML = '✨ AGI 诞生！变色龙突破奇点 ✨';
        geminiMessage.style.color = '#00f0ff';
        geminiScore.innerText = `最终算力: ${score} 点`;
        playEatSound();
        setTimeout(playBurpSound, 300);
        showEndgameResult(true); // 🤖 调用 DeepSeek 生成胜利故事
    }
}

function spawnFly() {
    const maxFlies = Math.max(8, Math.floor(canvas.width / 150)); 
    if (flies.length >= maxFlies) return;
    
    const wordObj = flyWords[Math.floor(Math.random() * flyWords.length)];
    
    flies.push({
        x: Math.random() < 0.5 ? -100 : canvas.width + 100,
        y: 50 + Math.random() * (canvas.height * 0.6), 
        vx: (Math.random() * 70 + 40) * (Math.random() < 0.5 ? 1 : -1), // 把横向速度废掉一半
        vy: (Math.random() * 40 - 20), // 上下乱窜的速度减半
        size: 50, 
        word: wordObj,
        hoverOffset: Math.random() * Math.PI * 2
    });
}

function checkCollision(px, py, circle) {
    const dx = px - circle.x;
    const dy = py - circle.y;
    // 宽幅判定：把舌头红球的半径（25px）也计算进命中范围，达成“擦边即死”的神级命中率
    const hitRadius = circle.size + 25; 
    return (dx * dx + dy * dy) <= (hitRadius * hitRadius);
}

function update(dt) {
    if (gameState !== 'playing') return;

    // 头部角度现在由 mousemove 事件实时更新，这里只做其他逻辑

    // Tongue logic
    if (tongue.active) {
        if (tongue.phase === 'extending') {
            tongue.length += tongue.speed * dt;
            tongue.x = head.x + Math.cos(head.angle) * tongue.length;
            tongue.y = head.y + Math.sin(head.angle) * tongue.length;

            if (tongue.x < 0 || tongue.x > canvas.width || tongue.y < 0) {
                tongue.phase = 'retracting';
            }

            for (let i = flies.length - 1; i >= 0; i--) {
                if (checkCollision(tongue.x, tongue.y, flies[i])) {
                    tongue.caughtFly = flies[i];
                    
                    // Add base score directly
                    score += flies[i].word.value;
                    scoreEl.innerText = score;
                    
                    flies.splice(i, 1);
                    tongue.phase = 'retracting';
                    playEatSound(); 
                    
                    checkWin(); // Check for win immediately
                    break;
                }
            }
        } else if (tongue.phase === 'retracting') {
            tongue.length -= tongue.speed * dt;
            if (tongue.length <= 0) {
                tongue.active = false;
                tongue.length = 0;
                if (tongue.caughtFly) {
                    digestFly(tongue.caughtFly);
                    tongue.caughtFly = null;
                }
            }
            tongue.x = head.x + Math.cos(head.angle) * tongue.length;
            tongue.y = head.y + Math.sin(head.angle) * tongue.length;
        }
    }

    if (Math.random() < 0.03) spawnFly();

    flies.forEach(fly => {
        fly.x += fly.vx * dt;
        fly.y += fly.vy * dt;
        fly.hoverOffset += dt * 5;
        
        if (fly.x > canvas.width + 100) fly.x = -100;
        if (fly.x < -100) fly.x = canvas.width + 100;
        if (fly.y < 20) fly.vy = Math.abs(fly.vy); 
        if (fly.y > canvas.height * 0.7) fly.vy = -Math.abs(fly.vy); 
    });
}

function digestFly(fly) {
    if (stomach.length < 3) {
        stomach.push(fly.word);
        eatenModels.push(fly.word.name); // 📝 记录本局吃过的模型
        renderStomach();
        // 吃到哪个模型就变成该模型的专属品牌色
        // grayscale+sepia 先归一化色调，再 hue-rotate 染上精确颜色
        const hue = fly.word.hue ?? 0;
        const cEl = document.getElementById('chameleon');
        cEl.style.filter = `grayscale(1) sepia(1) hue-rotate(${hue}deg) saturate(4) brightness(0.92)`;

        if (stomach.length === 3) {
            triggerCombo();
        }
    }
}


function renderStomach() {
    stomachEl.innerHTML = stomach.map(item => `
        <div class="stomach-item" style="font-size: 16px; background:#444; color:#a8ff78; width:auto; padding:0 15px; border-radius:15px; box-shadow:0 0 10px #78ffd6;">
            ${item.text}
        </div>`).join('');
}

// 浮动得分飞字
function showFloatingScore(text, x, y) {
    const el = document.createElement('div');
    el.style.cssText = `
        position: fixed; left: ${x}px; top: ${y}px;
        transform: translateX(-50%);
        font-size: 52px; font-weight: bold;
        color: #ffd700;
        text-shadow: 0 0 15px #ff007f, 0 0 30px #ff007f;
        font-family: 'ZCOOL KuaiLe', cursive;
        pointer-events: none; z-index: 100;
        animation: floatUp 1.6s ease-out forwards;
        white-space: nowrap;
    `;
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
}

let isApiPending = false; // 防止重复触发

async function triggerCombo() {
    if (gameState === 'gameover' || isApiPending) return;
    isApiPending = true;

    const ingredients = stomach.map(i => i.name).join('、');
    // 在清空胃前先记录最后吃的模型的颜色
    const lastHue = stomach.length > 0 ? (stomach[stomach.length-1].hue ?? 0) : 0;
    stomach = [];
    renderStomach();

    const chameleonEl = document.getElementById('chameleon');
    chameleonEl.classList.add('combo-burst');
    // 1.5s 后移除动画同时重新施加品牌色，防止动画覆盖
    setTimeout(() => {
        chameleonEl.classList.remove('combo-burst');
        chameleonEl.style.filter = `grayscale(1) sepia(1) hue-rotate(${lastHue}deg) saturate(4) brightness(0.92)`;
    }, 1500);

    playBurpSound();
    gameContainer.classList.add('shake');
    setTimeout(() => gameContainer.classList.remove('shake'), 500);

    showFloatingScore('⚡ 三连！', head.x, head.y - 80);

    const WORKER_URL_COMBO = WORKER_URL; // 共用全局 Worker URL
    const promptText = `一只变色龙吞了《${ingredients}》，甦50字内荒诞科技黑话描述打出了怎样的算力怪嗓，并百个10-100的变异得分。绯JSON返回：{"description":"...","score":99}`;

    try {
        const response = await fetch(WORKER_URL_COMBO, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // API Key 已在 Worker 里
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: '你是毒舌AI科技解说员，只返回纯JSON。' },
                    { role: 'user', content: promptText }
                ],
                temperature: 1.2, stream: false
            })
        });
        const data = await response.json();
        const rawText = data.choices[0].message.content;
        let result;
        try { result = JSON.parse(rawText.trim()); }
        catch { result = { score: 50 }; }

        const gained = result.score || 50;
        score += gained;
        scoreEl.innerText = score;
        setTimeout(() => showFloatingScore(`+${gained}`, head.x, head.y - 60), 800);
        checkWin();
    } catch {
        const gained = 50 + Math.floor(Math.random() * 50);
        score += gained;
        scoreEl.innerText = score;
        setTimeout(() => showFloatingScore(`+${gained}`, head.x, head.y - 60), 800);
        checkWin();
    } finally {
        isApiPending = false;
    }
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!tongue.active && gameState === 'playing') {
        ctx.beginPath();
        ctx.setLineDash([12, 18]);
        const lineLen = Math.max(canvas.width, canvas.height);
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(head.x + Math.cos(head.angle) * lineLen, head.y + Math.sin(head.angle) * lineLen);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (tongue.active) {
        const tx = tongue.x;
        const ty = tongue.y;
        const bx = head.x;
        const by = head.y;
        const dx = tx - bx;
        const dy = ty - by;
        const len = Math.sqrt(dx*dx + dy*dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny =  ux;
        const tipAngle = Math.atan2(dy, dx);

        // === 1. 舌体：Bezier 弧线（自然肌肉弯曲） ===
        // 中间加轻微横向偏移，模拟舌头飞出时的自然弧度
        const sway = Math.sin(performance.now() * 0.005) * (len * 0.04);
        const midX = (bx + tx) / 2 + nx * sway;
        const midY = (by + ty) / 2 + ny * sway;

        const rootW = 11;  // 根部宽（嘴巴出口）
        const midW  = 10;  // 中段最饱满
        const tipW  = 5;   // 舌颈细收（连接吸盘）

        // 用 quadratic bezier 绘制舌体上下两条边
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx + nx * rootW, by + ny * rootW);
        ctx.quadraticCurveTo(midX + nx * midW, midY + ny * midW, tx + nx * tipW, ty + ny * tipW);
        ctx.lineTo(tx - nx * tipW, ty - ny * tipW);
        ctx.quadraticCurveTo(midX - nx * midW, midY - ny * midW, bx - nx * rootW, by - ny * rootW);
        ctx.closePath();

        // 舌体渐变：根部暗红 → 中段肉红 → 尖端珊瑚
        const bodyGrad = ctx.createLinearGradient(bx, by, tx, ty);
        bodyGrad.addColorStop(0.0, '#b83028');
        bodyGrad.addColorStop(0.45, '#d95248');
        bodyGrad.addColorStop(1.0,  '#e87060');
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.restore();

        // 中轴湿润高光（沿 bezier 上边画亮线）
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx + nx * rootW * 0.32, by + ny * rootW * 0.32);
        ctx.quadraticCurveTo(midX + nx * midW * 0.32, midY + ny * midW * 0.32,
                             tx  + nx * tipW  * 0.32, ty  + ny * tipW  * 0.32);
        ctx.strokeStyle = 'rgba(255, 205, 195, 0.52)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // 底侧阴影（增强圆柱立体感）
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(bx - nx * rootW * 0.75, by - ny * rootW * 0.75);
        ctx.quadraticCurveTo(midX - nx * midW * 0.75, midY - ny * midW * 0.75,
                             tx   - nx * tipW  * 0.75, ty   - ny * tipW  * 0.75);
        ctx.strokeStyle = 'rgba(100, 15, 10, 0.3)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        // 横向肌肉环纹（每隔一段一条淡暗弧线，模拟蛇形肌肉段）
        const ringCount = 7;
        for (let i = 1; i < ringCount; i++) {
            const t = i / ringCount;
            // 沿直线插值（近似 bezier 上的位置）
            const rx = bx + ux * len * t + nx * sway * Math.sin(t * Math.PI);
            const ry = by + uy * len * t + ny * sway * Math.sin(t * Math.PI);
            const rw = (rootW * (1 - t) + tipW * t) * 0.85;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(rx + nx * rw, ry + ny * rw);
            ctx.lineTo(rx - nx * rw, ry - ny * rw);
            ctx.strokeStyle = `rgba(130, 20, 15, ${0.12 + 0.05 * Math.sin(t * Math.PI)})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }

        // === 2. 舌尖：大型蘑菇状粘液吸盘 ===
        const ballR = 22;

        // 吸盘主体：沿垂直方向宽（蘑菇帽横截面），沿射出方向略压扁
        const sGrad = ctx.createRadialGradient(
            tx - ux * 5 - nx * 7, ty - uy * 5 - ny * 7, 1,
            tx, ty, ballR * 1.15
        );
        sGrad.addColorStop(0.00, '#ff8c78');  // 高光中心
        sGrad.addColorStop(0.30, '#e04040');  // 主色
        sGrad.addColorStop(0.70, '#9e1820');  // 暗部
        sGrad.addColorStop(1.00, '#5a080c');  // 最暗边缘
        ctx.save();
        ctx.beginPath();
        // 垂直于射出方向的轴更宽（ballR），射出方向上压扁（ballR * 0.68）
        ctx.ellipse(tx, ty, ballR * 0.68, ballR, tipAngle + Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = sGrad;
        ctx.fill();
        ctx.restore();

        // 前端粘液凹坑（扁椭圆形凹陷）
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
            tx + ux * (ballR * 0.28),
            ty + uy * (ballR * 0.28),
            ballR * 0.44, ballR * 0.30,
            tipAngle, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(55, 5, 5, 0.52)';
        ctx.fill();
        ctx.restore();

        // 主高光点（左上偏移，大）
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx - ux * 6 - nx * 8, ty - uy * 6 - ny * 8, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 235, 225, 0.78)';
        ctx.fill();
        ctx.restore();

        // 副高光点（更小，增加湿润感）
        ctx.save();
        ctx.beginPath();
        ctx.arc(tx - ux * 2 - nx * 12, ty - uy * 2 - ny * 12, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 235, 225, 0.42)';
        ctx.fill();
        ctx.restore();

        // === 3. 已抓住猎物：显示在舌尖上方 ===
        if (tongue.caughtFly) {
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#7b0000';
            ctx.lineWidth = 4;
            ctx.strokeText(tongue.caughtFly.word.text, tx, ty - ballR - 14);
            ctx.fillStyle = '#ffe8e0';
            ctx.fillText(tongue.caughtFly.word.text, tx, ty - ballR - 14);
        }
    }

    // Draw Flies with LLM model names
    flies.forEach(fly => {
        ctx.font = '24px "ZCOOL KuaiLe", Arial bold'; 
        const margin = 12;
        const textWidth = ctx.measureText(fly.word.text).width || 80;
        const rectWidth = Math.max(80, textWidth + margin * 2);
        const yOffset = Math.sin(fly.hoverOffset*6);
        
        // Wings
        const wingOffset = Math.sin(fly.hoverOffset * 5) * 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(fly.x - rectWidth/2 + 10, fly.y + yOffset + wingOffset, 22, 6, -Math.PI/4, 0, Math.PI*2);
        ctx.ellipse(fly.x + rectWidth/2 - 10, fly.y + yOffset - wingOffset, 22, 6, Math.PI/4, 0, Math.PI*2);
        ctx.fill();

        // Capsule Body — 用模型品牌色（sepia 基底 30° + hue 偏移 = 模型目标色）
        const modelHue = (30 + (fly.word.hue ?? 0)) % 360;
        ctx.fillStyle = `hsl(${modelHue}, 75%, 22%)`;  // 深色背景
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(fly.x - rectWidth/2, fly.y - 20 + yOffset, rectWidth, 40, 20);
        } else {
            ctx.ellipse(fly.x, fly.y + yOffset, rectWidth/2, 20, 0, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.strokeStyle = `hsl(${modelHue}, 100%, 65%)`;  // 亮色描边
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // LLM Text
        ctx.fillStyle = `hsl(${modelHue}, 100%, 85%)`;  // 浅色文字与背景形成对比
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fly.word.text, fly.x, fly.y + yOffset);

    });
}

function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

setInterval(() => {
    if (gameState === 'playing' && timeLeft > 0) {
        timeLeft--;
        timeEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            gameState = 'gameover';
            const bgm = document.getElementById('bgm');
            if (bgm) { bgm.pause(); bgm.currentTime = 0; }
            playLoseSound();
            messageOverlay.classList.remove('hidden');
            messageOverlay.style.background = 'rgba(40, 0, 0, 0.93)';
            restartBtn.style.display = 'block';
            document.getElementById('continue-hint').style.display = 'none';
            geminiMessage.innerText = '💥 算力崩溃！进化中止！';
            geminiMessage.style.color = '#ff3366';
            geminiScore.innerText = `最终算力: ${score} 点（还差 ${Math.max(0, 4000-score)} 点通关）`;
            showEndgameResult(false); // 🤖 调用 DeepSeek 生成失败坟气
        }
    }
}, 1000);

// 鼠标移动：实时计算头部瞄准角度
document.addEventListener('mousemove', (e) => {
    if (gameState !== 'playing') return;
    const dx = e.clientX - head.x;
    const dy = e.clientY - head.y;
    const raw = Math.atan2(dy, dx);
    // 限制角度范围：只允许朝上半圆射出（避免穿地）
    // -PI 到 0 是上半圆，并加少许左右处容差 15°
    const minAngle = -Math.PI * 0.97; // 左上极限
    const maxAngle = -Math.PI * 0.03; // 右上极限
    head.angle = Math.max(minAngle, Math.min(maxAngle, raw));
});

window.addEventListener('keydown', (e) => {
    initAudio(); 
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing' && !tongue.active) {
            tongue.active = true;
            tongue.phase = 'extending';
            tongue.x = head.x;
            tongue.y = head.y;
            tongue.length = 0;
            playShootSound();
        } else if (gameState === 'api_result') {
            stomach = [];
            renderStomach();
            messageOverlay.classList.add('hidden');
            gameState = 'playing';
        }
    }
});

// 鼠标点击仅用于广挟储指示层的交互（如 api_result 继续），不再触发射击
document.addEventListener('mousedown', () => {
    initAudio();
    if (gameState === 'api_result') {
        stomach = [];
        renderStomach();
        messageOverlay.classList.add('hidden');
        gameState = 'playing';
    }
});

startBtn.addEventListener('click', () => {
    initAudio(); 
    playEatSound(); 
    startScreen.style.display = 'none';
    gameState = 'playing';
});

restartBtn.addEventListener('click', () => {
    initAudio(); 
    playEatSound(); 
    
    // 复位核心战斗数据
    score = 0;
    scoreEl.innerText = score;
    timeLeft = INITIAL_TIME;
    timeEl.innerText = timeLeft;
    stomach = [];
    eatenModels = []; // 重置模型记录
    renderStomach();
    if (aiStoryEl) aiStoryEl.innerHTML = '';
    flies.length = 0; 
    
    head.direction = 1;
    head.angle = head.baseAngle;
    tongue.active = false;
    
    // 恢复继续提示的显示状态（下次触发 API 结果时需要它）
    document.getElementById('continue-hint').style.display = '';
    restartBtn.style.display = 'none';
    messageOverlay.classList.add('hidden');
    // 重启时恢复背景音乐
    const bgm = document.getElementById('bgm');
    if (bgm) { bgm.currentTime = 0; bgm.play().catch(() => {}); }
    gameState = 'playing';
});

requestAnimationFrame(gameLoop);
