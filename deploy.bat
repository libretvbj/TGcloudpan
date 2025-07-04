@echo off
chcp 65001 >nul
echo 🚀 开始部署Telegram云盘 (Pages版本)...

REM 检查是否安装了wrangler
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到wrangler，正在安装...
    npm install -g wrangler
)

REM 检查是否已登录
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo 🔐 请先登录Cloudflare...
    wrangler login
)

REM 安装依赖
echo 📦 安装项目依赖...
npm install

REM 构建项目
echo 🔨 构建项目...
npm run build

REM 设置环境变量
echo 🔧 设置环境变量...
set /p TG_TOKEN="请输入你的Telegram Bot Token: "
echo %TG_TOKEN% | wrangler pages secret put TG_TOKEN --project-name=telegram-cloud-drive

set /p TG_PD="请输入你的Telegram频道ID (例如: @channelname 或 -100xxxxxxxxxx): "
echo %TG_PD% | wrangler pages secret put TG_PD --project-name=telegram-cloud-drive

REM 部署
echo 🚀 部署到Cloudflare Pages...
wrangler pages deploy dist --project-name=telegram-cloud-drive

echo ✅ 部署完成！
echo 🌐 你的云盘地址: https://telegram-cloud-drive.pages.dev
echo 📖 详细使用说明请查看 README.md
pause 