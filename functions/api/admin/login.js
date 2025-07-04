export async function onRequestPost(context) {
  const { request, env } = context;
  const { USER, PASSWORD } = env;
  const { username, password } = await request.json();
  if (username === USER && password === PASSWORD) {
    // 简单 session: 设置 cookie
    const headers = {
      'Set-Cookie': `admin_session=1; Path=/; Max-Age=86400; SameSite=Lax; Secure`,
      'Content-Type': 'application/json'
    };
    return new Response(JSON.stringify({ success: true }), { headers });
  } else {
    return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 