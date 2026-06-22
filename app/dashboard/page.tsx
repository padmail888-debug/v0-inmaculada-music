export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)', color: 'white', padding: '24px' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>Bienvenido al Dashboard</h1>
        <p style={{ color: '#cbd5e1', marginBottom: '32px', fontSize: '18px' }}>Tu dashboard está funcionando correctamente en producción.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Tu Perfil</h3>
            <p style={{ color: '#cbd5e1' }}>Conectado a tu cuenta premium</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Estadísticas</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7', marginBottom: '4px' }}>0</p>
            <p style={{ color: '#cbd5e1' }}>Canciones reproducidas</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '8px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Recomendación</h3>
            <p style={{ color: '#cbd5e1' }}>Descubre nueva música cada día</p>
          </div>
        </div>

        <a href="/" style={{ display: 'inline-block', backgroundColor: '#a855f7', color: 'white', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '500' }}>
          Volver al Inicio
        </a>
      </div>
    </div>
  )
}
