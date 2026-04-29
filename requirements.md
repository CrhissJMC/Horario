Requerimientos Funcionales \(RF\)

Estos son los comportamientos y acciones específicas que tu software permitirá hacer al usuario\.

Módulo 1: Gestión de Horario de Clases

RF\-01: El sistema debe permitir al usuario crear un horario semanal configurado exclusivamente de Lunes a Viernes\.

RF\-02: El sistema debe restringir la creación de bloques de estudio/clases únicamente dentro de la franja horaria de 07:00 AM a 12:00 PM\.

RF\-03: El sistema debe permitir nombrar cada bloque de clase \(ej\. "Matemáticas", "Programación"\)\.

RF\-04: El sistema debe permitir editar y eliminar bloques de clases ya creados\.

RF\-05: El sistema debe mostrar una vista semanal gráfica de los bloques de estudio programados\.

Módulo 2: Sistema de Alarmas Anticipadas

RF\-06: El sistema debe permitir asociar una alarma a cada bloque de clase programado en el horario\.

RF\-07: El sistema debe permitir al usuario configurar la anticipación de la alarma a intervalos específicos antes de la clase \(ej\. 5, 10, 15, 20 o 30 minutos\)\.

RF\-08: El sistema debe permitir al usuario cargar archivos de audio locales \(en formatos \.mp3 o \.wav\) para personalizar el tono de la alarma\.

RF\-09: El sistema debe ofrecer un botón de "Vista previa" o "Reproducir" para escuchar el tono de la alarma configurado\.

RF\-10: El sistema debe mostrar una notificación visual en pantalla \(pop\-up\) junto con el sonido de la alarma, indicando el nombre de la clase que está por comenzar\.

Módulo 3: Temporizador Pomodoro

RF\-11: El sistema debe incluir un cronómetro Pomodoro independiente del horario de clases\.

RF\-12: El sistema debe permitir al usuario personalizar la duración en minutos de los periodos de "Enfoque" \(ej\. 25 min, 50 min\)\.

RF\-13: El sistema debe permitir al usuario personalizar la duración en minutos de los periodos de "Descanso corto" y "Descanso largo"\.

RF\-14: El sistema debe permitir iniciar, pausar, reanudar y reiniciar el cronómetro Pomodoro\.

RF\-15: El sistema debe llevar un contador visible de los ciclos Pomodoro completados en el día\.

Módulo 4: Gestión y Bloqueo de Distracciones \(El Núcleo\)

RF\-16: El sistema debe permitir al usuario crear una "Lista Negra" \(Blacklist\) ingresando URLs de sitios web que desea bloquear \(ej\. facebook\.com, reddit\.com\)\.

RF\-17: El sistema debe permitir al usuario agregar a la Lista Negra procesos o archivos ejecutables de programas de escritorio \(ej\. valorant\.exe, discord\.exe\)\.

RF\-18: El sistema debe activar automáticamente el bloqueo de las URLs y programas de la Lista Negra cuando esté activo un bloque de clase del horario o un periodo de "Enfoque" del Pomodoro\.

RF\-19: El sistema debe cerrar forzosamente los programas de la Lista Negra si el usuario intenta abrirlos durante un periodo de estudio activo\.

RF\-20: El sistema debe permitir habilitar un "Modo Estricto" opcional, el cual impide al usuario apagar el bloqueador o cerrar la aplicación hasta que el bloque de estudio o Pomodoro haya terminado\.

Módulo 5: Personalización de Interfaz \(UI\)

RF\-21: El sistema debe permitir al usuario seleccionar colores personalizados para el fondo principal y los acentos \(botones, barras\) mediante un selector de color \(Color Picker\)\.

RF\-22: El sistema debe ofrecer, por defecto, un interruptor para alternar entre "Tema Claro" y "Tema Oscuro"\.

⚙️ Requerimientos No Funcionales \(RNF\)

Estas son las restricciones técnicas, métricas de rendimiento y atributos de calidad de tu aplicación\.

Rendimiento y Optimización

RNF\-01 \(Consumo de RAM\): La aplicación debe consumir menos de 1 GB de memoria RAM mientras se ejecuta en segundo plano\.

RNF\-02 \(Uso de CPU\): La monitorización de procesos \(para bloquear aplicaciones\) no debe exceder el 2% del uso total de la CPU para evitar ralentizar la PC\.

RNF\-03 \(Tiempo de respuesta\): El sistema debe detectar y cerrar una aplicación prohibida en menos de 1\.5 segundos desde que el usuario intenta abrirla\.

Persistencia y Fiabilidad

RNF\-04 \(Guardado de datos\): Todas las configuraciones de usuario \(horarios, alarmas, listas negras, colores\) deben guardarse en un archivo local \(ej\. formato JSON o SQLite\) y cargarse automáticamente al iniciar la app\.

RNF\-05 \(Precisión del tiempo\): Los cronómetros y alarmas deben calcular el tiempo basándose en el reloj del sistema \(System Time\) y no solo en conteos de bucle, para evitar desfases si la computadora se suspende y se vuelve a encender\.

Sistema y Seguridad

RNF\-06 \(Permisos del SO\): La aplicación debe solicitar permisos de Administrador en su instalación o ejecución si requiere modificar el archivo hosts \(para bloquear webs\) o cerrar procesos a nivel de sistema operativo\.

RNF\-07 \(Restauración segura\): Si el usuario cierra la aplicación abruptamente o la desinstala, el sistema debe restaurar la conectividad normal deshaciendo cualquier bloqueo de red \(ej\. limpiando el archivo hosts\)\.

RNF\-08 \(Ejecución en bandeja\): Al minimizar la ventana principal, la aplicación debe ocultarse de la barra de tareas y mantenerse activa en la bandeja del sistema \(System Tray\), mostrando su estado al pasar el ratón por encima\.

