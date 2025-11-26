export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { generateEndpointBlocks } from "@/app/lib/swagger-generator";

export async function POST(req: NextRequest) {
  try {
    const { url, json } = await req.json();

    let swagger;

    if (json) {
      try {
        swagger = JSON.parse(json);
      } catch {
        return Response.json({ error: "JSON 형식 오류" }, { status: 400 });
      }
    } else if (url) {
      const res = await fetch(url);
      if (!res.ok)
        return Response.json({ error: "URL 접근 실패" }, { status: 400 });
      swagger = await res.json();
    } else return Response.json({ error: "URL or JSON 필요" }, { status: 400 });

    return Response.json({ blocks: generateEndpointBlocks(swagger) });
  } catch {
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
