#!/bin/bash

# Telegram云盘部署脚本 (Cloudflare Pages版本)

echo "🚀 开始部署Telegram云盘 (Pages版本)..."

# 检查是否安装了wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ 未找到wrangler，正在安装..."
    npm install -g wrangler
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo "🔐 请先登录Cloudflare..."
    wrangler login
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
npm run build

# 设置环境变量
echo "🔧 设置环境变量..."
echo "请输入你的Telegram Bot Token:"
read -s TG_TOKEN
wrangler pages secret put TG_TOKEN --project-name=telegram-cloud-drive <<< "$TG_TOKEN"

echo "请输入你的Telegram频道ID (例如: @channelname 或 -100xxxxxxxxxx):"
read TG_PD
wrangler pages secret put TG_PD --project-name=telegram-cloud-drive <<< "$TG_PD"

# 部署
echo "🚀 部署到Cloudflare Pages..."
wrangler pages deploy dist --project-name=telegram-cloud-drive

echo "✅ 部署完成！"
echo "🌐 你的云盘地址: https://telegram-cloud-drive.pages.dev"
echo "📖 详细使用说明请查看 README.md" 