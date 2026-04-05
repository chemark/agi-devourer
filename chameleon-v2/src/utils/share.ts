import type { GameSummary, PlayerProfile } from '../types/game';

const SHARE_URL = import.meta.env.VITE_GAME_SHARE_URL || 'https://agi.hoshikihao.com';

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius);
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius);
  ctx.arcTo(x, y + height, x, y, safeRadius);
  ctx.arcTo(x, y, x + width, y, safeRadius);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = [...text];
  let line = '';
  let currentY = y;
  let lines = 0;

  for (const char of chars) {
    const testLine = `${line}${char}`;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) {
        break;
      }
    } else {
      line = testLine;
    }
  }

  const hasOverflow = ctx.measureText(text).width > maxWidth && lines >= maxLines - 1;
  ctx.fillText(hasOverflow ? `${line.slice(0, Math.max(0, line.length - 2))}…` : line, x, currentY);
}

async function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export function buildShareText(summary: GameSummary, profile: PlayerProfile | null) {
  const label = summary.didWin ? '突破奇点' : '算力临界';
  const nickname = profile?.nickname ?? '游客玩家';
  return `${nickname} 在《舌尖上的 AGI》V2 里打出 ${summary.score} 分，${label}战报已经生成：${SHARE_URL}`;
}

export async function generateSharePoster(summary: GameSummary, profile: PlayerProfile | null, rank?: number) {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建海报画布');
  }

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, '#08111f');
  gradient.addColorStop(0.35, '#0d5c63');
  gradient.addColorStop(0.72, '#b43f3f');
  gradient.addColorStop(1, '#ffcc70');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.save();
  ctx.globalAlpha = 0.16;
  for (let index = 0; index < 18; index += 1) {
    ctx.fillStyle = index % 2 === 0 ? '#4ee7d4' : '#ffe27a';
    drawRoundedRect(ctx, 56 + index * 52, 80 + (index % 3) * 28, 240, 24, 12);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let row = 0; row < 18; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      if ((row + col) % 3 === 0) {
        drawRoundedRect(ctx, 760 + col * 22, 1320 + row * 22, 14, 14, 4);
        ctx.fill();
      }
    }
  }

  ctx.fillStyle = '#f6f2e8';
  ctx.font = '700 48px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('Tongue-Tip AGI V2', 88, 132);
  ctx.font = '700 112px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('舌尖上的 AGI', 88, 248);

  ctx.font = '600 40px "ZCOOL KuaiLe", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText(summary.didWin ? '奇点已破，赛博变色龙原地飞升。' : '差一点成神，已经够你发朋友圈了。', 88, 330);

  drawRoundedRect(ctx, 80, 390, 920, 430, 42);
  ctx.fillStyle = 'rgba(5, 13, 23, 0.58)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#7af4d2';
  ctx.font = '700 34px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('算力总分', 128, 470);
  ctx.fillStyle = '#fff4c2';
  ctx.font = '700 168px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText(String(summary.score), 120, 650);

  ctx.fillStyle = '#f4f6ff';
  ctx.font = '600 36px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText(`玩家：${profile?.nickname ?? '游客玩家'}`, 128, 736);
  ctx.fillText(`三连共鸣：${summary.comboCount} 次`, 128, 790);
  ctx.fillText(`最高难度：Lv.${summary.maxDifficulty.toFixed(1)}`, 480, 736);
  ctx.fillText(`生存时长：${summary.durationSeconds} 秒`, 480, 790);

  if (rank) {
    drawRoundedRect(ctx, 760, 438, 180, 92, 30);
    ctx.fillStyle = 'rgba(255, 205, 96, 0.18)';
    ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.font = '700 36px "ZCOOL KuaiLe", sans-serif';
    ctx.fillText(`榜单 #${rank}`, 794, 495);
  }

  drawRoundedRect(ctx, 80, 864, 920, 450, 42);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('本局怪嗝战报', 126, 938);
  ctx.font = '600 48px "ZCOOL KuaiLe", sans-serif';
  drawWrappedText(ctx, summary.story, 126, 1032, 820, 70, 4);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 30px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('吞噬谱系', 126, 1194);
  ctx.font = '600 34px "ZCOOL KuaiLe", sans-serif';
  drawWrappedText(
    ctx,
    summary.models.length > 0 ? summary.models.join(' / ') : '这局过于狂暴，没留下完整样本。',
    126,
    1248,
    820,
    54,
    3,
  );

  const chameleonImage = await loadImage('/assets/chameleon.png');
  if (chameleonImage) {
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.drawImage(chameleonImage, 660, 844, 320, 400);
    ctx.restore();
  }

  drawRoundedRect(ctx, 80, 1396, 920, 360, 42);
  ctx.fillStyle = 'rgba(7, 15, 24, 0.66)';
  ctx.fill();
  ctx.fillStyle = '#fef4d8';
  ctx.font = '700 44px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('入口卡片', 126, 1476);
  ctx.font = '600 34px "ZCOOL KuaiLe", sans-serif';
  drawWrappedText(ctx, SHARE_URL.replace(/^https?:\/\//, ''), 126, 1554, 460, 48, 2);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, 658, 1490, 250, 174, 28);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if ((row * 2 + col * 3) % 5 < 2) {
        drawRoundedRect(ctx, 690 + col * 22, 1520 + row * 16, 14, 12, 3);
        ctx.fill();
      }
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('打开链接，继续吞噬', 672, 1688);

  ctx.fillStyle = 'rgba(255,255,255,0.66)';
  ctx.font = '500 28px "ZCOOL KuaiLe", sans-serif';
  ctx.fillText('生成于《舌尖上的 AGI》v2 战报海报引擎', 80, 1842);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error('海报导出失败'));
      }
    }, 'image/png');
  });

  return blob;
}

export function downloadPoster(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyShareText(summary: GameSummary, profile: PlayerProfile | null) {
  const text = buildShareText(summary, profile);
  await navigator.clipboard.writeText(text);
  return text;
}

export async function sharePoster(blob: Blob, summary: GameSummary, profile: PlayerProfile | null) {
  const text = buildShareText(summary, profile);
  const file = new File([blob], `agi-devourer-${summary.score}.png`, { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: '舌尖上的 AGI 战报',
      text,
      files: [file],
    });
    return true;
  }

  if (navigator.share) {
    await navigator.share({
      title: '舌尖上的 AGI 战报',
      text,
      url: SHARE_URL,
    });
    return true;
  }

  return false;
}
