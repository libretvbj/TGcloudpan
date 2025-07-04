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
}`;

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
                                <p><strong>Telegram链接:</strong> <a href="\${result.file.url}" class="telegram-link" target="_blank">查看文件</a></p>
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
}`;

// 管理后台HTML
const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>管理后台 - Telegram云盘</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
  <div class="admin-container">
    <h2>管理后台</h2>
    <form id="loginForm">
      <input type="text" id="username" placeholder="账号" required />
      <input type="password" id="password" placeholder="密码" required />
      <button type="submit">登录</button>
    </form>
    <div id="adminContent" style="display:none;">
      <h3>上传内容列表</h3>
      <table id="fileTable">
        <thead><tr><th>文件名</th><th>大小</th><th>类型</th><th>时间</th><th>操作</th></tr></thead>
        <tbody></tbody>
      </table>
      <button id="logoutBtn">退出登录</button>
    </div>
    <div id="adminStatus"></div>
  </div>
  <script src="admin.js"></script>
</body>
</html>`;

// 管理后台JS
const adminJs = 'const loginForm = document.getElementById(\'loginForm\');\nconst adminContent = document.getElementById(\'adminContent\');\nconst fileTable = document.getElementById(\'fileTable\').querySelector(\'tbody\');\nconst statusDiv = document.getElementById(\'adminStatus\');\nconst logoutBtn = document.getElementById(\'logoutBtn\');\n\nfunction setStatus(msg, type) {\n  statusDiv.textContent = msg;\n  statusDiv.className = type ? \'status \' + type : \'\';\n}\n\nfunction saveAuth(user, pass) {\n  sessionStorage.setItem(\'admin_user\', user);\n  sessionStorage.setItem(\'admin_pass\', pass);\n}\nfunction clearAuth() {\n  sessionStorage.removeItem(\'admin_user\');\n  sessionStorage.removeItem(\'admin_pass\');\n}\nfunction getAuth() {\n  const u = sessionStorage.getItem(\'admin_user\');\n  const p = sessionStorage.getItem(\'admin_pass\');\n  return u && p ? {u, p} : null;\n}\n\nasync function fetchFiles(user, pass) {\n  setStatus(\'正在加载...\', \'\');\n  const auth = \'Basic \' + btoa(`\${user}:\${pass}`);\n  const res = await fetch(\'/api/admin/list\', { headers: { authorization: auth } });\n  if (res.status === 401) {\n    setStatus(\'认证失败，请重新登录\', \'error\');\n    clearAuth();\n    adminContent.style.display = \'none\';\n    loginForm.style.display = \'\';\n    return;\n  }\n  const data = await res.json();\n  fileTable.innerHTML = \'\';\n  for (const f of data.files) {\n    const tr = document.createElement(\'tr\');\n    tr.innerHTML = `<td>\${f.name}</td><td>\${formatFileSize(f.size)}</td><td>\${f.type}</td><td>\${new Date(f.uploadTime).toLocaleString()}</td><td><a href=\"\${f.url}\" target=\"_blank\">下载</a></td>`;\n    fileTable.appendChild(tr);\n  }\n  setStatus(\'加载完成\', \'success\');\n}\n\nloginForm.onsubmit = async e => {\n  e.preventDefault();\n  const user = username.value.trim();\n  const pass = password.value;\n  saveAuth(user, pass);\n  await tryLogin();\n};\n\nlogoutBtn.onclick = () => {\n  clearAuth();\n  adminContent.style.display = \'none\';\n  loginForm.style.display = \'\';\n  setStatus(\'已退出登录\', \'\');\n};\n\nasync function tryLogin() {\n  const auth = getAuth();\n  if (!auth) return;\n  loginForm.style.display = \'none\';\n  adminContent.style.display = \'\';\n  await fetchFiles(auth.u, auth.p);\n}\n\nfunction formatFileSize(bytes) {\n  if (bytes === 0) return \'0 Bytes\';\n  const k = 1024;\n  const sizes = [\'Bytes\', \'KB\', \'MB\', \'GB\'];\n  const i = Math.floor(Math.log(bytes) / Math.log(k));\n  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + \' \' + sizes[i];\n}\n\nwindow.onload = () => {\n  if (getAuth()) tryLogin();\n};\n';

// 管理后台CSS
const adminCss = `.admin-container{max-width:500px;margin:60px auto;padding:32px 24px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);text-align:center;}
.admin-container h2{margin-bottom:24px;}
#loginForm{display:flex;flex-direction:column;gap:16px;margin-bottom:16px;}
#loginForm input{padding:12px;border-radius:8px;border:1px solid #ddd;font-size:1em;}
#loginForm button{padding:12px;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;font-size:1em;cursor:pointer;}
#adminContent{margin-top:24px;}
#fileTable{width:100%;border-collapse:collapse;margin-bottom:16px;}
#fileTable th,#fileTable td{border:1px solid #eee;padding:8px;}
#fileTable th{background:#f8f9fa;}
#fileTable td a{color:#0088cc;text-decoration:none;}
#fileTable td a:hover{text-decoration:underline;}
#logoutBtn{margin-top:8px;padding:8px 24px;border-radius:8px;background:#eee;border:none;cursor:pointer;}
.status{margin-top:12px;padding:8px;border-radius:6px;}
.status.success{background:#d4edda;color:#155724;}
.status.error{background:#f8d7da;color:#721c24;}`;

// 写入文件
fs.writeFileSync(path.join('dist', 'index.html'), html);
fs.writeFileSync(path.join('dist', 'style.css'), css);
fs.writeFileSync(path.join('dist', 'script.js'), js);
fs.writeFileSync(path.join('dist', 'admin.html'), adminHtml);
fs.writeFileSync(path.join('dist', 'admin.js'), adminJs);
fs.writeFileSync(path.join('dist', 'admin.css'), adminCss);

console.log('✅ 构建完成！文件已生成到 dist/ 目录'); 