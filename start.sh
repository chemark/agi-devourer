#!/bin/bash
# AGI 吞噬者 v2 - 本地开发启动脚本
# 用法：chmod +x start.sh && ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/chameleon-v2"
PORT=4173

echo "🦎 舌尖上的 AGI v2 启动中..."

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ 未检测到 npm，请先安装 Node.js。"
    exit 1
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
    echo "📦 首次运行，正在安装 v2 依赖..."
    (cd "$APP_DIR" && npm install)
fi

echo "🔄 清理旧进程..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
sleep 0.5

echo "🌐 启动 v2 开发服务器 (端口 $PORT)..."
cd "$APP_DIR"
npm run dev -- --host 127.0.0.1 --port $PORT &
SERVER_PID=$!

sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    echo ""
    echo "✅ v2 已就绪！请在浏览器打开："
    echo "   👉 http://127.0.0.1:$PORT"
    echo ""
    echo "按 Ctrl+C 停止开发服务器"
    echo ""
    open "http://127.0.0.1:$PORT" 2>/dev/null || true
    trap "echo '🛑 关闭 v2 开发服务器...'; kill $SERVER_PID 2>/dev/null; exit 0" INT TERM
    wait
else
    echo "❌ 启动失败，请检查 Node.js / npm 是否已安装。"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi
