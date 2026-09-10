// Vercel Middleware runs BEFORE the static filesystem, so it is the only way to
// make the site root go through server-side rendering: a `rewrites` rule for "/"
// never fires because the built `index.html` matches the path first.
//
// Everything else keeps using the rewrites in vercel.json.

export const config = {
  matcher: ["/"],
};

export default function middleware(request) {
  const url = new URL(request.url);
  url.pathname = "/api/render";
  url.searchParams.set("path", "/");

  return new Response(null, {
    headers: { "x-middleware-rewrite": url.toString() },
  });
}
