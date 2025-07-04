export async function onRequestGet(context) {
  const { env, request } = context;
  // 校验 session cookie
  const cookie = request.headers.get('Cookie') || '';
  if (!cookie.includes('admin_session=1')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!env.UPLOADS_KV) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 500 });
  }
  // 列出所有上传文件
  const list = await env.UPLOADS_KV.list({ prefix: 'file:' });
  const files = [];
  for (const item of list.keys) {
    const value = await env.UPLOADS_KV.get(item.name);
    if (value) files.push(JSON.parse(value));
  }
  // 按上传时间倒序
  files.sort((a, b) => b.uploadTime - a.uploadTime);
  return new Response(JSON.stringify({ files }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 