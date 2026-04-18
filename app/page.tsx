export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "24px",
        backgroundColor: "#f5f5f7",
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          maxWidth: "520px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "42px", marginBottom: "14px" }}>🛠️</div>

        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            color: "#111",
          }}
        >
          現在メンテナンス中です
        </h1>

        <p
          style={{
            marginTop: "14px",
            color: "#666",
            lineHeight: 1.7,
            fontSize: "15px",
          }}
        >
          ただいま機能改善のため、一時的にご利用を停止しています。
          <br />
          しばらくしてから、もう一度アクセスしてください。
        </p>
      </div>
    </div>
  );
}