export async function onRequestGet(context) {
  const { request } = context;
  const cookie = request.headers.get('Cookie') || '';
  if (!cookie.includes('admin_session=1')) {
    // 未登录，返回登录页
    return new Response(getLoginHTML(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
  // 已登录，返回管理后台页面
  return new Response(getAdminHTML(), { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
}

function getLoginHTML() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="https://bigjackson.top/images/avatar.jpg" />
    <title>后台登录</title>
    <link rel="stylesheet" href="/style.css">
    <style>.container{max-width:400px;margin:80px auto;padding:32px 24px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);text-align:center}input{width:100%;margin:12px 0;padding:12px;border-radius:8px;border:1px solid #ddd;font-size:1em}button{width:100%;padding:12px;border-radius:8px;background:#667eea;color:#fff;font-size:1.1em;border:none;cursor:pointer;margin-top:12px}button:disabled{opacity:.6;cursor:not-allowed}</style>
  </head>
  <body>
    <div class="container">
      <h2>后台登录</h2>
      <input id="username" placeholder="账号" autocomplete="username" />
      <input id="password" type="password" placeholder="密码" autocomplete="current-password" />
      <button id="loginBtn">登录</button>
      <div id="msg" style="color:#e53e3e;margin-top:10px;"></div>
    </div>
    <script>
      document.getElementById('loginBtn').onclick = async function() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        this.disabled = true;
        const res = await fetch('/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
        if (res.ok) { location.reload(); } else {
          const data = await res.json();
          document.getElementById('msg').innerText = data.error || '登录失败';
          this.disabled = false;
        }
      }
    </script>
  </body>
  </html>`;
}

function getAdminHTML() {
  return `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理后台</title>
    <link rel="stylesheet" href="/style.css">
    <style>.container{max-width:900px;margin:40px auto;padding:32px 24px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.08);}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:10px 8px;border-bottom:1px solid #eee;text-align:left}th{background:#f8f9ff}a{color:#667eea;text-decoration:none}a:hover{text-decoration:underline}.logout{float:right;color:#e53e3e;cursor:pointer;font-size:.95em;}</style>
  </head>
  <body>
    <div class="container">
      <h2>管理后台 <span class="logout" onclick="logout()">退出</span></h2>
      <table id="fileTable">
        <thead><tr><th>文件名</th><th>大小</th><th>类型</th><th>上传时间</th><th>下载链接</th></tr></thead>
        <tbody></tbody>
      </table>
      <div id="msg" style="color:#e53e3e;margin-top:10px;"></div>
    </div>
    <script>
      async function loadFiles() {
        const res = await fetch('/admin/files');
        if (!res.ok) {
          document.getElementById('msg').innerText = '无法获取文件列表';
          return;
        }
        const data = await res.json();
        const tbody = document.querySelector('#fileTable tbody');
        tbody.innerHTML = '';
        for (const f of data.files) {
          const tr = document.createElement('tr');
          tr.innerHTML = '<td><span title="' + f.name + '">' + f.name + '</span></td>' +
                         '<td>' + formatSize(f.size) + '</td>' +
                         '<td>' + f.type + '</td>' +
                         '<td>' + formatTime(f.uploadTime) + '</td>' +
                         '<td><a href="' + f.url + '" target="_blank">下载</a></td>';
          tbody.appendChild(tr);
        }
      }
      function formatSize(bytes) {
        if (bytes === 0) return '0B';
        const k = 1024, sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(bytes)/Math.log(k));
        return (bytes/Math.pow(k,i)).toFixed(2)+' '+sizes[i];
      }
      function formatTime(ts) {
        const d = new Date(ts); return d.toLocaleString();
      }
      function logout() {
        document.cookie = 'admin_session=; Max-Age=0; path=/';
        location.reload();
      }
      loadFiles();
    </script>
  </body>
  </html>`;
}
