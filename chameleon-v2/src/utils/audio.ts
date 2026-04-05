type LegacyAudioWindow = Window & {
    webkitAudioContext?: typeof AudioContext;
};

const AudioContextClass = window.AudioContext || (window as LegacyAudioWindow).webkitAudioContext;
let audioCtx: AudioContext | null = null;

let bgmAudio: HTMLAudioElement | null = null;

export function initAudio() {
    if (!AudioContextClass) {
        return;
    }

    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/** 游戏开始时播放背景音乐（需用户交互后调用） */
export function startBgm() {
    if (!bgmAudio) {
        bgmAudio = new Audio('/assets/bgm.mp3');
        bgmAudio.loop = true;
        bgmAudio.volume = 0.35;
    }
    if (bgmAudio.paused) {
        bgmAudio.play().catch(() => {}); // 忽略自播拦截错误
    }
}

/** 游戏结束时停止背景音乐 */
export function stopBgm() {
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
}

function playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
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

export function playShootSound() {
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

export function playEatSound() {
    playTone(600, 'sine', 0.1, 0.4);
    setTimeout(() => playTone(880, 'sine', 0.15, 0.4), 80);
}

export function playBurpSound() {
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

export function playWinSound() {
    const ctx = audioCtx;
    if (!ctx) return;
    const notes = [523, 659, 784, 1047]; 
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
    setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1047, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1318, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.0);
    }, 600);
}

export function playLoseSound() {
    const ctx = audioCtx;
    if (!ctx) return;
    const notes = [392, 349, 311, 261]; 
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.22);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.22);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + i * 0.22 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.22 + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.22);
        osc.stop(ctx.currentTime + i * 0.22 + 0.42);
    });
    setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 1.5);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
    }, 900);
}
