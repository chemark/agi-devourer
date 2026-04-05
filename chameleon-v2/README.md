# 舌尖上的 AGI v2

`chameleon-v2/` 是当前分支唯一有效的前端工程。它基于 React + Phaser + Vite，承接了从 Game Jam 原型到正式产品化迭代的开发工作。

## 当前能力

- 单键吞噬主循环
- React + Phaser 重构后的游戏运行层
- 移动端触控发射与响应式 HUD
- 游客 / 荣誉档案双轨模式
- 本地排行榜与可选 Supabase 排行榜
- 结算海报生成与分享文案
- 动态难度曲线与猎物闪避

## 开发命令

```bash
npm install
npm run dev
npm run build
npm run lint
```

默认开发地址：

```text
http://127.0.0.1:5173
```

## 环境变量

复制 `.env.example` 后按需配置：

```bash
cp .env.example .env.local
```

可选项：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GAME_SHARE_URL`

如果不配置 Supabase，游戏仍可运行，只是排行榜会回退到本地存储模式。

## 构建输出

生产构建产物位于：

```text
dist/
```

Cloudflare Pages 推荐把本目录作为 Root Directory，构建命令为：

```bash
npm ci && npm run build
```

输出目录填写：

```text
dist
```
