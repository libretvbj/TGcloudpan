// Cloudflare Pages Functions API - 管理后台：获取所有上传内容
export async function onRequestGet(context) {
  const { env, request } = context;
  const auth = request.headers.get('authorization') || '';
  const USER = env.USER;
  const PASSWORD = env.PASSWORD;

  // Basic Auth 校验
  if (!USER || !PASSWORD) {
    return new Response('管理员账号未配置', { status: 500 });
  }
  const expected = 'Basic ' + btoa(`${USER}:${PASSWORD}`);
  if (auth !== expected) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin Area"' }
    });
  }

  // 读取所有KV内容
  const list = await env.UPLOADS_KV.list({ prefix: 'file:' });
  const files = [];
  for (const key of list.keys) {
    const value = await env.UPLOADS_KV.get(key.name);
    if (value) files.push(JSON.parse(value));
  }
  // 按时间倒序
  files.sort((a, b) => b.uploadTime - a.uploadTime);

  return new Response(JSON.stringify({ files }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 