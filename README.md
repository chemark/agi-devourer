# 👅 舌尖上的 AGI (Tongue-Tip AGI Adventure)

> **Game Jam 主题**：你只能做一件事 (You can only do one thing)  
> **在线体验**：[https://agi.hoshikihao.com](https://agi.hoshikihao.com)

《舌尖上的 AGI》是一款在 Game Jam（限时开发）活动中诞生的荒诞动作小游戏。在这里，玩家扮演一只面临「算力枯竭」的数字变色龙。在 60 秒的生存倒计时里，**你只能做一件事**：按下空格键射出变异的舌头，不断吞噬天上乱飞的大语言模型（ChatGPT、Claude、Gemini），完成算力积累，突破奇点进化！

## 🌟 核心亮点

*   **唯一约束操作**：只用移动鼠标瞄准 + 空格键射穿大模型。操作虽单一，但「三连触发变身」带来了极其爽快的得分翻倍和震屏反馈。
*   **运行时 AI 生成叙事**：这不是一个预先写好剧情的游戏。每局结算时，游戏后端会把你在本局吃过的模型名单发送给 DeepSeek，**实时生成一段极具荒诞科技黑话风格的「算力怪嗝」专属结局文案**。
*   **纯技术魔法的视觉渲染**：
    *   **Bezier 拟物舌头**：基于 Canvas `quadraticCurveTo` 重复计算法线向量和阻尼摆动，绘制无限接近真实蜥蜴的肌肉吸盘舌头。
    *   **BFS 洪水填充去白底**：在浏览器运行时抛弃 `mix-blend-mode`，利用广度优先搜索动态去除图片高光纯白背景，实现精确的「吃什么模型染什么品牌色」实色渲染效果。

## 🛠 技术栈

本项目坚持**大道至简，零依赖**的原则，未引入任何繁重的前端框架。

- **前端引擎**：纯 HTML5 Canvas + Vanilla JS + CSS3
- **AI 大模型服务**：DeepSeek API
- **安全与 API 代理**：Cloudflare Workers (拦截暴露可能，环境变量级安全保护)
- **部署托管**：Cloudflare Pages

## 🕹 开始游戏（本地开发）

确保你拥有 Node.js 与 Git 环境。

```bash
# 1. 克隆代码
git clone https://github.com/chemark/agi-devourer.git
cd agi-devourer

# 2. 启动本地 HTTP 服务 (macOS/Linux)
./start.sh
# (如果没有 Python ，请使用你常用的如 live-server, http-server 代替访问 chameleon/index.html 即可)

# 3. 浏览器访问：http://localhost:8000/chameleon
```

## 🔒 生产环境部署方案（最佳实践）

如果要将游戏发布至线上跑通大模型 API 功能，你需要在 Cloudflare 中配置后端（充当你的安全代理中转），严禁将 API Key 留在前端代码中。

本项目采用前后端分离设计，结合本游戏的更新特性，我们强烈推荐以下**混合部署方案**：

### 1. 部署后端大模型代理（推荐：Wrangler 手动）

因为 `worker` 中的安全中转逻辑异常稳固，几乎不需要由于游戏迭代而去修改。低频率的手动发版可以最大化保护你在配置安全密钥时的资产，避免为了自动化而在 GitHub Secrets 中四处散播部署 Token。

```bash
cd worker
npm install -g wrangler
wrangler deploy

# 发版后立刻配置你的私密环境变量（至关重要！）
echo "sk-YourDeepSeekKey" | wrangler secret put DEEPSEEK_API_KEY
```

### 2. 部署前端游戏页面（推荐：GitHub 自动 CI/CD）

游戏的显示画面、关卡数据变动会非常频繁，极其推荐启用自动化部署路线以取代 `wrangler pages deploy` 这类枯燥的重复命令。

在你的 Cloudflare Dashboard -> Pages 页面：
1. 点击 **Connect to Git**（连接到 Git）
2. 绑定本 GitHub 仓库及 `main` 分支。
3. 指定构建输出目录为：`/chameleon`。

今后你每一次将新点子 `git push` 上云，Cloudflare 就会自动在后台打包更新全网的游戏节点，真正实现“一次配置，终身摸鱼”的工作流。

*(如果你目前还不打算挂载 Git 仓库，纯手动将本地前端代码糊上外网的测试版命令为：`wrangler pages deploy ./chameleon --project-name agi-tongue-game`)*

## 📚 详细文档目录

整个 Game Jam 开发的脑暴与心得全记录，可在这里浏览：

- [`评审维度.md`](./评审维度.md)：本次 Game Jam 六个层面的评分自评及展示话术。
- [`开发学习笔记.md`](./开发学习笔记.md)：从 Canvas 绘画技巧、BFS 补丁到 API 安全管控等 12 个技术踩坑全总结。
- [`赛前讨论.md`](./赛前讨论.md)：游戏原型立项探讨。
- [`舌尖上的AGI_演示讲解稿.md`](./舌尖上的AGI_演示讲解稿.md)：准备好了一分钟现场评审 Pitch 文稿。

## 🔗 参考资料 (References)

- [武汉 AI GAME JAM 2026 实战复盘报告](https://mp.weixin.qq.com/s/BbHUgkqjycWjz_S42669uw)
- [武汉 AI Game Jam 2026 圆满举办](http://www.app.dawuhanapp.com/p/46904982.html)
- [哔哩哔哩视频 纪录片](https://www.bilibili.com/video/BV1KB97BfEfT/?vd_source=e0610098cf666eb90e216d07cd654193)
- [狮子的牙齿官方报道](https://www.guozaoke.com/t/129662#reply12)
- [创新光谷](https://mp.weixin.qq.com/s/PwlQ7zVd2nCD52xpL6cwTg)
- [湖北日报](https://news.hubeidaily.net/hbrbsharenew/news_detail/5/5316020/4788822/0?historyback=1)
- [长江日报](https://www.app.dawuhanapp.com/p/46904982.html)
