/* ===========================================================
    SCHEMAS → TS 타입 변환
=========================================================== */
export function resolveTs(s: any): string {
  if (!s) return "any";
  if (s.$ref) return s.$ref.split("/").pop()!;
  if (s.enum) return s.enum.map((v: any) => JSON.stringify(v)).join(" | ");

  switch (s.type) {
    case "string": return "string";
    case "boolean": return "boolean";
    case "integer":
    case "number": return "number";
    case "array": return `${resolveTs(s.items)}[]`;
    case "object":
      if (!s.properties) return "Record<string,any>";
      return `{ ${Object.entries(s.properties)
        .map(([k, v]: any) => `${k}: ${resolveTs(v)}`)
        .join("; ")} }`;
    default: return "any";
  }
}

/* ===========================================================
    interface 생성
=========================================================== */
export function generateSchemas(schemas: Record<string, any>) {
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
      result += `}\n\n`;
    }
  }
  return result;
}

/* ===========================================================
    API 함수 생성
=========================================================== */
export function generateApiFunction(path: string, method: string, op: any) {
  const fn = makeName(op.operationId, method, path);
  const params = op.parameters ?? [];

  const pPath = params.filter((p: any) => p.in === "path");
  const pQuery = params.filter((p: any) => p.in === "query");

  const body = op.requestBody?.content?.["application/json"]?.schema;
  const responses = op.responses ?? {};
  const ok = responses["200"] ?? responses["201"] ?? Object.values(responses)[0];
  const res = ok?.content?.["application/json"]?.schema;
  const resType = res ? resolveTs(res) : "any";

  const args: string[] = [];
  if (pPath.length) args.push(`path:{ ${pPath.map((p: any) => `${p.name}:any`).join("; ")} }`);
  if (pQuery.length) args.push(`query?:{ ${pQuery.map((p: any) => `${p.name}?:any`).join("; ")} }`);
  if (body) args.push(`body:${resolveTs(body)}`);

  const url = path.replace(/{(.*?)}/g, (_, v) => `\${path.${v}}`);
  const argsStr = args.join(", ");

  return `
export async function ${fn}(${argsStr}):Promise<${resType}> {
  const res = await api.${method}(\`${url}\`
    ${body && pQuery.length ? ", body, {params:query}"
      : body ? ", body"
        : pQuery.length ? ", {params:query}"
          : ""
    });
  return res.data;
}
`;
}

/* ===========================================================
    사용된 Schema만 추출
=========================================================== */
export function extractSchemasUsed(op: any, all: any) {
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

/* ===========================================================
    함수명 규칙 자동 변환
=========================================================== */
export function makeName(opId: string | undefined, method: string, path: string) {
  if (opId)
    return opId.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()); // ← 타입 명시 완료

  return method + path
    .replace(/[{}]/g, "")
    .replace(/\/(.)/g, (_: string, c: string) => c.toUpperCase()); // ← 이것도 타입추가!
}


/* ===========================================================
    blocks 생성 (main export)
=========================================================== */
export function generateEndpointBlocks(swagger: any) {
  const schemas = swagger.components?.schemas ?? {};
  const paths = swagger.paths ?? {};
  const list: { path: string; code: string }[] = [];

  for (const path in paths) {
    const item = paths[path];
    let code = "";

    const used = extractSchemasUsed(item, schemas);
    code += (Object.keys(used).length > 0)
      ? `// 🧩 Types\n\n${generateSchemas(used)}\n`
      : "// (Types 없음)\n\n";

    code += "// 🚀 API Functions\n";
    for (const m in item) code += generateApiFunction(path, m, item[m]) + "\n";

    list.push({ path, code });
  }
  return list;
}
