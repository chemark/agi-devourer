#!/bin/bash
# AGI 吞噬者 - 游戏启动脚本
# 用法：chmod +x start.sh && ./start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🦎 AGI 吞噬者 启动中..."

# 杀掉占用端口的旧进程
echo "🔄 清理旧进程..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 0.5

# 启动 CORS 代理
echo "🔗 启动 CORS 代理 (端口 3001)..."
node "$SCRIPT_DIR/proxy.js" &
PROXY_PID=$!

# 启动游戏 HTTP 服务
echo "🌐 启动游戏服务 (端口 8080)..."
python3 -m http.server 8080 --directory "$SCRIPT_DIR/chameleon" &
SERVER_PID=$!

sleep 1

# 验证两个服务都在跑
if kill -0 $PROXY_PID 2>/dev/null && kill -0 $SERVER_PID 2>/dev/null; then
    echo ""
    echo "✅ 游戏已就绪！请在浏览器打开："
    echo "   👉 http://localhost:8080"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    echo ""
    # 打开浏览器
    open "http://localhost:8080" 2>/dev/null || true
    # 等待，捕获退出信号
    trap "echo '🛑 关闭所有服务...'; kill $PROXY_PID $SERVER_PID 2>/dev/null; exit 0" INT TERM
    wait
else
    echo "❌ 启动失败，请检查 Node.js 和 Python3 是否已安装"
    kill $PROXY_PID $SERVER_PID 2>/dev/null
    exit 1
fi
