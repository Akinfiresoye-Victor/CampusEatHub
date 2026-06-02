export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #eef2ff, #d8d4fe, #818cf8)',
    }}>
      <img src="/elizade.png" alt="logo" style={{ width: '80px', marginBottom: '20px' }} />
      <div style={{
        width: '45px',
        height: '45px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid #4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ marginTop: '20px', color: '#4f46e5', fontWeight: 600, fontSize: '1rem' }}>
        Loading CampusConnect...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}