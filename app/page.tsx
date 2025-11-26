"use client";

import { useState } from "react";

export default function Page() {
  const [url, setUrl] = useState("");
  const [blocks, setBlocks] = useState<{ path: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "API 생성 실패");
        setLoading(false);
        return;
      }

      setBlocks(json.blocks ?? []);
    } catch (e: any) {
      setError(e.message ?? "알 수 없는 오류 발생");
    }

    setLoading(false);
  };

  const handleCopy = (code: string, i: number) => {
    navigator.clipboard.writeText(code);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-6">
      {/* ================= Header ================= */}
      <h1 className="text-2xl font-bold">Swagger → API Client Generator</h1>
      <p className="text-sm text-gray-600">
        Swagger JSON URL을 입력하면, <br />
        엔드포인트별로 타입과 axios 연동 코드를 자동으로 생성해줍니다.
      </p>

      {/* ================= Form ================= */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Swagger JSON URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="예: http://localhost:3000/doc/host-json"
          className="border rounded px-3 py-2 w-full text-sm"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !url}
        className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-400 cursor-pointer"
      >
        {loading ? "생성 중..." : "Generate API Client"}
      </button>

      {/* ================= 오류 ================= */}
      {error && <p className="text-sm text-red-500 whitespace-pre-wrap">{error}</p>}

      {/* ================= 결과 ================= */}
      <div className="space-y-10 mt-8">
        {blocks.map((b, i) => (
          <section key={b.path} className="border rounded p-5 bg-gray-50">
            <div className="flex flex-row justify-between items-center mb-4">
              <p className="font-bold text-lg">{b.path}</p>
              <button
                onClick={() => handleCopy(b.code, i)}
                className={`
              px-2 py-1 rounded text-xs font-medium
              transition-all duration-300 border cursor-pointer
              ${copied === i
                    ? "bg-lime-300 border-lime-500 text-black scale-110" // Copied 상태
                    : "bg-white/70 hover:bg-blue-600 hover:text-white hover:border-blue-500"}
            `}
              >
                {copied === i ? "✅ Copied!" : "📄 Copy"}
              </button>
            </div>

            <pre className="text-xs bg-black text-gray-300 p-4 rounded overflow-x-auto whitespace-pre-wrap">
              {b.code}
            </pre>
          </section>
        ))}
      </div>

    </div>
  );
}
