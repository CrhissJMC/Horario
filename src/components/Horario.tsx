import { useState, useEffect, Fragment } from 'react';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import './Horario.css';

interface StudyBlock {
  id: string;
  day: number; // 0: Lunes, 1: Martes, 2: Miércoles, 3: Jueves, 4: Viernes
  startHour: string; // Formato HH:MM, ej "07:00"
  endHour: string;   // Formato HH:MM, ej "09:00"
  title: string;
  color: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
// Según requerimiento de 07:00 AM a 12:00 PM (Asumiremos hasta el mediodía, o podemos listar más)
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Horario() {
  const [blocks, setBlocks] = useState<StudyBlock[]>(() => {
    const saved = localStorage.getItem('horario_blocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Reloj para línea de tiempo
  const [currentTime, setCurrentTime] = useState(new Date());

  // Formulario
  const [title, setTitle] = useState('');
  const [day, setDay] = useState<number>(0);
  const [startHour, setStartHour] = useState('07:00');
  const [endHour, setEndHour] = useState('08:00');
  const [color, setColor] = useState(COLORS[0]);

  // Actualizar el reloj cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Guardar cada vez que cambia
  useEffect(() => {
    localStorage.setItem('horario_blocks', JSON.stringify(blocks));
  }, [blocks]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-completar color si el curso ya existe (case-insensitive)
    if (newTitle.trim().length > 0) {
      const existingBlock = blocks.find(b => b.title.toLowerCase() === newTitle.toLowerCase().trim());
      if (existingBlock) {
        setColor(existingBlock.color);
      }
    }
  };

  // Obtener cursos únicos para las sugerencias
  const uniqueCourses = Array.from(new Set(blocks.map(b => b.title)));

  const openModal = (block?: StudyBlock) => {
    if (block) {
      setEditingId(block.id);
      setTitle(block.title);
      setDay(block.day);
      setStartHour(block.startHour);
      setEndHour(block.endHour);
      setColor(block.color);
    } else {
      setEditingId(null);
      setTitle('');
      setDay(0);
      setStartHour('07:00');
      setEndHour('08:00');
      setColor(COLORS[0]);
    }
    setIsModalOpen(true);
  };

  const saveBlock = () => {
    if (!title) return alert("Por favor ingresa un título");
    if (startHour >= endHour) return alert("La hora de inicio debe ser menor a la hora de fin");

    if (editingId) {
      setBlocks(blocks.map(b => b.id === editingId ? { id: b.id, day, startHour, endHour, title, color } : b));
    } else {
      const newBlock: StudyBlock = {
        id: Date.now().toString(),
        day, startHour, endHour, title, color
      };
      setBlocks([...blocks, newBlock]);
    }
    setIsModalOpen(false);
  };

  const deleteBlock = (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este bloque?")) {
      setBlocks(blocks.filter(b => b.id !== id));
      setIsModalOpen(false);
    }
  };

  const getMinutesFromTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getBlockStyle = (start: string, end: string) => {
    const startMins = getMinutesFromTime(start);
    const endMins = getMinutesFromTime(end);
    const baseMins = 7 * 60; // 07:00 AM es el inicio (top 0 de la fila 2)

    const topOffset = startMins - baseMins;
    const duration = endMins - startMins;

    return {
      top: `${topOffset}px`,
      height: `${duration}px`,
      width: 'calc(100% - 8px)', // Un pequeño margen
    };
  };

  // Cálculos para el tiempo actual
  const currentDayIdx = currentTime.getDay() === 0 ? 6 : currentTime.getDay() - 1; // 0 Lunes ... 6 Domingo
  const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
  const isTimeVisible = currentTime.getHours() >= 7 && currentTime.getHours() <= 22;
  const currentLineTop = (currentMins - (7 * 60)) + 60; // +60px por el header (fila 1)

  const isBlockActive = (block: StudyBlock) => {
    if (block.day !== currentDayIdx) return false;
    const startMins = getMinutesFromTime(block.startHour);
    const endMins = getMinutesFromTime(block.endHour);
    return currentMins >= startMins && currentMins < endMins;
  };

  return (
    <div className="horario-container">
      <div className="horario-header">
        <h2>Mi Semana de Estudio</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Nuevo Bloque
        </button>
      </div>

      <div className="calendar-grid">
        {/* Esquina vacía */}
        <div className="time-header-cell empty-corner"></div>
        
        {/* Encabezado de Días */}
        {DAYS.map(d => (
          <div key={d} className="day-header-cell">{d}</div>
        ))}

        {/* Celdas de Hora y Rejilla */}
        {HOURS.map((hour, idx) => (
          <Fragment key={hour}>
            <div className="time-label" style={{ gridRow: idx + 2, gridColumn: 1 }}>{hour}</div>
            <div className="grid-lines" style={{ gridRow: idx + 2, gridColumn: '2 / -1' }}></div>
          </Fragment>
        ))}

        {/* Columnas de los Días para Posicionar Bloques */}
        {DAYS.map((_, dayIdx) => (
          <div key={`col-${dayIdx}`} className="day-column" style={{ gridColumn: dayIdx + 2, gridRow: `2 / ${HOURS.length + 2}` }}>
            {blocks.filter(b => b.day === dayIdx).map(block => (
              <div 
                key={block.id} 
                className={`study-block ${isBlockActive(block) ? 'active' : ''}`}
                style={{ 
                  ...getBlockStyle(block.startHour, block.endHour),
                  backgroundColor: block.color + (isBlockActive(block) ? 'FF' : 'E6'),
                  borderLeft: `4px solid ${block.color}`
                }}
                onClick={() => openModal(block)}
              >
                <div className="block-title">{block.title}</div>
                <div className="block-time">{block.startHour} - {block.endHour}</div>
              </div>
            ))}
          </div>
        ))}

        {/* Línea indicadora de la hora actual */}
        {isTimeVisible && (
          <div className="current-time-line" style={{ top: `${currentLineTop}px` }}></div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Bloque' : 'Nuevo Bloque de Estudio'}</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="form-group">
              <label>Título de la Clase/Estudio</label>
              <input 
                type="text" 
                value={title} 
                onChange={handleTitleChange} 
                placeholder="Ej. Matemáticas" 
                list="course-options"
                autoComplete="off"
              />
              <datalist id="course-options">
                {uniqueCourses.map((course, idx) => (
                  <option key={idx} value={course} />
                ))}
              </datalist>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Día</label>
                <select value={day} onChange={e => setDay(Number(e.target.value))}>
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hora Inicio</label>
                <input 
                  type="time" 
                  value={startHour} 
                  min="07:00" max="22:00"
                  onChange={e => setStartHour(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Hora Fin</label>
                <input 
                  type="time" 
                  value={endHour} 
                  min="07:00" max="22:00"
                  onChange={e => setEndHour(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <div 
                    key={c} 
                    className={`color-circle ${color === c ? 'selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                {/* Selector de color personalizado */}
                <div style={{ marginLeft: 'auto' }}>
                  <input 
                    type="color" 
                    className="color-input-custom"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    title="Color Personalizado"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              {editingId && (
                <button className="btn btn-danger" onClick={() => deleteBlock(editingId)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveBlock}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
