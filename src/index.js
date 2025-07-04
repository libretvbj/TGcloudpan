// Cloudflare Workers + Telegram Bot Cloud Drive
// 环境变量: TG_TOKEN (Telegram Bot Token), TG_PD (Telegram Channel ID)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 处理CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理OPTIONS请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 主页 - 显示上传界面
      if (path === '/' && request.method === 'GET') {
        return new Response(getHTML(), {
          headers: {
            'Content-Type': 'text/html;charset=utf-8',
            ...corsHeaders
          }
        });
      }

      // 文件上传API
      if (path === '/upload' && request.method === 'POST') {
        return await handleFileUpload(request, env, corsHeaders);
      }

      // 获取文件列表API
      if (path === '/files' && request.method === 'GET') {
        return await getFileList(env, corsHeaders);
      }

      // 404处理
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

// 处理文件上传
async function handleFileUpload(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 检查文件类型（只允许图片）
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Only image files are allowed' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExtension}`;

    // 将文件上传到Telegram频道
    const telegramResult = await uploadToTelegram(file, fileName, env);
    
    if (!telegramResult.success) {
      return new Response(JSON.stringify({ error: telegramResult.error }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 保存文件信息到KV存储（如果使用KV）
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      telegramFileId: telegramResult.fileId,
      telegramMessageId: telegramResult.messageId,
      uploadTime: timestamp,
      url: telegramResult.url
    };

    return new Response(JSON.stringify({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully to Telegram'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

// 上传文件到Telegram
async function uploadToTelegram(file, fileName, env) {
  try {
    const TG_TOKEN = env.TG_TOKEN;
    const TG_PD = env.TG_PD;

    if (!TG_TOKEN || !TG_PD) {
      return { success: false, error: 'Telegram configuration missing' };
    }

    // 将文件转换为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 构建multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const formData = new FormData();
    
    // 添加文件
    const blob = new Blob([buffer], { type: file.type });
    formData.append('photo', blob, fileName);
    formData.append('chat_id', TG_PD);
    formData.append('caption', `📁 File: ${file.name}\n📏 Size: ${formatFileSize(file.size)}\n📅 Upload Time: ${new Date().toLocaleString()}`);

    // 发送到Telegram API
    const response = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.ok) {
      console.error('Telegram API error:', result);
      return { success: false, error: 'Failed to send to Telegram' };
    }

    // 获取文件信息
    const photo = result.result.photo[result.result.photo.length - 1]; // 获取最大尺寸的图片
    const fileId = photo.file_id;
    const fileUrl = `https://api.telegram.org/file/bot${TG_TOKEN}/${photo.file_id}`;

    return {
      success: true,
      fileId: fileId,
      messageId: result.result.message_id,
      url: fileUrl
    };

  } catch (error) {
    console.error('Telegram upload error:', error);
    return { success: false, error: 'Telegram upload failed' };
  }
}

// 获取文件列表（这里返回最近上传的文件信息）
async function getFileList(env, corsHeaders) {
  // 由于我们没有使用KV存储，这里返回一个简单的响应
  // 在实际应用中，你可以使用Cloudflare KV来存储文件信息
  return new Response(JSON.stringify({
    files: [],
    message: 'File list feature requires KV storage setup'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// HTML页面
function getHTML() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram云盘</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }

        .logo {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 15px;
            padding: 40px 20px;
            margin-bottom: 30px;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
        }

        .upload-area:hover {
            border-color: #667eea;
            background-color: #f8f9ff;
        }

        .upload-area.dragover {
            border-color: #667eea;
            background-color: #f0f4ff;
            transform: scale(1.02);
        }

        .upload-icon {
            font-size: 3em;
            color: #667eea;
            margin-bottom: 15px;
        }

        .upload-text {
            color: #666;
            font-size: 1.1em;
            margin-bottom: 10px;
        }

        .upload-hint {
            color: #999;
            font-size: 0.9em;
        }

        #fileInput {
            display: none;
        }

        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .progress {
            width: 100%;
            height: 6px;
            background-color: #f0f0f0;
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
            display: none;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.3s ease;
        }

        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            display: none;
        }

        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .file-info {
            background-color: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            margin-top: 15px;
            text-align: left;
        }

        .file-info h4 {
            color: #333;
            margin-bottom: 10px;
        }

        .file-info p {
            color: #666;
            margin: 5px 0;
        }

        .telegram-link {
            color: #0088cc;
            text-decoration: none;
            font-weight: bold;
        }

        .telegram-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📁</div>
        <h1>Telegram云盘</h1>
        <p class="subtitle">上传图片文件到Telegram频道</p>
        
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📤</div>
            <div class="upload-text">点击或拖拽文件到此处</div>
            <div class="upload-hint">支持 JPG, PNG, GIF, WebP 格式</div>
            <input type="file" id="fileInput" accept="image/*" multiple>
        </div>

        <button class="btn" id="uploadBtn" onclick="document.getElementById('fileInput').click()">
            选择文件
        </button>

        <div class="progress" id="progress">
            <div class="progress-bar" id="progressBar"></div>
        </div>

        <div class="status" id="status"></div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progressBar');
        const status = document.getElementById('status');

        // 拖拽上传
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // 点击上传
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });

        function handleFiles(files) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    uploadFile(file);
                } else {
                    showStatus('只支持图片文件', 'error');
                }
            });
        }

        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('file', file);

            // 显示进度条
            progress.style.display = 'block';
            progressBar.style.width = '0%';
            uploadBtn.disabled = true;
            showStatus('正在上传...', 'success');

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    progressBar.style.width = '100%';
                    showStatus('上传成功！文件已发送到Telegram频道', 'success');
                    
                    // 显示文件信息
                    const fileInfo = \`
                        <div class="file-info">
                            <h4>📁 文件信息</h4>
                            <p><strong>文件名:</strong> \${result.file.name}</p>
                            <p><strong>大小:</strong> \${formatFileSize(result.file.size)}</p>
                            <p><strong>类型:</strong> \${result.file.type}</p>
                            <p><strong>上传时间:</strong> \${new Date(result.file.uploadTime).toLocaleString()}</p>
                            <p><strong>Telegram链接:</strong> <a href="\${result.file.url}" class="telegram-link" target="_blank">查看文件</a></p>
                        </div>
                    \`;
                    status.innerHTML += fileInfo;
                } else {
                    showStatus('上传失败: ' + result.error, 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showStatus('上传失败: 网络错误', 'error');
            } finally {
                uploadBtn.disabled = false;
                setTimeout(() => {
                    progress.style.display = 'none';
                }, 2000);
            }
        }

        function showStatus(message, type) {
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }
    </script>
</body>
</html>
  `;
} 