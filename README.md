# Telegram云盘 - Cloudflare Pages + Telegram Bot

一个基于Cloudflare Pages和Telegram机器人的云存储系统，支持通过网页界面上传图片文件到Telegram频道。

## 功能特性

- 🖼️ 支持图片文件上传（JPG, PNG, GIF, WebP）
- 📱 自动转发到Telegram频道
- 🌐 现代化的Web界面
- 📤 拖拽上传支持
- 📊 实时上传进度显示
- 🔗 提供Telegram文件链接
- ⚡ 基于Cloudflare Pages Functions API

## 架构说明

本项目使用Cloudflare Pages架构：
- **静态文件**: HTML、CSS、JavaScript文件托管在Pages
- **后端API**: 使用Pages Functions处理文件上传
- **环境变量**: 在Pages项目中配置Telegram相关设置

## 环境变量配置

在Cloudflare Pages中需要设置以下环境变量：

### TG_TOKEN
Telegram机器人的Token，从[@BotFather](https://t.me/BotFather)获取

### TG_PD
Telegram频道的ID，可以是：
- 公开频道：`@channelname`
- 私有频道：`-100xxxxxxxxxx`（数字ID）

### 后台管理账号
- USER：后台登录账号
- PASSWORD：后台登录密码

## 设置步骤

### 1. 创建Telegram机器人

1. 在Telegram中搜索[@BotFather](https://t.me/BotFather)
2. 发送 `/newbot` 命令
3. 按照提示设置机器人名称和用户名
4. 获取Bot Token（格式：`123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 2. 创建Telegram频道

1. 在Telegram中创建新频道
2. 将你的机器人添加为频道管理员
3. 获取频道ID：
   - 公开频道：使用 `@channelname`
   - 私有频道：转发频道消息到[@userinfobot](https://t.me/userinfobot)获取数字ID

### 3. 部署到Cloudflare Pages

#### 使用Cloudflare Pages

1. 登录[Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入Pages
3. 创建新的Pages项目
4. 连接Git仓库或直接上传文件
5. 在Settings > Environment variables中添加：
   - `TG_TOKEN`: 你的机器人Token
   - `TG_PD`: 你的频道ID
6. 部署项目

## ⚠️ Cloudflare Pages 部署注意事项

1. **构建输出目录必须为 dist**
   - 在 Cloudflare Pages 项目设置中，"构建输出目录"应填写为 `dist`，否则会导致 404 错误。
   - 你可以在 Cloudflare Dashboard 的 Pages 项目设置里找到这个选项。
2. **主页面文件名必须为 index.html**
   - `dist/` 目录下必须有 `index.html` 文件，否则访问根路径 `/` 时会 404。
   - 运行 `npm run build` 或 `node build.js` 会自动生成 `dist/index.html`。
3. **构建和部署流程**
   - 每次更改代码后，务必先运行 `npm run build`（或直接运行 `node build.js`，如果没有配置 npm script）。
   - 构建完成后，`dist/` 目录会包含所有需要部署的静态文件。
   - 用 wrangler 或 Cloudflare Dashboard 部署时，确保选择 `dist` 作为部署目录。

# 环境设置
TG机器人设置：
TG_TOKEN=your_bot_token_here
TG_PD=your_channel_id_here
后台管理账号：
USER=admin
PASSWORD=your_password_here 

# KV空间
Cloudflare KV 命名空间，用于存储上传文件信息。
- 需在 Cloudflare 后台创建 KV 命名空间，并在 Pages Functions 绑定为 `UPLOADS_KV`。
- 绑定方法：Cloudflare Dashboard → Pages → 项目设置 → Functions → KV 命名空间绑定。

## 使用方法

1. 访问你的Pages URL（例如：`https://telegram-cloud-drive.pages.dev`）
2. 点击上传区域或拖拽图片文件
3. 文件将自动上传到Telegram频道
4. 上传成功后可以点击链接查看文件

## API接口

### 上传文件
```
POST /api/upload
Content-Type: multipart/form-data

参数：
- file: 图片文件
```

响应：
```json
{
  "success": true,
  "file": {
    "name": "example.jpg",
    "size": 1024000,
    "type": "image/jpeg",
    "telegramFileId": "AgAC...",
    "telegramMessageId": 123,
    "uploadTime": 1640995200000,
    "url": "https://api.telegram.org/file/botTOKEN/file_id"
  },
  "message": "File uploaded successfully to Telegram"
}
```

## 项目结构

```
├── dist/                    # 构建输出目录
│   ├── index.html          # 主页面
│   ├── style.css           # 样式文件
│   └── script.js           # 前端脚本
├── functions/
│   └── api/
│       └── upload.js       # Pages Functions API
├── src/
│   └── index.js            # 原始Worker文件（已弃用）
├── build.js                # 构建脚本
├── wrangler.toml           # Pages配置
├── package.json            # 项目依赖
├── deploy.sh               # Linux/Mac部署脚本
├── deploy.bat              # Windows部署脚本
└── README.md              # 项目说明
```

## 开发

### 本地开发

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 本地开发服务器
npm run dev
```

### 自定义配置

#### 修改支持的文件类型

在 `functions/api/upload.js` 中修改 `allowedTypes` 数组：

```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

#### 修改Telegram消息格式

在 `uploadToTelegram` 函数中修改caption：

```javascript
formData.append('caption', `📁 File: ${file.name}\n📏 Size: ${formatFileSize(file.size)}\n📅 Upload Time: ${new Date().toLocaleString()}`);
```

#### 添加文件大小限制

在 `functions/api/upload.js` 中添加：

```javascript
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  return new Response(JSON.stringify({ error: 'File too large' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}
```

## 故障排除

### 常见问题

1. **上传失败：Telegram configuration missing**
   - 检查Pages项目中的环境变量 `TG_TOKEN` 和 `TG_PD` 是否正确设置

2. **上传失败：Failed to send to Telegram**
   - 确保机器人已添加到频道并具有发送消息权限
   - 检查频道ID是否正确

3. **文件类型不支持**
   - 确保上传的是图片文件（JPG, PNG, GIF, WebP）

4. **构建失败**
   - 确保Node.js版本 >= 14
   - 检查 `build.js` 文件是否存在

### 调试

在Cloudflare Pages的日志中查看详细错误信息：

```bash
wrangler pages tail telegram-cloud-drive
```

## Pages vs Workers 对比

| 特性 | Pages | Workers |
|------|-------|---------|
| 静态文件托管 | ✅ 原生支持 | ❌ 需要额外配置 |
| 构建流程 | ✅ 自动构建 | ❌ 手动处理 |
| 部署速度 | ✅ 更快 | ❌ 较慢 |
| 开发体验 | ✅ 更好 | ❌ 一般 |
| 成本 | ✅ 免费额度更多 | ❌ 免费额度较少 |

## 许可证

本项目基于 MIT 协议开源，详见 LICENSE 文件。

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v2.0.0
- 迁移到Cloudflare Pages架构
- 分离前端和后端代码
- 使用Pages Functions API
- 改进构建流程

### v1.0.0
- 初始版本（Workers架构）
- 支持图片文件上传
- 集成Telegram Bot API
- 现代化Web界面 