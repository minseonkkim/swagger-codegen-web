"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  const [mode, setMode] = useState<"json" | "url">("json");
  const [url, setUrl] = useState("");
  const [rawJson, setRawJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

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

      // 결과 페이지로 이동
      sessionStorage.setItem("swagger-result", JSON.stringify(json.blocks));
      router.push("/result");
    } catch (e: any) {
      setError(e.message);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-6">
      <h1 className="text-2xl font-bold">Swagger → API Client Generator</h1>
      <p className="text-sm text-gray-600">
        Swagger JSON을 직접 붙여넣거나 URL로 불러오면, <br />
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
          <label className="text-sm font-bold">Swagger JSON</label>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            placeholder="Swagger JSON 붙여넣기"
            className="border px-3 py-2 w-full text-sm h-36 rounded shadow-sm ring-2"
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
        disabled={
          (mode === "json" && !rawJson) || (mode === "url" && !url) || loading
        }
        className="px-4 py-2 rounded bg-black text-white text-sm disabled:bg-gray-400"
      >
        {loading ? "생성 중..." : "코드 생성"}
      </button>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
