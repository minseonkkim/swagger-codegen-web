"use client";

import { useState } from "react";

export default function Page() {
  const [mode, setMode] = useState<"json" | "url">("json");
  const [url, setUrl] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [blocks, setBlocks] = useState<{ path: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSearch("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: mode === "url" ? url : null,
          json: mode === "json" ? rawJson : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "API 생성 실패");
        setLoading(false);
        return;
      }

      setBlocks(json.blocks ?? []);
    } catch (e: any) {
      setError(e.message ?? "오류 발생");
    }

    setLoading(false);
  };

  const handleCopy = (code: string, i: number) => {
    navigator.clipboard.writeText(code);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  };

  const filtered = blocks.filter(b =>
    b.path.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-6">

      <h1 className="text-2xl font-bold">Swagger → API Client Generator</h1>
      <p className="text-sm text-gray-600">
        Swagger JSON을 URL로 불러오거나 파일로 업로드하면, <br />
        엔드포인트별로 타입과 axios 연동 코드를 자동으로 생성해줍니다.
      </p>

      {/* ▼ 모드 변경 버튼 ▼ */}
      <div className="flex gap-6 items-center">

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="swagger-mode"
            checked={mode === "json"}
            onChange={() => setMode("json")}
            className="w-4 h-4"
          />
          <span>JSON 입력</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="swagger-mode"
            checked={mode === "url"}
            onChange={() => setMode("url")}
            className="w-4 h-4"
          />
          <span>URL 입력</span>
        </label>

      </div>

      {/* ▼ JSON 입력 모드 ▼ */}
      {mode === "json" && (
        <div className="space-y-2">
          <label className="text-sm font-bold">Swagger JSON 붙여넣기</label>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder="Swagger JSON을 여기에 그대로 붙여넣기"
            className="border px-3 py-2 w-full text-sm h-36 font-mono rounded shadow-sm ring-2"
          />
        </div>
      )}

      {/* ▼ URL 모드 ▼ */}
      {mode === "url" && (
        <div className="space-y-2">
          <label className="text-sm font-bold">Swagger JSON URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="예: http://localhost:3000/doc/host-json"
            className="border px-3 py-2 w-full text-sm rounded shadow-sm ring-2"
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || (mode === "json" && !rawJson) || (mode === "url" && !url)}
        className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-400 cursor-pointer"
      >
        {loading ? "생성 중..." : "Generate API Client"}
      </button>

      {blocks.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 엔드포인트 검색 (/auth 등)"
          className="border px-3 py-2 w-full text-sm rounded mt-4"
        />
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-10 mt-8">
        {filtered.map((b, i) => (
          <section key={b.path} className="border rounded p-5 bg-gray-50">
            <div className="flex justify-between mb-4">
              <p className="font-bold text-lg">{b.path}</p>

              <button
                onClick={() => handleCopy(b.code, i)}
                className={`px-2 py-1 text-xs rounded border transition cursor-pointer ${copied === i
                  ? "bg-lime-300 border-lime-500 text-black scale-110"
                  : "bg-white hover:bg-blue-600 hover:text-white"
                  }`}
              >
                {copied === i ? "Copied!" : "📄 Copy"}
              </button>
            </div>

            <pre className="text-xs bg-black text-gray-300 p-4 rounded whitespace-pre-wrap overflow-x-auto">
              {b.code}
            </pre>
          </section>
        ))}
      </div>
    </div>
  );
}
