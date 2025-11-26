"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResultPage() {
  return (
    <Suspense fallback={<p className="p-10 text-gray-500">Loading...</p>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const params = useSearchParams(); // 이제 안전함
  const [blocks, setBlocks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("swagger-result");
    if (saved) setBlocks(JSON.parse(saved));
  }, []);

  const filtered = blocks.filter(b =>
    b.path.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  );

  const copy = (code: string, i: number) => {
    navigator.clipboard.writeText(code);
    setCopied(i);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="max-w-5xl mx-auto p-10 space-y-10">
      <h1 className="text-xl font-bold">🎉 코드 생성 완료</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 /auth /host 등 검색"
        className="border px-3 py-2 w-full text-sm rounded"
      />

      {filtered.map((b, i) => (
        <section key={b.path} className="border rounded p-5 bg-gray-50">
          <div className="flex justify-between mb-4">
            <p className="font-bold">{b.path}</p>

            <button
              onClick={() => copy(b.code, i)}
              className={`px-2 py-1 text-xs border rounded transition ${copied === i
                ? "bg-lime-300 border-lime-500 scale-110"
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
  );
}
