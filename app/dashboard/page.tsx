export default function Dashboard() {
  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Instagram Automation</h1>
          <div style={styles.connectedBadge}>
            <span style={styles.greenDot}></span>
            Connected
          </div>
        </div>

        {/* Account Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Connected Account</h2>
          <div style={styles.accountRow}>
            <div>
              <p style={styles.label}>Username</p>
              <p style={styles.value}>@your_instagram_username</p>
            </div>
            <div>
              <p style={styles.label}>Token Expiry</p>
              <p style={styles.value}>60 days remaining</p>
            </div>
          </div>
        </div>

        {/* Automation Controls */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Automation Controls</h2>

          <div style={styles.toggleRow}>
            <div>
              <p style={styles.label}>AI DM Replies</p>
              <p style={styles.subtext}>
                Automatically reply to incoming direct messages.
              </p>
            </div>
            <button style={styles.activeButton}>Active</button>
          </div>

          <div style={styles.toggleRow}>
            <div>
              <p style={styles.label}>Auto Comment Replies</p>
              <p style={styles.subtext}>
                Reply to new comments on posts automatically.
              </p>
            </div>
            <button style={styles.activeButton}>Active</button>
          </div>
        </div>

        {/* Analytics Preview */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Performance Overview</h2>
          <div style={styles.analyticsRow}>
            <Stat label="DMs Handled" value="124" />
            <Stat label="Comments Replied" value="87" />
            <Stat label="Response Rate" value="98%" />
          </div>
        </div>

        {/* Disconnect */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button style={styles.disconnectButton}>
            Disconnect Instagram
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statBox}>
      <p style={styles.statValue}>{value}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    padding: "40px",
    fontFamily: "Inter, sans-serif",
    color: "#fff",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 600,
  },
  connectedBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1e293b",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
  },
  greenDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  cardTitle: {
    marginBottom: "20px",
    fontSize: "18px",
  },
  accountRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  label: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  value: {
    fontSize: "16px",
    marginTop: "4px",
  },
  subtext: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  activeButton: {
    backgroundColor: "#22c55e",
    color: "#000",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  analyticsRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  statBox: {
    backgroundColor: "#0f172a",
    padding: "15px",
    borderRadius: "8px",
    width: "30%",
    textAlign: "center",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: 600,
  },
  statLabel: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};