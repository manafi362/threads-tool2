"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("バズ系");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setResult("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, tone }),
    });

    const data = await res.json();
    setResult(data.result || data.error);

    setLoading(false);
  };

  const handleCopy = async () => {
  if (!result) return;

  await navigator.clipboard.writeText(result);
  setCopied(true);

  setTimeout(() => setCopied(false), 2000);
};

const handleShareThreads = () => {
  if (!result) return;

  const formatted = result
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

  const params = new URLSearchParams({
    text: formatted,
  });

  const url = `https://www.threads.net/intent/post?${params.toString()}`;
  window.open(url, "_blank");
};

  return (
    <div
  style={{
    minHeight: "100vh",
    backgroundColor: "#f5f5f7",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <div
    style={{
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "20px",
      width: "600px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    }}
  >
    <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
      Threads投稿生成ツール
    </h1>

    <textarea
      placeholder="テーマを入力..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      style={{
        width: "100%",
        height: "100px",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid #ddd",
      }}
    />

    <select
      value={tone}
      onChange={(e) => setTone(e.target.value)}
      style={{
        marginTop: "15px",
        padding: "10px",
        width: "100%",
        borderRadius: "10px",
      }}
    >
      <option>バズ系</option>
      <option>真面目系</option>
      <option>恋愛系</option>
      <option>教育系</option>
    </select>

    <button
      onClick={handleGenerate}
      style={{
        marginTop: "20px",
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        backgroundColor: "#111",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
     {loading ? "文章を考え中..." : "生成する"}
    </button>

    {result && (
      <div style={{ marginTop: "30px" }}>
        <div
  onClick={handleCopy}
  style={{
    backgroundColor: "#fafafa",
    padding: "15px",
    borderRadius: "10px",
    cursor: "pointer",
    whiteSpace: "pre-wrap",
    border: "1px solid #eee",
    lineHeight: "1.4",
    fontSize: "15px",
    letterSpacing: "0.02em",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  }}
>
  {result}
</div>

        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <button
  onClick={handleCopy}
  style={{
    marginTop: "10px",
    padding: "8px 16px",
    backgroundColor: copied ? "#4caf50" : "#333",
    color: "white",
    border: "none",
    borderRadius: "5px",
    transform: "scale(1)",
    transition: "0.2s"
  }}
  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
            {copied ? "コピー完了" : "コピー"}
          </button>

          <button
  onClick={handleShareThreads}
  style={{
    marginTop: "10px",
    padding: "8px 16px",
    backgroundColor: "#000",
    color: "white",
    borderRadius: "5px",
    transform: "scale(1)",
    transition: "0.2s"
  }}
  onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
  onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
>
  Threadsで投稿する 🚀
</button>
        </div>
      </div>
    )}
  </div>
</div>
  );
}