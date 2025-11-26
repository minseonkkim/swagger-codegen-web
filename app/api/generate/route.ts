export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return Response.json({ error: "URL 필요" }, { status: 400 });

    const res = await fetch(url);
    if (!res.ok) return Response.json({ error: "Swagger 불러오기 실패" }, { status: 400 });

    const swagger = await res.json();

    const blocks = generateEndpointBlocks(swagger);
    return Response.json({ blocks });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "서버 에러" }, { status: 500 });
  }
}


/* ============================ 그룹 출력 ============================ */

function generateEndpointBlocks(swagger: any) {
  const schemas = swagger.components?.schemas ?? {};
  const paths = swagger.paths ?? {};

  const blocks: { path: string; code: string }[] = [];

  for (const path in paths) {
    const pathItem = paths[path];

    let code = "";

    const used = extractSchemasUsed(pathItem, schemas);
    if (Object.keys(used).length > 0) {
      code += "// 🧩 Types\n\n";
      code += generateSchemas(used) + "\n\n";
    } else code += "// (Types 없음)\n\n\n";

    code += "// 🚀 API Functions\n";
    for (const method in pathItem) {
      code += generateApiFunction(path, method, pathItem[method]) + "\n";
    }

    blocks.push({ path, code });
  }

  return blocks;
}


/* ============================ Schemas 생성 ============================ */

function generateSchemas(schemas: Record<string, any>) {
  let result = "";
  for (const name in schemas) {
    const s = schemas[name];
    const req = s.required ?? [];

    if (s.type === "object" && s.properties) {
      result += `export interface ${name} {\n`;
      for (const key in s.properties) {
        const prop = s.properties[key];
        const opt = req.includes(key) ? "" : "?";
        result += `  ${key}${opt}: ${resolveTs(prop)};\n`;
      }
      result += "}\n\n";
    }
  }
  return result;
}

function resolveTs(s: any): string {
  if (!s) return "any";
  if (s.$ref) return s.$ref.split("/").pop()!;
  if (s.enum) return s.enum.map((v: string | number) => JSON.stringify(v)).join(" | ");

  switch (s.type) {
    case "string": return "string";
    case "boolean": return "boolean";
    case "integer":
    case "number": return "number";
    case "array": return `${resolveTs(s.items)}[]`;
    case "object":
      if (!s.properties) return "Record<string,any>";
      return `{ ${Object.entries(s.properties).map(([k, v]: any) => `${k}: ${resolveTs(v)}`).join("; ")} }`;
    default: return "any";
  }
}


/* ============================ API 함수 생성 ============================ */

function generateApiFunction(path: string, method: string, op: any) {
  const fn = makeName(op.operationId, method, path);
  const params = op.parameters ?? [];
  const pPath = params.filter((p: any) => p.in === "path");
  const pQuery = params.filter((p: any) => p.in === "query");

  const body = op.requestBody?.content?.["application/json"]?.schema;
  const hasBody = !!body;

  const responses = op.responses ?? {};
  const ok = responses["200"] ?? responses["201"] ?? Object.values(responses)[0];
  const res = ok?.content?.["application/json"]?.schema;
  const resType = res ? resolveTs(res) : "any";

  const args: string[] = [];
  if (pPath.length) args.push(`path:{ ${pPath.map((p: any) => `${p.name}:${type(p.schema?.type)}`).join("; ")} }`);
  if (pQuery.length) args.push(`query?:{ ${pQuery.map((p: any) => `${p.name}${p.required ? "" : "?"}:${type(p.schema?.type)}`).join("; ")} }`);
  if (hasBody) args.push(`body:${resolveTs(body)}`);

  const url = path.replace(/{(.*?)}/g, (_, v) => `\${path.${v}}`);
  const argsStr = args.join(", ");

  return `
export async function ${fn}(${argsStr}):Promise<${resType}> {
  const res = await api.${method}(\`${url}\`${hasBody && pQuery.length ? ", body, {params:query}" :
      hasBody ? ", body" :
        pQuery.length ? ", {params:query}" : ""
    });
  return res.data;
}
`;
}

function extractSchemasUsed(op: any, all: any) {
  const used: any = {};
  const scan = (node: any) => {
    if (!node) return;
    if (node.$ref) {
      const key = node.$ref.split("/").pop();
      if (key && all[key]) used[key] = all[key];
    }
    if (typeof node === "object") Object.values(node).forEach(scan);
  };
  scan(op);
  return used;
}

function makeName(opId: string | undefined, method: string, path: string) {
  if (opId) return opId.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return method + path.replace(/[{}]/g, "").replace(/\/(.)/g, (_, c) => c.toUpperCase());
}

function type(t: string | undefined) { return t === "number" || t === "integer" ? "number" : t || "any"; }
