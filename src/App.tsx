import { useState, useEffect } from 'react';
import { CalendarDays, Timer, ShieldBan, Settings, Moon, Sun } from 'lucide-react';
import Horario from './components/Horario';
import './index.css';

type View = 'horario' | 'pomodoro' | 'bloqueador';

function App() {
  const [activeView, setActiveView] = useState<View>('horario');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <>
      <div className="floating-menu">
        <button 
          className={`floating-btn ${activeView === 'horario' ? 'active' : ''}`}
          onClick={() => setActiveView('horario')}
          title="Horario de Clases"
        >
          <CalendarDays size={22} />
        </button>
        <button 
          className={`floating-btn ${activeView === 'pomodoro' ? 'active' : ''}`}
          onClick={() => setActiveView('pomodoro')}
          title="Pomodoro"
        >
          <Timer size={22} />
        </button>
        <button 
          className={`floating-btn ${activeView === 'bloqueador' ? 'active' : ''}`}
          onClick={() => setActiveView('bloqueador')}
          title="Bloqueador"
        >
          <ShieldBan size={22} />
        </button>
        <div className="divider"></div>
        <button className="floating-btn" onClick={toggleTheme} title={isDarkMode ? 'Tema Claro' : 'Tema Oscuro'}>
          {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button className="floating-btn" title="Configuración">
          <Settings size={22} />
        </button>
      </div>

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">
            {activeView === 'horario' && 'Tu Horario Semanal'}
            {activeView === 'pomodoro' && 'Temporizador Pomodoro'}
            {activeView === 'bloqueador' && 'Modo Enfoque'}
          </h1>
          <p className="page-subtitle">
            {activeView === 'horario' && 'Organiza tus bloques de estudio y clases.'}
            {activeView === 'pomodoro' && 'Mantén la concentración con ciclos de trabajo y descanso.'}
            {activeView === 'bloqueador' && 'Bloquea distracciones para maximizar tu productividad.'}
          </p>
        </div>

        <div className="glass-panel">
          {activeView === 'horario' && (
            <Horario />
          )}

          {activeView === 'pomodoro' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Timer size={48} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
              <h3>El Temporizador Pomodoro se construirá aquí</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
                Configura tus tiempos de enfoque y descansos.
              </p>
              <button className="btn btn-primary">Iniciar Pomodoro</button>
            </div>
          )}

          {activeView === 'bloqueador' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ShieldBan size={48} color="var(--accent-color)" style={{ marginBottom: '16px' }} />
              <h3>El Bloqueador de Distracciones se construirá aquí</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '24px' }}>
                Gestiona tu lista negra de webs y aplicaciones (.exe).
              </p>
              <button className="btn btn-primary">Agregar Restricción</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default App;
