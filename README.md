# 👅 舌尖上的 AGI (Tongue-Tip AGI Adventure)

> **Game Jam 主题**：你只能做一件事 (You can only do one thing)

当前分支已经切到 **v2-only** 开发线：日常开发、启动、构建和部署都以 [`chameleon-v2/`](./chameleon-v2) 为准；`v1` 的运行时代码已从本分支移除，只保留历史文档作为归档参考。

《舌尖上的 AGI》是一款荒诞动作网页游戏。玩家扮演一只赛博变色龙，在 60 秒内靠一根会暴走的舌头吞噬大模型，冲击算力奇点。`v2` 版本把原型升级成了 React + Phaser 的完整前端工程，并补上了移动端、排行榜和社交分享等产品层能力。

## 🌟 v2 亮点

- **单键核心玩法保留**：依旧是“瞄准 + 发射”这一件事，但加入了更明确的节奏反馈和三连爆鸣。
- **动态难度曲线**：随着时间推移，准星摆动、猎物速度和闪避行为都会加剧。
- **游客 / 荣誉档案双轨**：可以直接开玩，但想上榜时必须登记昵称与联系方式。
- **排行榜与战报分享**：支持本地排行榜，接上 Supabase 后可升级为全网榜，并能在结算页生成可分享海报。
- **移动端适配**：支持触控瞄准和移动端发射按钮，不再局限于桌面浏览器。

## 🛠 技术栈

- **游戏运行层**：Phaser.js
- **界面层**：React + Vite + TypeScript
- **AI 文案生成**：Cloudflare Worker 代理转发 DeepSeek
- **榜单存储**：本地存储优先，可选 Supabase
- **部署**：Cloudflare Pages + Cloudflare Workers

## 🕹 本地开发

确保你本机有 Node.js 与 npm。

```bash
git clone https://github.com/chemark/agi-devourer.git
cd agi-devourer
./start.sh
```

启动后浏览器会打开：

```text
http://127.0.0.1:4173
```

如果你想手动启动：

```bash
cd chameleon-v2
npm install
npm run dev
```

## 🔐 可选环境变量

`v2` 在没有后端配置时也能本地运行，只是排行榜会退回本机存储。

可选配置见 [`chameleon-v2/.env.example`](./chameleon-v2/.env.example)：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GAME_SHARE_URL`

## 🚀 部署建议

### 1. 后端 AI 代理

`worker/` 仍然推荐单独手动部署：

```bash
cd worker
npm install -g wrangler
wrangler deploy
echo "sk-YourDeepSeekKey" | wrangler secret put DEEPSEEK_API_KEY
```

### 2. 前端页面

前端以 [`chameleon-v2/`](./chameleon-v2) 为唯一入口。

Cloudflare Pages 推荐配置：

1. Root Directory：`chameleon-v2`
2. Build Command：`npm ci && npm run build`
3. Output Directory：`dist`

如果手动部署：

```bash
cd chameleon-v2
npm install
npm run build
wrangler pages deploy ./dist --project-name agi-tongue-game
```

## 📚 文档目录

- [`chameleon-v2/README.md`](./chameleon-v2/README.md)：v2 子工程说明。
- [`chameleon/PRD.md`](./chameleon/PRD.md)：v1 / v2 演进 PRD 历史文档。
- [`开发学习笔记.md`](./开发学习笔记.md)：开发过程中的技术笔记与踩坑总结。
- [`开发路线图.md`](./开发路线图.md)：版本迭代路线图。
- [`新手协作指南.md`](./新手协作指南.md)：队友协作和提交流程说明。
- [`评审维度.md`](./评审维度.md)：比赛展示与答辩素材。
- [`舌尖上的AGI_演示讲解稿.md`](./舌尖上的AGI_演示讲解稿.md)：路演讲解稿。

## 🔗 参考资料

- [武汉 AI GAME JAM 2026 实战复盘报告](https://mp.weixin.qq.com/s/BbHUgkqjycWjz_S42669uw)
- [武汉 AI Game Jam 2026 圆满举办](http://www.app.dawuhanapp.com/p/46904982.html)
- [哔哩哔哩视频纪录片](https://www.bilibili.com/video/BV1KB97BfEfT/?vd_source=e0610098cf666eb90e216d07cd654193)
