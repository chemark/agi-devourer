import Phaser from 'phaser';
import { initAudio, playEatSound, playShootSound } from '../utils/audio';
import type { FlyWord, GamePhase } from '../types/game';

type FlyBehavior = 'glide' | 'wave' | 'dash' | 'evade';

interface FlyData {
  id: string;
  container: Phaser.GameObjects.Container;
  word: FlyWord;
  vx: number;
  vy: number;
  cruiseVx: number;
  cruiseVy: number;
  hoverOffset: number;
  baseHue: number;
  baseY: number;
  behavior: FlyBehavior;
  driftAmplitude: number;
  driftFrequency: number;
  dodgeCooldown: number;
  dashCooldown: number;
}

export default class GameScene extends Phaser.Scene {
  bgCanvas!: Phaser.GameObjects.Image;
  bgRawImage!: HTMLImageElement;

  chameleon!: Phaser.GameObjects.Image;
  graphics!: Phaser.GameObjects.Graphics;
  tongueGraphics!: Phaser.GameObjects.Graphics;
  head!: { x: number; y: number };

  chameleonBaseY = 0;
  chameleonScale = 1;
  bodyAnimTime = 0;
  tailWagCooldown = 2;
  tailWagPhase = -1;
  jumpState = { yOffset: 0, scaleYMod: 1 };
  isJumping = false;

  tongueAngle = -Math.PI / 2;
  swingRange = Math.PI / 3.5;
  baseSwingSpeed = 1.2;
  swingDirection = 1;
  manualAimAngle: number | null = null;
  manualAimTimerMs = 0;

  tongueActive = false;
  tongueLength = 0;
  tongueSpeed = 2500;
  tonguePhase: 'extending' | 'retracting' = 'extending';
  caughtFly: FlyData | null = null;
  score = 0;

  flies: FlyData[] = [];
  phase: GamePhase = 'start';
  elapsedPlayingMs = 0;
  lastKnownDifficulty = 1;
  registeredControls?: Window['__agiGameControls'];

  flyWords: FlyWord[] = [
    { text: 'OpenAI', name: '闭源王者 OpenAI', value: 300, hue: 90 },
    { text: 'Claude', name: '长文刺客 Claude', value: 280, hue: 5 },
    { text: 'Gemini', name: '全能怪兽 Gemini', value: 280, hue: 180 },
    { text: 'Grok', name: '大嘴巴推特 Grok', value: 200, hue: 310 },
    { text: 'Qwen', name: '通义千问', value: 220, hue: 320 },
    { text: 'Kimi', name: '卷王 Kimi', value: 200, hue: 150 },
    { text: 'MiniMax', name: '星野 MiniMax', value: 150, hue: 250 },
    { text: 'Doubao', name: '字节豆包', value: 180, hue: 30 },
    { text: 'Llama3', name: '开源 Llama3', value: 250, hue: 215 },
  ];

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('chameleon_raw', '/assets/chameleon.png');
    this.load.image('bg_raw', '/assets/bg.png');
  }

  create() {
    this.head = { x: this.scale.width * 0.5, y: this.scale.height * 0.6 };

    this.setupBackground();
    this.processChameleonTexture();

    this.chameleonBaseY = this.scale.height * 1.02;
    this.chameleon = this.add.image(this.scale.width * 0.5, this.chameleonBaseY, 'chameleon_clean');
    this.chameleon.setOrigin(0.5, 1);
    this.chameleon.setDepth(3);

    const targetHeight = this.scale.height * 0.6;
    this.chameleonScale = targetHeight / this.chameleon.height;
    this.chameleon.setScale(this.chameleonScale);

    this.graphics = this.add.graphics();
    this.graphics.setDepth(2);
    this.tongueGraphics = this.add.graphics();
    this.tongueGraphics.setDepth(4);

    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', this.shootTongue, this);
      this.input.keyboard.on('keydown-F', this.toggleFullscreen, this);
    }

    this.scale.on('resize', this.resize, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.cleanup, this);

    window.onComboTriggered = () => this.triggerJump();
    this.registeredControls = {
      fire: () => this.shootTongue(),
      setManualAim: (x: number, y: number) => this.setManualAim(x, y),
      resetAim: () => this.resetManualAim(),
      getSnapshot: () => this.serializeState(),
      advanceTime: (ms: number) => this.advanceSimulation(ms),
    };
    window.__agiGameControls = this.registeredControls;

    this.syncMouthPosition();
    this.phase = this.getRoundPhase();
  }

  cleanup() {
    this.input.off('pointerdown', this.handlePointerDown, this);
    this.input.off('pointermove', this.handlePointerMove, this);

    if (this.input.keyboard) {
      this.input.keyboard.off('keydown-SPACE', this.shootTongue, this);
      this.input.keyboard.off('keydown-F', this.toggleFullscreen, this);
    }

    this.scale.off('resize', this.resize, this);

    if (window.__agiGameControls === this.registeredControls) {
      delete window.__agiGameControls;
    }
    delete window.onComboTriggered;
  }

  update(_time: number, delta: number) {
    const dt = Math.min(delta / 1000, 0.1);
    const roundState = window.__agiRoundState;

    this.phase = roundState?.phase ?? 'start';

    if (this.phase === 'playing') {
      this.elapsedPlayingMs = roundState?.elapsedMs ?? this.elapsedPlayingMs + delta;
    }

    const difficulty = this.getDifficultyLevel();
    this.lastKnownDifficulty = difficulty;

    this.updateChameleonAnimation(dt);
    this.syncMouthPosition();
    this.updateAim(dt, difficulty);
    this.drawAimGuide();

    if (this.phase !== 'playing') {
      if (this.tongueActive) {
        this.resetTongue();
      }
      this.tongueGraphics.clear();
      return;
    }

    this.updateTongue(dt, difficulty);

    if (Math.random() < this.getSpawnChance(difficulty) * dt * 60) {
      this.spawnFly(difficulty);
    }

    this.updateFlies(dt, difficulty);
  }

  getRoundPhase(): GamePhase {
    return window.__agiRoundState?.phase ?? 'start';
  }

  getDifficultyLevel() {
    const elapsedMs = window.__agiRoundState?.elapsedMs ?? this.elapsedPlayingMs;
    const durationMs = (window.__agiRoundState?.duration ?? 60) * 1000;
    const progress = Phaser.Math.Clamp(elapsedMs / durationMs, 0, 1);
    return 1 + progress * 2.6;
  }

  getDifficultyProgress() {
    return Phaser.Math.Clamp((this.getDifficultyLevel() - 1) / 2.6, 0, 1);
  }

  updateAim(dt: number, difficulty: number) {
    if (this.manualAimTimerMs > 0) {
      this.manualAimTimerMs -= dt * 1000;
    }

    if (this.manualAimTimerMs > 0 && this.manualAimAngle !== null) {
      this.tongueAngle = Phaser.Math.Angle.RotateTo(this.tongueAngle, this.manualAimAngle, dt * 7.5);
      return;
    }

    const swingSpeed = this.baseSwingSpeed * (1 + (difficulty - 1) * 0.5);
    this.tongueAngle += swingSpeed * this.swingDirection * dt;
    const maxAngle = -Math.PI / 2 + this.swingRange;
    const minAngle = -Math.PI / 2 - this.swingRange;

    if (this.tongueAngle > maxAngle) {
      this.tongueAngle = maxAngle;
      this.swingDirection = -1;
    }

    if (this.tongueAngle < minAngle) {
      this.tongueAngle = minAngle;
      this.swingDirection = 1;
    }
  }

  drawAimGuide() {
    this.graphics.clear();

    if (this.tongueActive) {
      return;
    }

    const lineLength = Math.max(this.scale.width, this.scale.height);
    const endX = this.head.x + Math.cos(this.tongueAngle) * lineLength;
    const endY = this.head.y + Math.sin(this.tongueAngle) * lineLength;
    const total = Phaser.Math.Distance.Between(this.head.x, this.head.y, endX, endY);

    this.graphics.lineStyle(3, 0xffffff, 0.42);

    const dash = 12;
    const gap = 18;

    for (let distance = 0; distance < total; distance += dash + gap) {
      const distance2 = Math.min(distance + dash, total);
      const startX = Phaser.Math.Interpolation.Linear([this.head.x, endX], distance / total);
      const startY = Phaser.Math.Interpolation.Linear([this.head.y, endY], distance / total);
      const finishX = Phaser.Math.Interpolation.Linear([this.head.x, endX], distance2 / total);
      const finishY = Phaser.Math.Interpolation.Linear([this.head.y, endY], distance2 / total);
      this.graphics.strokeLineShape(new Phaser.Geom.Line(startX, startY, finishX, finishY));
    }
  }

  handlePointerMove(pointer: Phaser.Input.Pointer) {
    this.setManualAim(pointer.x, pointer.y);
  }

  handlePointerDown(pointer: Phaser.Input.Pointer) {
    this.setManualAim(pointer.x, pointer.y);
    if (this.phase === 'playing') {
      this.shootTongue();
    }
  }

  setManualAim(x: number, y: number) {
    const rawAngle = Phaser.Math.Angle.Between(this.head.x, this.head.y, x, y);
    const clampedAngle = Phaser.Math.Clamp(rawAngle, -Math.PI + 0.22, -0.22);
    this.manualAimAngle = clampedAngle;
    this.manualAimTimerMs = 2200;
  }

  resetManualAim() {
    this.manualAimAngle = null;
    this.manualAimTimerMs = 0;
  }

  toggleFullscreen() {
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
    } else {
      this.scale.stopFullscreen();
    }
  }

  updateChameleonAnimation(dt: number) {
    this.bodyAnimTime += dt;
    this.tailWagCooldown -= dt;

    const breath = this.bodyAnimTime * 1.4;
    const bobY = Math.sin(breath) * 4;
    const breathScaleY = 1 + Math.sin(breath) * 0.01;
    const headSway = Math.sin(this.bodyAnimTime * 0.65) * 0.012;

    let tailSwayAngle = 0;
    if (this.tailWagCooldown <= 0) {
      this.tailWagPhase = 0;
      this.tailWagCooldown = 2.5 + Math.random() * 4.5;
    }

    if (this.tailWagPhase >= 0) {
      this.tailWagPhase += dt * 5;
      if (this.tailWagPhase >= 1) {
        this.tailWagPhase = -1;
      } else {
        tailSwayAngle = Math.sin(this.tailWagPhase * Math.PI * 2.5) * 0.055;
      }
    }

    const totalRotation = headSway + tailSwayAngle;
    const totalY = this.chameleonBaseY + bobY + this.jumpState.yOffset;
    const scaleX = this.chameleonScale;
    const scaleY = this.chameleonScale * breathScaleY * this.jumpState.scaleYMod;

    this.chameleon.setY(totalY);
    this.chameleon.setRotation(totalRotation);
    this.chameleon.setScale(scaleX, scaleY);
  }

  syncMouthPosition() {
    const displayHeight = this.chameleon.displayHeight;
    const localX = 0;
    const localY = -displayHeight * (0.34 / 0.6);
    const angle = this.chameleon.rotation;

    this.head.x = this.chameleon.x + localX * Math.cos(angle) - localY * Math.sin(angle);
    this.head.y = this.chameleon.y + localX * Math.sin(angle) + localY * Math.cos(angle);
  }

  triggerJump() {
    if (this.isJumping) {
      return;
    }

    this.isJumping = true;
    const jumpHeight = this.scale.height * 0.07;

    this.tweens.add({
      targets: this.jumpState,
      yOffset: -jumpHeight,
      scaleYMod: 1.18,
      duration: 280,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.jumpState,
          yOffset: 0,
          scaleYMod: 0.82,
          duration: 350,
          ease: 'Bounce.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: this.jumpState,
              scaleYMod: 1,
              duration: 180,
              ease: 'Quad.easeOut',
              onComplete: () => {
                this.isJumping = false;
              },
            });
          },
        });
      },
    });
  }

  setupBackground() {
    const sourceTexture = this.textures.get('bg_raw');
    if (!sourceTexture) {
      return;
    }

    this.bgRawImage = sourceTexture.getSourceImage() as HTMLImageElement;
    this.renderBackground();
  }

  renderBackground() {
    const stageWidth = this.scale.width;
    const stageHeight = this.scale.height;

    if (!this.bgRawImage) {
      return;
    }

    const temporaryCanvas = document.createElement('canvas');
    temporaryCanvas.width = stageWidth;
    temporaryCanvas.height = stageHeight;
    const context = temporaryCanvas.getContext('2d');

    if (!context) {
      return;
    }

    const imageAspectRatio = this.bgRawImage.naturalWidth / this.bgRawImage.naturalHeight;
    const canvasAspectRatio = stageWidth / stageHeight;

    let drawWidth = stageWidth;
    let drawHeight = stageHeight;
    let drawX = 0;
    let drawY = 0;

    if (imageAspectRatio > canvasAspectRatio) {
      drawHeight = stageHeight;
      drawWidth = stageHeight * imageAspectRatio;
      drawX = (stageWidth - drawWidth) / 2;
    } else {
      drawWidth = stageWidth;
      drawHeight = stageWidth / imageAspectRatio;
      drawY = (stageHeight - drawHeight) / 2;
    }

    context.drawImage(this.bgRawImage, drawX, drawY, drawWidth, drawHeight);

    if (this.textures.exists('bg_cover')) {
      this.textures.remove('bg_cover');
    }

    this.textures.addCanvas('bg_cover', temporaryCanvas);

    if (this.bgCanvas) {
      this.bgCanvas.destroy();
    }

    this.bgCanvas = this.add.image(stageWidth / 2, stageHeight / 2, 'bg_cover');
    this.bgCanvas.setDepth(0);
  }

  processChameleonTexture() {
    const sourceTexture = this.textures.get('chameleon_raw');
    if (!sourceTexture || sourceTexture.key === '__MISSING') {
      return;
    }

    const image = sourceTexture.getSourceImage() as HTMLImageElement;
    const temporaryCanvas = document.createElement('canvas');
    temporaryCanvas.width = image.width;
    temporaryCanvas.height = image.height;

    const context = temporaryCanvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, temporaryCanvas.width, temporaryCanvas.height);
    const { data } = imageData;
    const width = temporaryCanvas.width;
    const height = temporaryCanvas.height;
    const visited = new Uint8Array(width * height);
    const queue: number[] = [];
    const threshold = 38;

    const isWhite = (index: number) => {
      const pixelOffset = index * 4;
      return (
        data[pixelOffset] >= 255 - threshold &&
        data[pixelOffset + 1] >= 255 - threshold &&
        data[pixelOffset + 2] >= 255 - threshold
      );
    };

    for (let x = 0; x < width; x += 1) {
      if (isWhite(x)) {
        queue.push(x);
      }
      if (isWhite((height - 1) * width + x)) {
        queue.push((height - 1) * width + x);
      }
    }

    for (let y = 1; y < height - 1; y += 1) {
      if (isWhite(y * width)) {
        queue.push(y * width);
      }
      if (isWhite(y * width + width - 1)) {
        queue.push(y * width + width - 1);
      }
    }

    while (queue.length > 0) {
      const current = queue.pop()!;
      if (current < 0 || current >= width * height || visited[current] || !isWhite(current)) {
        continue;
      }

      visited[current] = 1;
      data[current * 4 + 3] = 0;

      const x = current % width;
      if (x > 0) {
        queue.push(current - 1);
      }
      if (x < width - 1) {
        queue.push(current + 1);
      }
      if (current >= width) {
        queue.push(current - width);
      }
      if (current < (height - 1) * width) {
        queue.push(current + width);
      }
    }

    context.putImageData(imageData, 0, 0);

    if (this.textures.exists('chameleon_clean')) {
      this.textures.remove('chameleon_clean');
    }

    this.textures.addCanvas('chameleon_clean', temporaryCanvas);
  }

  shootTongue() {
    if (this.phase !== 'playing' || this.tongueActive) {
      return;
    }

    initAudio();
    playShootSound();
    this.tongueActive = true;
    this.tongueLength = 0;
    this.tonguePhase = 'extending';
    this.caughtFly = null;
  }

  updateTongue(dt: number, difficulty: number) {
    if (!this.tongueActive) {
      this.tongueGraphics.clear();
      return;
    }

    if (this.tonguePhase === 'extending') {
      this.tongueLength += this.tongueSpeed * dt;
      const tongueTip = this.getTongueTip();

      if (
        tongueTip.x < -40 ||
        tongueTip.x > this.scale.width + 40 ||
        tongueTip.y < -40 ||
        tongueTip.y > this.scale.height * 0.92
      ) {
        this.tonguePhase = 'retracting';
      }

      const hitPadding = Phaser.Math.Linear(24, 10, this.getDifficultyProgress());

      for (let index = this.flies.length - 1; index >= 0; index -= 1) {
        const fly = this.flies[index];
        const label = this.getFlyLabel(fly);
        const hitRadius = (label.width || 80) / 2 + hitPadding;
        const dx = tongueTip.x - fly.container.x;
        const dy = tongueTip.y - fly.container.y;

        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          this.caughtFly = fly;
          this.score += fly.word.value;
          playEatSound();
          window.onScoreUpdated?.(this.score);
          fly.container.destroy();
          this.flies.splice(index, 1);
          this.tonguePhase = 'retracting';
          break;
        }
      }
    } else {
      this.tongueLength -= this.tongueSpeed * dt;
      if (this.tongueLength <= 0) {
        this.resetTongue();
      }
    }

    this.drawTongue(difficulty);
  }

  resetTongue() {
    this.tongueActive = false;
    this.tongueLength = 0;
    this.tongueGraphics.clear();

    if (this.caughtFly) {
      window.onFlyDigested?.(this.caughtFly.word);
      this.caughtFly = null;
    }
  }

  drawTongue(difficulty: number) {
    this.tongueGraphics.clear();

    const baseX = this.head.x;
    const baseY = this.head.y;
    const tongueTip = this.getTongueTip();
    const dx = tongueTip.x - baseX;
    const dy = tongueTip.y - baseY;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;
    const unitX = dx / length;
    const unitY = dy / length;
    const normalX = -unitY;
    const normalY = unitX;

    const screenDiagonal = Math.sqrt(this.scale.width ** 2 + this.scale.height ** 2);
    const sway = length * (0.17 + this.getDifficultyProgress() * 0.04) * (length / screenDiagonal) * -this.swingDirection;
    const middleX = (baseX + tongueTip.x) / 2 + normalX * sway;
    const middleY = (baseY + tongueTip.y) / 2 + normalY * sway;

    const rootWidth = 11;
    const tipWidth = Phaser.Math.Linear(5, 4, (difficulty - 1) / 2.6);
    const segments = 16;

    for (let segment = 0; segment < segments; segment += 1) {
      const t0 = segment / segments;
      const t1 = (segment + 1) / segments;
      const p0x = this.qBez(baseX, middleX, tongueTip.x, t0);
      const p0y = this.qBez(baseY, middleY, tongueTip.y, t0);
      const p1x = this.qBez(baseX, middleX, tongueTip.x, t1);
      const p1y = this.qBez(baseY, middleY, tongueTip.y, t1);
      const width0 = rootWidth * (1 - t0) + tipWidth * t0;
      const width1 = rootWidth * (1 - t1) + tipWidth * t1;
      const d0x = this.qBezDeriv(baseX, middleX, tongueTip.x, t0);
      const d0y = this.qBezDeriv(baseY, middleY, tongueTip.y, t0);
      const d0Length = Math.sqrt(d0x * d0x + d0y * d0y) || 1;
      const d1x = this.qBezDeriv(baseX, middleX, tongueTip.x, t1);
      const d1y = this.qBezDeriv(baseY, middleY, tongueTip.y, t1);
      const d1Length = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
      const normal0X = -d0y / d0Length;
      const normal0Y = d0x / d0Length;
      const normal1X = -d1y / d1Length;
      const normal1Y = d1x / d1Length;
      const red = Math.round(0xb8 + (0xe8 - 0xb8) * t0);
      const green = Math.round(0x30 + (0x70 - 0x30) * t0);
      const blue = Math.round(0x28 + (0x60 - 0x28) * t0);

      this.tongueGraphics.fillStyle((red << 16) | (green << 8) | blue, 1);
      this.tongueGraphics.fillTriangle(
        p0x + normal0X * width0,
        p0y + normal0Y * width0,
        p0x - normal0X * width0,
        p0y - normal0Y * width0,
        p1x + normal1X * width1,
        p1y + normal1Y * width1,
      );
      this.tongueGraphics.fillTriangle(
        p0x - normal0X * width0,
        p0y - normal0Y * width0,
        p1x - normal1X * width1,
        p1y - normal1Y * width1,
        p1x + normal1X * width1,
        p1y + normal1Y * width1,
      );
    }

    for (let stripe = 1; stripe < 7; stripe += 1) {
      const t = stripe / 7;
      const stripeX = this.qBez(baseX, middleX, tongueTip.x, t);
      const stripeY = this.qBez(baseY, middleY, tongueTip.y, t);
      const stripeWidth = (rootWidth * (1 - t) + tipWidth * t) * 0.85;
      this.tongueGraphics.lineStyle(1.2, 0x821418, 0.12 + 0.05 * Math.sin(t * Math.PI));
      this.tongueGraphics.strokeLineShape(
        new Phaser.Geom.Line(
          stripeX + normalX * stripeWidth,
          stripeY + normalY * stripeWidth,
          stripeX - normalX * stripeWidth,
          stripeY - normalY * stripeWidth,
        ),
      );
    }

    const ballRadius = 22;
    this.tongueGraphics.fillStyle(0xe04040, 1);
    this.tongueGraphics.fillEllipse(tongueTip.x, tongueTip.y, ballRadius * 1.36, ballRadius * 2);
    this.tongueGraphics.fillStyle(0x370505, 0.52);
    this.tongueGraphics.fillEllipse(
      tongueTip.x + unitX * ballRadius * 0.28,
      tongueTip.y + unitY * ballRadius * 0.28,
      ballRadius * 0.88,
      ballRadius * 0.6,
    );
    this.tongueGraphics.fillStyle(0xffede1, 0.78);
    this.tongueGraphics.fillCircle(tongueTip.x - unitX * 6 - normalX * 8, tongueTip.y - unitY * 6 - normalY * 8, 5);
    this.tongueGraphics.fillStyle(0xffede1, 0.42);
    this.tongueGraphics.fillCircle(tongueTip.x - unitX * 2 - normalX * 12, tongueTip.y - unitY * 2 - normalY * 12, 2.2);
  }

  qBez(a: number, b: number, c: number, t: number) {
    const inverse = 1 - t;
    return inverse * inverse * a + 2 * inverse * t * b + t * t * c;
  }

  qBezDeriv(a: number, b: number, c: number, t: number) {
    return 2 * (1 - t) * (b - a) + 2 * t * (c - b);
  }

  getSpawnChance(difficulty: number) {
    return 0.018 + (difficulty - 1) * 0.014;
  }

  spawnFly(difficulty: number) {
    const maxFlies = Math.max(8, Math.floor(this.scale.width / 150) + Math.floor((difficulty - 1) * 3));
    if (this.flies.length >= maxFlies) {
      return;
    }

    const word = Phaser.Utils.Array.GetRandom(this.flyWords);
    const isLeft = Math.random() < 0.5;
    const startX = isLeft ? -100 : this.scale.width + 100;
    const startY = 52 + Math.random() * (this.scale.height * 0.56);
    const container = this.add.container(startX, startY);
    container.setDepth(1);

    const label = this.add
      .text(0, 0, word.text, {
        fontFamily: '"ZCOOL KuaiLe", sans-serif',
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const labelWidth = label.width || 80;
    const width = Math.max(84, labelWidth + 24);
    const background = this.add.graphics();
    const modelHue = (30 + word.hue) % 360;
    const backgroundColor = Phaser.Display.Color.HSLToColor(modelHue / 360, 0.75, 0.22);
    const strokeColor = Phaser.Display.Color.HSLToColor(modelHue / 360, 1, 0.66);
    background.fillStyle(backgroundColor.color, 1);
    background.fillRoundedRect(-width / 2, -20, width, 40, 20);
    background.lineStyle(3, strokeColor.color, 1);
    background.strokeRoundedRect(-width / 2, -20, width, 40, 20);

    const leftWing = this.add.graphics();
    leftWing.fillStyle(0xffffff, 0.7);
    leftWing.fillEllipse(0, 0, 44, 12);
    const rightWing = this.add.graphics();
    rightWing.fillStyle(0xffffff, 0.7);
    rightWing.fillEllipse(0, 0, 44, 12);

    container.add([leftWing, rightWing, background, label]);

    const progress = this.getDifficultyProgress();
    const direction = isLeft ? 1 : -1;
    const baseSpeed = (48 + Math.random() * 48) * (1 + progress * 1.35);
    const verticalSpeed = (Math.random() * 44 - 22) * (1 + progress * 0.8);
    const behaviorRoll = Math.random();
    let behavior: FlyBehavior = 'glide';

    if (progress > 0.75 && behaviorRoll < 0.34) {
      behavior = 'evade';
    } else if (progress > 0.48 && behaviorRoll < 0.62) {
      behavior = 'dash';
    } else if (progress > 0.24) {
      behavior = 'wave';
    }

    this.flies.push({
      id: crypto.randomUUID(),
      container,
      word,
      vx: baseSpeed * direction,
      vy: verticalSpeed,
      cruiseVx: baseSpeed * direction,
      cruiseVy: verticalSpeed,
      hoverOffset: Math.random() * Math.PI * 2,
      baseHue: modelHue,
      baseY: startY,
      behavior,
      driftAmplitude: 7 + Math.random() * 12 + progress * 18,
      driftFrequency: 3.2 + Math.random() * 2.2 + progress * 2,
      dodgeCooldown: 0.3 + Math.random() * 0.5,
      dashCooldown: 0.6 + Math.random() * 1.2,
    });
  }

  updateFlies(dt: number, difficulty: number) {
    const progress = this.getDifficultyProgress();

    for (let index = this.flies.length - 1; index >= 0; index -= 1) {
      const fly = this.flies[index];
      fly.hoverOffset += dt * (4 + progress * 2.4);
      fly.dodgeCooldown -= dt;
      fly.dashCooldown -= dt;

      if (fly.behavior === 'dash' && fly.dashCooldown <= 0) {
        const dashDirection = Math.random() > 0.5 ? 1 : -1;
        fly.vx += dashDirection * (140 + progress * 190);
        fly.vy += (Math.random() > 0.5 ? 1 : -1) * (60 + progress * 90);
        fly.dashCooldown = 0.7 + Math.random() * 1.1;
      }

      if ((fly.behavior === 'evade' || progress > 0.58) && fly.dodgeCooldown <= 0 && this.isFlyThreatened(fly, difficulty)) {
        const dodgeSign = Math.sign(fly.container.x - this.head.x) || (Math.random() > 0.5 ? 1 : -1);
        fly.vx += dodgeSign * (180 + progress * 220);
        fly.vy += (Math.random() > 0.5 ? 1 : -1) * (80 + progress * 110);
        fly.dodgeCooldown = 0.35 + Math.random() * 0.45;
      }

      fly.vx = Phaser.Math.Linear(fly.vx, fly.cruiseVx, dt * 1.05);
      fly.vy = Phaser.Math.Linear(fly.vy, fly.cruiseVy, dt * 1.18);

      fly.baseY += fly.vy * dt;
      fly.container.x += fly.vx * dt;

      const wave = Math.sin(fly.hoverOffset * fly.driftFrequency) * fly.driftAmplitude;
      fly.container.y = fly.baseY + wave;
      fly.container.rotation = Math.sin(fly.hoverOffset * 2.2) * 0.05;

      const label = this.getFlyLabel(fly);
      const wingTravel = Math.sin(fly.hoverOffset * 5.4) * (8 + progress * 4);
      const wingDistance = label.width + 24;
      const leftWing = fly.container.getAt(0) as Phaser.GameObjects.Graphics;
      const rightWing = fly.container.getAt(1) as Phaser.GameObjects.Graphics;
      leftWing.setX(-wingDistance / 2 + 10);
      leftWing.setY(wingTravel);
      rightWing.setX(wingDistance / 2 - 10);
      rightWing.setY(-wingTravel);

      if (fly.container.x > this.scale.width + 120) {
        fly.container.x = -120;
      }
      if (fly.container.x < -120) {
        fly.container.x = this.scale.width + 120;
      }
      if (fly.baseY < 22) {
        fly.vy = Math.abs(fly.vy);
      }
      if (fly.baseY > this.scale.height * 0.68) {
        fly.vy = -Math.abs(fly.vy);
      }
    }
  }

  isFlyThreatened(fly: FlyData, difficulty: number) {
    const aimX = Math.cos(this.tongueAngle);
    const aimY = Math.sin(this.tongueAngle);
    const relX = fly.container.x - this.head.x;
    const relY = fly.container.y - this.head.y;
    const along = relX * aimX + relY * aimY;
    const lateral = Math.abs(relX * -aimY + relY * aimX);
    const progress = this.getDifficultyProgress();
    const dangerDistance = this.tongueActive ? 420 + progress * 300 : 240 + progress * 180;
    const corridor = Phaser.Math.Linear(36, 92, progress);

    if (along > 0 && along < dangerDistance && lateral < corridor) {
      return true;
    }

    if (this.tongueActive) {
      const tongueTip = this.getTongueTip();
      const distanceToTip = Phaser.Math.Distance.Between(fly.container.x, fly.container.y, tongueTip.x, tongueTip.y);
      if (distanceToTip < 120 + (difficulty - 1) * 36) {
        return true;
      }
    }

    return false;
  }

  getFlyLabel(fly: FlyData) {
    return fly.container.getAt(3) as Phaser.GameObjects.Text;
  }

  getTongueTip() {
    return {
      x: this.head.x + Math.cos(this.tongueAngle) * this.tongueLength,
      y: this.head.y + Math.sin(this.tongueAngle) * this.tongueLength,
    };
  }

  serializeState() {
    const tongueTip = this.getTongueTip();
    return JSON.stringify({
      mode: this.phase,
      difficulty: Number(this.lastKnownDifficulty.toFixed(2)),
      head: {
        x: Math.round(this.head.x),
        y: Math.round(this.head.y),
      },
      tongue: {
        active: this.tongueActive,
        phase: this.tonguePhase,
        length: Math.round(this.tongueLength),
        tip: {
          x: Math.round(tongueTip.x),
          y: Math.round(tongueTip.y),
        },
      },
      flies: this.flies.slice(0, 10).map((fly) => ({
        id: fly.id,
        label: fly.word.text,
        x: Math.round(fly.container.x),
        y: Math.round(fly.container.y),
        behavior: fly.behavior,
      })),
    });
  }

  advanceSimulation(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    const delta = ms / steps;

    for (let index = 0; index < steps; index += 1) {
      this.update(0, delta);
    }

    return this.serializeState();
  }

  resize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.chameleonBaseY = height * 1.02;
    this.renderBackground();
    this.chameleon.setPosition(width * 0.5, this.chameleonBaseY);
    this.chameleonScale = (height * 0.6) / this.chameleon.height;
    this.chameleon.setScale(this.chameleonScale);
    this.syncMouthPosition();
  }
}
