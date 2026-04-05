import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from './GameScene';

export default function PhaserGame() {
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.WEBGL,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameContainerRef.current,
      transparent: false,        // 关掉透明：背景由场景自行绘制，避免 WebGL compositing 开销
      backgroundColor: '#000000',
      fps: {
        target: 60,
        forceSetTimeOut: false,  // 优先使用 rAF，更流畅
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      }
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, []);

  return <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />;
}
