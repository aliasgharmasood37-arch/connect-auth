export default function Dashboard() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Instagram Automation Dashboard</h1>

        <div style={styles.statusBox}>
          <div style={styles.statusIndicator}></div>
          <span style={styles.statusText}>No account connected</span>
        </div>

        <p style={styles.description}>
          Connect your Instagram Business account to activate AI-powered
          automation for DMs and comments.
        </p>

        <a href="/api/auth/login" style={styles.button}>
          Connect Instagram Business
        </a>

        <div style={styles.features}>
          <Feature text="AI-powered DM replies" />
          <Feature text="Auto comment responses" />
          <Feature text="60-day secure token storage" />
          <Feature text="Webhook-based real-time automation" />
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div style={styles.featureItem}>
      <span style={styles.check}>✔</span>
      <span>{text}</span>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
    fontFamily: "Inter, sans-serif",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
    textAlign: "center",
  },
  title: {
    color: "#fff",
    marginBottom: "20px",
  },
  statusBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  statusIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
  },
  statusText: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  description: {
    color: "#cbd5e1",
    fontSize: "14px",
    marginBottom: "25px",
  },
  button: {
    display: "inline-block",
    padding: "12px 20px",
    borderRadius: "8px",
    backgroundColor: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    fontWeight: "600",
    marginBottom: "30px",
  },
  features: {
    marginTop: "20px",
    textAlign: "left",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    color: "#cbd5e1",
    fontSize: "14px",
  },
  check: {
    color: "#22c55e",
    fontWeight: "bold",
  },
};