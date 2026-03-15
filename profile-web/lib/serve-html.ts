import { readFile } from "fs/promises";
import path from "path";

export async function serveHtml(relativePath: string): Promise<Response> {
  const html = await readFile(
    path.join(process.cwd(), "public/website", relativePath),
    "utf-8"
  );
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
