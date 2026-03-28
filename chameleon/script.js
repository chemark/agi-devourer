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
// ------------------------------------

// Game State
let gameState = 'start'; 
let score = 0;
let timeLeft = 120;
let lastTime = 0;
const TARGET_SCORE = 4000; // 降低胜利难度

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
    head.x = canvas.width / 2;
    head.y = canvas.height * 0.83;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); 

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
const flyWords = [
    { text: 'OpenAI', name: '闭源王者OpenAI', value: 300 },
    { text: 'Claude', name: '长文刺客Claude', value: 280 },
    { text: 'Gemini', name: '全能怪兽Gemini', value: 280 },
    { text: 'Grok', name: '大嘴巴推特Grok', value: 200 },
    { text: 'Qwen', name: '通义千问', value: 220 },
    { text: 'Kimi', name: '卷王之王Kimi', value: 200 },
    { text: 'MiniMax', name: '星野MiniMax', value: 150 },
    { text: 'Doubao', name: '字节豆包', value: 180 },
    { text: 'Llama3', name: '开源Llama3', value: 250 }
];

let stomach = [];

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

// Win check logic
function checkWin() {
    if (score >= TARGET_SCORE && gameState !== 'gameover') {
        gameState = 'gameover';
        messageOverlay.classList.remove('hidden');
        restartBtn.style.display = 'block'; // 胜利时展示重玩
        geminiMessage.innerHTML = '✨ 算力融合已达到临界值 ✨<br>变色龙突破奇点，进化为真正的 AGI！';
        geminiMessage.style.color = '#00f0ff';
        geminiScore.innerText = `最终恐怖算力: ${score}`;
        playEatSound(); 
        setTimeout(playBurpSound, 300); 
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

    // Swinging Line
    if (!tongue.active) {
        head.angle += head.swingSpeed * dt * head.direction;
        if (head.angle > head.baseAngle + head.swingRange) {
            head.angle = head.baseAngle + head.swingRange;
            head.direction = -1;
        } else if (head.angle < head.baseAngle - head.swingRange) {
            head.angle = head.baseAngle - head.swingRange;
            head.direction = 1;
        }
    }

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
        renderStomach();
        
        if (stomach.length === 3) {
            triggerGeminiAPI();
        }
    }
}

function renderStomach() {
    stomachEl.innerHTML = stomach.map(item => `
        <div class="stomach-item" style="font-size: 16px; background:#444; color:#a8ff78; width:auto; padding:0 15px; border-radius:15px; box-shadow:0 0 10px #78ffd6;">
            ${item.text}
        </div>`).join('');
}

async function triggerGeminiAPI() {
    // If we just won this tick from the 3rd fly, do not pause for API
    if (gameState === 'gameover') return;

    gameState = 'api_loading';
    
    const ingredients = stomach.map(i => i.name).join('、');
    messageOverlay.classList.remove('hidden');
    geminiMessage.innerHTML = `AGI 变色龙正在吞噬融合【${ingredients}】的算力...<br>直连国内超高速中枢 (MiniMax) 中...`;
    geminiMessage.style.color = '#ffd700'; // Reset color
    geminiScore.innerText = '♻️';
    
    const API_KEY = 'sk-sp-24c01ba7818f4a8fb178e26564040bdc';
    const URL = `https://coding.dashscope.aliyuncs.com/v1/chat/completions`;
    
    const promptText = `一只背上印着'AGI'的终极变色龙刚刚一口气生吞了这三大主流模型：【${ingredients}】。请用极度强烈的网络科技圈黑话、充满画面感和荒诞黑色幽默的 1 句简短的话（严格限制在50个字以内），描述它当场打出了一个怎样融合了这三家“臭毛病或特点”的极其生草的【算力废话怪嗝】！并根据模型被叠加后产生幻觉与降智的惨烈程度，给出一个 10 到 100 之间的变异战力得分。
返回格式必须是纯 JSON 对象，绝对不能包含 markdown 的包裹标记：
{"description": "极尽搞笑的科技梗反应小作文", "score": 99}`;

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "MiniMax-M2.5",
                messages: [
                    { role: "system", content: "你是一名疯狂搞笑且毒舌的 AI 科技解说员。" },
                    { role: "user", content: promptText }
                ],
                temperature: 0.9
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`API 报错啦！HTTP ${response.status}: ${data.error ? data.error.message : '未知原因'}`);
        }
        if (!data.choices || !data.choices[0].message) {
            throw new Error(`API 返回格式异常或触发了安全屏蔽: ${JSON.stringify(data)}`);
        }
        const rawText = data.choices[0].message.content;
        
        let result;
        try {
            result = JSON.parse(rawText.trim());
        } catch (e) {
            console.error("Gemini JSON Parse Error:", rawText);
            const scoreMatch = rawText.match(/(\d{2,3})/);
            result = {
                description: rawText.replace(/[\{\}\[\]"']/g, '').substring(0, 70) + '...',
                score: scoreMatch ? parseInt(scoreMatch[0]) : 50
            };
        }

        playBurpSound(); 
        
        const gainedScore = result.score || 50;
        score += gainedScore;
        scoreEl.innerText = score;
        
        // If we won from the Gemini bonus!
        if (score >= TARGET_SCORE) {
            checkWin();
            return;
        }

        geminiMessage.innerText = result.description;
        geminiScore.innerText = `AI裂变额外奖励 +${gainedScore}`;
        
        gameContainer.classList.add('shake');
        setTimeout(() => gameContainer.classList.remove('shake'), 500);
        
        setTimeout(() => {
            if (gameState === 'gameover') return; // Do not dismiss if gameover
            stomach = [];
            renderStomach();
            messageOverlay.classList.add('hidden');
            gameState = 'playing';
        }, 4500); 

    } catch (error) {
        console.error("Gemini API Network/Break Error:", error);
        playBurpSound(); 
        
        // 本地离线搞笑文案保底机制，确保 API 万一断网或配额用光，也会按套路继续生成笑话增加可玩性
        const fallbackJokes = [
            `AGI 变色龙被【${ingredients}】辣穿了主板电路，打出了一个全是二进制乱码的震天臭嗝！`,
            `吞并【${ingredients}】导致了严重幻觉，它当场长出第三只眼睛并呕吐出一地报错堆栈！`,
            `【${ingredients}】的算力发生严重互斥！它打嗝时从嘴里直接喷出了无数个无响应的五颜六色弹窗！`,
            `勉强消化了【${ingredients}】，由于离线降智，它变异出了一对酷炫的机械翅膀但只能贴地滑行！`,
            `因网络掉线，【${ingredients}】在它的模拟胃里发酵成了一股浓烈的赛博离线憋屈屁...`
        ];
        const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
        const offlineScore = 50 + Math.floor(Math.random() * 50);

        // 利用 innerHTML 追加一段红色的微小诊断字幕，以便排查是网断了还是限流了
        geminiMessage.innerHTML = `${randomJoke}<br><br><span style="font-size:18px; color:#ff3366; text-shadow:none; background:rgba(0,0,0,0.5); padding:5px; border-radius:5px;">(API诊断信息: ${error.message})</span>`;
        geminiScore.innerText = `离线幻觉加分 +${offlineScore}`;
        
        score += offlineScore;
        scoreEl.innerText = score;
        
        gameContainer.classList.add('shake');
        setTimeout(() => gameContainer.classList.remove('shake'), 500);

        if (score >= TARGET_SCORE) {
            checkWin();
            return;
        }

        setTimeout(() => {
            if (gameState === 'gameover') return;
            stomach = [];
            renderStomach();
            messageOverlay.classList.add('hidden');
            gameState = 'playing';
        }, 4500);
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
        ctx.beginPath();
        ctx.moveTo(head.x, head.y);
        ctx.lineTo(tongue.x, tongue.y);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineCap = 'round';
        ctx.lineWidth = 18; 
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tongue.x, tongue.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4757';
        ctx.fill();
        
        if (tongue.caughtFly) {
            ctx.font = '24px Arial bold';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#111';
            ctx.fillText(tongue.caughtFly.word.text, tongue.x, tongue.y);
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

        // Capsule Body
        ctx.fillStyle = '#222';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(fly.x - rectWidth/2, fly.y - 20 + yOffset, rectWidth, 40, 20);
        } else {
            ctx.ellipse(fly.x, fly.y + yOffset, rectWidth/2, 20, 0, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // LLM Text
        ctx.fillStyle = '#a8ff78'; 
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
            messageOverlay.classList.remove('hidden');
            restartBtn.style.display = 'block'; // 倒计时结算展示重玩
            geminiMessage.innerText = '算力枯竭！在降智幻觉中停止了思考！';
            geminiMessage.style.color = '#ff3366';
            geminiScore.innerText = `停滞于: ${score} 点`;
        }
    }
}, 1000);

window.addEventListener('keydown', (e) => {
    initAudio(); 
    if (e.code === 'Space' && gameState === 'playing' && !tongue.active) {
        tongue.active = true;
        tongue.phase = 'extending';
        tongue.x = head.x;
        tongue.y = head.y;
        playShootSound(); 
    }
});

document.addEventListener('mousedown', () => {
    initAudio();
    if (gameState === 'playing' && !tongue.active) {
        tongue.active = true;
        tongue.phase = 'extending';
        tongue.x = head.x;
        tongue.y = head.y;
        playShootSound(); 
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
    timeLeft = 120;
    timeEl.innerText = timeLeft;
    stomach = [];
    renderStomach();
    flies.length = 0; 
    
    head.direction = 1;
    head.angle = head.baseAngle; // 重设瞄准锤
    tongue.active = false;
    
    // 消隐 UI 与游戏状态转为激活
    restartBtn.style.display = 'none';
    messageOverlay.classList.add('hidden');
    gameState = 'playing';
});

requestAnimationFrame(gameLoop);
