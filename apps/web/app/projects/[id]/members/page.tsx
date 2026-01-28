export default function MembersPage() {
  const members = [
    { email: "owner@example.com", role: "owner" },
    { email: "admin@example.com", role: "admin" },
    { email: "viewer@example.com", role: "viewer" }
  ];
  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>メンバー管理</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Demo Project</div>
        </div>
        <button className="button ghost">招待を送る</button>
      </header>
      <main className="main">
        <div className="card">
          <div className="section-title">
            <h2>メンバー</h2>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.email}>
                  <td>{m.email}</td>
                  <td>
                    <span className="badge">{m.role}</span>
                  </td>
                  <td>
                    <div className="stack">
                      <button className="badge">ロール変更</button>
                      <button className="badge">削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
