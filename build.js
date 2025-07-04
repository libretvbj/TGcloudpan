const fs = require('fs');
const path = require('path');

// 确保dist目录存在
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// HTML内容
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telegram云盘</title>
    <link rel="stylesheet" href="style.css">
    <link rel="icon" type="image/x-icon" href="https://bigjackson.top/images/avatar.jpg" />
</head>
<body>
    <div class="container">
        <div class="logo">📁</div>
        <h1>Telegram云盘</h1>
        <p class="subtitle">上传文件到Telegram频道</p>
        
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📤</div>
            <div class="upload-text">点击或拖拽文件到此处</div>
            <div class="upload-hint">支持任意类型文件（图片、文档、视频等）</div>
            <input type="file" id="fileInput" multiple>
        </div>

        <button class="btn" id="uploadBtn" onclick="document.getElementById('fileInput').click()">
            选择文件
        </button>

        <div class="progress" id="progress">
            <div class="progress-bar" id="progressBar"></div>
        </div>

        <div class="status" id="status"></div>
    </div>

    <!-- 预览模态框 -->
    <div id="previewModal" class="modal" style="display:none;">
      <div class="modal-content" id="previewContent"></div>
      <span class="modal-close" id="previewClose">&times;</span>
    </div>

    <script src="script.js"></script>
</body>
</html>`;

// CSS内容
const css = `* {
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

.modal {
  position: fixed; left: 0; top: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.modal-content {
  background: #fff; padding: 20px; border-radius: 10px; max-width: 90vw; max-height: 80vh; overflow: auto;
  display: flex; align-items: center; justify-content: center;
}
.modal-content img, .modal-content video {
  max-width: 80vw; max-height: 70vh;
}
.modal-close {
  position: fixed; right: 40px; top: 40px; font-size: 2em; color: #fff; cursor: pointer; z-index: 10000;
}
`;

// JavaScript内容
const js = `const uploadArea = document.getElementById('uploadArea');
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
        uploadFile(file);
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
        // 使用 XMLHttpRequest 以支持进度条
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload');
            xhr.upload.onprogress = function(e) {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressBar.style.width = percent + '%';
                }
            };
            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const result = JSON.parse(xhr.responseText);
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
                                <p><a href="#" onclick="showPreview('\${result.file.url}','\${result.file.type}');return false;" class="telegram-link">查看文件</a></p>
                            </div>
                        \`;
                        status.innerHTML += fileInfo;
                        resolve();
                    } else {
                        showStatus('上传失败: ' + result.error, 'error');
                        reject();
                    }
                } else {
                    showStatus('上传失败: 网络错误', 'error');
                    reject();
                }
            };
            xhr.onerror = function() {
                showStatus('上传失败: 网络错误', 'error');
                reject();
            };
            xhr.onloadend = function() {
                uploadBtn.disabled = false;
                setTimeout(() => {
                    progress.style.display = 'none';
                }, 2000);
            };
            xhr.send(formData);
        });
    } catch (error) {
        console.error('Upload error:', error);
        showStatus('上传失败: 网络错误', 'error');
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

// 预览窗口逻辑
const previewModal = document.getElementById('previewModal');
const previewContent = document.getElementById('previewContent');
const previewClose = document.getElementById('previewClose');
function showPreview(url, type) {
  if (type.startsWith('image/')) {
    previewContent.innerHTML = '<img src="' + url + '" style="max-width:80vw;max-height:70vh;">';
  } else if (type.startsWith('video/')) {
    previewContent.innerHTML = '<video src="' + url + '" controls style="max-width:80vw;max-height:70vh;"></video>';
  } else {
    previewContent.innerHTML = '<a href="' + url + '" target="_blank">在新标签页打开/下载</a>';
  }
  previewModal.style.display = 'flex';
}
previewClose.onclick = function() {
  previewModal.style.display = 'none';
};
previewModal.onclick = function(e) {
  if (e.target === previewModal) previewModal.style.display = 'none';
};`;

// 写入文件
fs.writeFileSync(path.join('dist', 'index.html'), html);
fs.writeFileSync(path.join('dist', 'style.css'), css);
fs.writeFileSync(path.join('dist', 'script.js'), js);

console.log('✅ 构建完成！文件已生成到 dist/ 目录'); 