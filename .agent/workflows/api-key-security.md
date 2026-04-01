---
description: 安全使用 API Key，防止密钥泄露到 Git 仓库
---

## API Key 安全使用规范

凡是项目中需要用到 API Key（DeepSeek、OpenAI、Anthropic 等），必须遵守本 workflow。

---

### 第 1 步：检查项目是否已有 .gitignore

// turbo
```bash
cat .gitignore 2>/dev/null || echo "没有 .gitignore，需要创建"
```

### 第 2 步：确保 .env 文件已被 .gitignore 屏蔽

// turbo
```bash
grep -q "\.env" .gitignore && echo "✅ .env 已在 .gitignore 中" || echo '# 本地密钥，绝不提交
.env
.env.local
.env.*.local' >> .gitignore && echo "✅ 已添加 .env 规则到 .gitignore"
```

### 第 3 步：把 API Key 写入 .env 文件（而不是写进代码）

在项目根目录创建 `.env` 文件，把 Key 写在里面：

```
DEEPSEEK_API_KEY=sk-你的Key
```

> ⚠️ **注意**：`.env` 文件只在本地用，永远不提交到 Git。

### 第 4 步：在代码里从环境变量读取，不要硬编码

**本地 Node.js 代理（proxy.js）**：
```javascript
// 用 dotenv 读取 .env 文件
require('dotenv').config();
const API_KEY = process.env.DEEPSEEK_API_KEY;
```

**Cloudflare Worker（生产环境）**：
```javascript
// Worker 通过 env 对象读取，Key 存在 wrangler secret 里
const API_KEY = env.DEEPSEEK_API_KEY;
```

**前端 JS（浏览器端）**：
- ❌ 永远不要在前端代码里放 Key
- ✅ 必须通过后端（Worker/proxy）中转

### 第 5 步：部署前扫描是否有裸露的 Key

// turbo
```bash
# 扫描常见 API Key 格式（sk-、AIza、Bearer 等）
grep -rn "sk-[a-zA-Z0-9]\{20,\}" --include="*.js" --include="*.ts" --include="*.html" . \
  && echo "⚠️ 发现疑似 API Key，请检查！" \
  || echo "✅ 未发现明文 API Key"
```

### 第 6 步：把 Key 上传到 Cloudflare Worker（生产环境）

```bash
echo "sk-你的新Key" | wrangler secret put DEEPSEEK_API_KEY
```

> 不需要重新部署代码，Worker 立即生效。

### 第 7 步：验证 Key 是否正确配置（通过 Worker 接口测试）

// turbo
```bash
curl -s -o /dev/null -w "HTTP状态码: %{http_code}\n" \
  -X POST https://agi-tongue-proxy.chengchuanhao728494.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}],"max_tokens":5}'
```

返回 `200` = ✅ 正常；返回 `401` = ❌ Key 无效或未配置。

---

## 万一 Key 已经泄露，紧急处理流程

1. **立刻** 去 API 平台删除泄露的 Key（[DeepSeek](https://platform.deepseek.com/api_keys)）
2. 确认旧 Key 已失效：`curl -I -H "Authorization: Bearer sk-旧Key" https://api.deepseek.com/models` → 应返回 401
3. 创建新 Key，更新 Cloudflare Worker：`echo "sk-新Key" | wrangler secret put DEEPSEEK_API_KEY`
4. 验证新 Key 正常工作（见第 7 步）
5. （可选）清理 Git 历史：`git filter-branch --tree-filter "sed -i '' 's/sk-旧Key/sk-REDACTED/g' **/*.js" -- --all && git push --force`
