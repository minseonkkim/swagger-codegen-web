"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-10 space-y-4">
      <input
        className="border p-2 w-full"
        placeholder="Swagger JSON URL 입력!"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={handleGenerate}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Swagger 불러오기
      </button>

      {result && (
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
