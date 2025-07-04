export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const fileUrl = url.searchParams.get('url');
  if (!fileUrl) {
    return new Response('Missing url', { status: 400 });
  }
  const resp = await fetch(fileUrl);
  const headers = new Headers(resp.headers);
  // 允许跨域
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(resp.body, {
    status: resp.status,
    headers
  });
} 