export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header style={{ padding: '10px', background: '#eee' }}>
        QMS App
      </header>
      <main>{children}</main>
    </div>
  );
}
