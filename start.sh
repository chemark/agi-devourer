#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$SCRIPT_DIR/chameleon-v2"
PORT=4173

echo "舌尖上的 AGI V2 Alpha 启动中..."

if ! command -v npm >/dev/null 2>&1; then
  echo "未检测到 npm，请先安装 Node.js。"
  exit 1
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "首次运行，正在安装依赖..."
  (cd "$APP_DIR" && npm install)
fi

cd "$APP_DIR"
exec npm run dev -- --host 127.0.0.1 --port $PORT
