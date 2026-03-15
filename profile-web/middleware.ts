import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const rootDomain = process.env.ROOT_DOMAIN ?? "thehomequarters.com";

  // Extract subdomain (strip root domain and any port)
  const subdomain = host.replace(`.${rootDomain}`, "").split(":")[0];

  // Pass-through when there's no subdomain or it's a reserved one
  if (
    !subdomain ||
    subdomain === rootDomain ||
    subdomain === "admin" ||
    subdomain === "www"
  ) {
    return NextResponse.next();
  }

  // Rewrite to /[memberCode] without changing the visible URL
  const url = req.nextUrl.clone();
  const existingPath = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `/${subdomain}${existingPath}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api).*)"],
};
