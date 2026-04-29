import { useState, useEffect, useRef, Fragment } from 'react';
import { Plus, X, Edit2, Trash2, BellRing, BellOff, Upload, Play, Square } from 'lucide-react';
import AlarmNotification from './AlarmNotification';
import './Horario.css';

const DEFAULT_ALARM_SOUND = '/tuturu_1.mp3';

interface AlarmConfig {
  enabled: boolean;
  minutesBefore: number; // 5, 10, 15, 20
  soundPath: string | null; // path to custom audio, null = default
  soundName: string | null; // name of the uploaded file
}

interface StudyBlock {
  id: string;
  day: number; // 0: Lunes, 1: Martes, 2: Miércoles, 3: Jueves, 4: Viernes
  startHour: string; // Formato HH:MM, ej "07:00"
  endHour: string;   // Formato HH:MM, ej "09:00"
  title: string;
  color: string;
  alarm: AlarmConfig;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
// Según requerimiento de 07:00 AM a 12:00 PM (Asumiremos hasta el mediodía, o podemos listar más)
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const ALARM_INTERVALS = [5, 10, 15, 20];

export default function Horario() {
  const [blocks, setBlocks] = useState<StudyBlock[]>(() => {
    const saved = localStorage.getItem('horario_blocks');
    if (saved) {
      // Migrate old blocks that don't have alarm config
      const parsed: StudyBlock[] = JSON.parse(saved);
      return parsed.map(b => ({
        ...b,
        alarm: b.alarm || { enabled: false, minutesBefore: 10, soundPath: null, soundName: null }
      }));
    }
    return [];
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

  // Alarm form state
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmMinutes, setAlarmMinutes] = useState(10);
  const [alarmSoundPath, setAlarmSoundPath] = useState<string | null>(null);
  const [alarmSoundName, setAlarmSoundName] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewCtxRef = useRef<AudioContext | null>(null);

  // Active alarm notification state
  const [activeAlarm, setActiveAlarm] = useState<{
    blockTitle: string;
    minutesUntilStart: number;
    blockStartTime: string;
    soundPath: string | null;
  } | null>(null);

  // Track which alarms have been fired today to prevent re-triggering
  const firedAlarmsRef = useRef<Set<string>>(new Set());

  // Consecutive block detection
  const isConsecutiveBlock = (block: StudyBlock): boolean => {
    // Check if there's a block on the same day that ends exactly when this one starts
    return blocks.some(other =>
      other.id !== block.id &&
      other.day === block.day &&
      other.endHour === block.startHour
    );
  };

  // Check if alarm can be configured for a block (not consecutive)
  const canHaveAlarm = (dayVal: number, startHourVal: string, blockId?: string): boolean => {
    return !blocks.some(other =>
      (blockId ? other.id !== blockId : true) &&
      other.day === dayVal &&
      other.endHour === startHourVal
    );
  };

  // Actualizar el reloj cada 15 segundos para better alarm precision
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Reset fired alarms at midnight
  useEffect(() => {
    const checkMidnight = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        firedAlarmsRef.current.clear();
      }
    }, 60000);
    return () => clearInterval(checkMidnight);
  }, []);

  // Alarm checking logic
  useEffect(() => {
    const now = currentTime;
    const currentDayOfWeek = now.getDay(); // 0=Sunday, 1=Monday...
    const todayIdx = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Convert to 0=Monday

    // Only check Mon-Fri
    if (todayIdx > 4) return;

    const nowMins = now.getHours() * 60 + now.getMinutes();

    for (const block of blocks) {
      if (!block.alarm.enabled || block.day !== todayIdx) continue;

      const blockStartMins = getMinutesFromTime(block.startHour);
      const alarmTriggerMins = blockStartMins - block.alarm.minutesBefore;
      const alarmKey = `${block.id}-${now.toDateString()}`;

      // Check if alarm should fire (within a 1-minute window)
      if (nowMins >= alarmTriggerMins && nowMins < alarmTriggerMins + 2 && !firedAlarmsRef.current.has(alarmKey)) {
        firedAlarmsRef.current.add(alarmKey);
        const minutesLeft = blockStartMins - nowMins;
        setActiveAlarm({
          blockTitle: block.title,
          minutesUntilStart: minutesLeft,
          blockStartTime: block.startHour,
          soundPath: block.alarm.soundPath,
        });
        break; // Only show one alarm at a time
      }
    }
  }, [currentTime, blocks]);

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
    // Stop any preview audio
    stopPreview();

    if (block) {
      setEditingId(block.id);
      setTitle(block.title);
      setDay(block.day);
      setStartHour(block.startHour);
      setEndHour(block.endHour);
      setColor(block.color);
      setAlarmEnabled(block.alarm.enabled);
      setAlarmMinutes(block.alarm.minutesBefore);
      setAlarmSoundPath(block.alarm.soundPath);
      setAlarmSoundName(block.alarm.soundName);
    } else {
      setEditingId(null);
      setTitle('');
      setDay(0);
      setStartHour('07:00');
      setEndHour('08:00');
      setColor(COLORS[0]);
      setAlarmEnabled(false);
      setAlarmMinutes(10);
      setAlarmSoundPath(null);
      setAlarmSoundName(null);
    }
    setIsModalOpen(true);
  };

  const saveBlock = () => {
    if (!title) return alert("Por favor ingresa un título");
    if (startHour >= endHour) return alert("La hora de inicio debe ser menor a la hora de fin");

    // If alarm enabled but block is consecutive, disable alarm silently
    const blockCanHaveAlarm = canHaveAlarm(day, startHour, editingId ?? undefined);
    const finalAlarmEnabled = alarmEnabled && blockCanHaveAlarm;

    const alarmConfig: AlarmConfig = {
      enabled: finalAlarmEnabled,
      minutesBefore: alarmMinutes,
      soundPath: alarmSoundPath,
      soundName: alarmSoundName,
    };

    if (editingId) {
      setBlocks(blocks.map(b => b.id === editingId ? { id: b.id, day, startHour, endHour, title, color, alarm: alarmConfig } : b));
    } else {
      const newBlock: StudyBlock = {
        id: Date.now().toString(),
        day, startHour, endHour, title, color,
        alarm: alarmConfig,
      };
      setBlocks([...blocks, newBlock]);
    }
    stopPreview();
    setIsModalOpen(false);
  };

  const deleteBlock = (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este bloque?")) {
      setBlocks(blocks.filter(b => b.id !== id));
      stopPreview();
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

  // Audio file upload handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
      alert('Solo se permiten archivos .mp3 o .wav');
      return;
    }

    // Create object URL for the audio file
    const url = URL.createObjectURL(file);
    setAlarmSoundPath(url);
    setAlarmSoundName(file.name);
  };

  // Preview alarm sound — uses custom file or tuturu_1.mp3 by default
  const playPreview = () => {
    stopPreview();
    const src = alarmSoundPath ?? DEFAULT_ALARM_SOUND;
    const audio = new Audio(src);
    previewAudioRef.current = audio;
    audio.play().catch(() => {});
    audio.addEventListener('ended', () => setIsPreviewPlaying(false));
    setIsPreviewPlaying(true);
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);
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

  // Check if alarm is possible with current form values
  const currentCanHaveAlarm = canHaveAlarm(day, startHour, editingId ?? undefined);

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
                <div className="block-title-row">
                  <span className="block-title">{block.title}</span>
                  {block.alarm.enabled && (
                    <BellRing size={12} className="block-alarm-icon" />
                  )}
                </div>
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
              <button className="icon-btn" onClick={() => { stopPreview(); setIsModalOpen(false); }}><X size={20} /></button>
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

            {/* ======================== */}
            {/* ALARM CONFIGURATION      */}
            {/* ======================== */}
            <div className="alarm-config-section">
              <div className="alarm-config-header">
                <div className="alarm-config-left">
                  <BellRing size={18} className="alarm-config-icon" />
                  <span className="alarm-config-label">Alarma Anticipada</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={alarmEnabled} 
                    onChange={e => setAlarmEnabled(e.target.checked)}
                    disabled={!currentCanHaveAlarm}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {!currentCanHaveAlarm && (
                <div className="alarm-warning">
                  <BellOff size={14} />
                  <span>No disponible: este bloque es consecutivo a otro (no hay tiempo entre ellos para la alarma).</span>
                </div>
              )}

              {alarmEnabled && currentCanHaveAlarm && (
                <div className="alarm-config-body">
                  {/* Minutes selector */}
                  <div className="form-group">
                    <label>Anticipación (minutos antes)</label>
                    <div className="alarm-minutes-selector">
                      {ALARM_INTERVALS.map(mins => (
                        <button
                          key={mins}
                          type="button"
                          className={`alarm-min-btn ${alarmMinutes === mins ? 'active' : ''}`}
                          onClick={() => setAlarmMinutes(mins)}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Audio file upload */}
                  <div className="form-group">
                    <label>Tono de Alarma</label>
                    <div className="alarm-sound-row">
                      <label className="alarm-upload-btn" htmlFor="alarm-audio-upload">
                        <Upload size={14} />
                        {alarmSoundName ? alarmSoundName : 'Subir audio (.mp3, .wav)'}
                      </label>
                      <input
                        id="alarm-audio-upload"
                        type="file"
                        accept=".mp3,.wav,audio/mpeg,audio/wav"
                        onChange={handleAudioUpload}
                        style={{ display: 'none' }}
                      />
                      
                      {/* Preview / Stop button */}
                      <button
                        type="button"
                        className={`alarm-preview-btn ${isPreviewPlaying ? 'playing' : ''}`}
                        onClick={isPreviewPlaying ? stopPreview : playPreview}
                        title={isPreviewPlaying ? 'Detener' : 'Vista previa'}
                      >
                        {isPreviewPlaying ? <Square size={14} /> : <Play size={14} />}
                      </button>

                      {/* Clear custom sound */}
                      {alarmSoundPath && (
                        <button
                          type="button"
                          className="alarm-clear-btn"
                          onClick={() => { setAlarmSoundPath(null); setAlarmSoundName(null); stopPreview(); }}
                          title="Usar tono predeterminado"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {!alarmSoundPath && (
                      <span className="alarm-sound-hint">Tono predeterminado activo</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {editingId && (
                <button className="btn btn-danger" onClick={() => deleteBlock(editingId)}>
                  <Trash2 size={16} /> Eliminar
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-secondary" onClick={() => { stopPreview(); setIsModalOpen(false); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveBlock}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Alarm Notification Popup */}
      {activeAlarm && (
        <AlarmNotification
          blockTitle={activeAlarm.blockTitle}
          minutesUntilStart={activeAlarm.minutesUntilStart}
          blockStartTime={activeAlarm.blockStartTime}
          alarmSoundPath={activeAlarm.soundPath}
          onDismiss={() => setActiveAlarm(null)}
        />
      )}
    </div>
  );
}
