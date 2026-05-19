# Sistema de Temas Dinámicos por Día de la Semana

## Descripción

Tu aplicación ahora cuenta con un sistema de temas automático que cambia los colores según el día de la semana. Cada día tiene una paleta de colores única diseñada siguiendo los principios de Material Design 3 Expressive.

## Paleta de Colores por Día

- **Lunes** 🟣 - Lila/Púrpura (Original)
- **Martes** 🔵 - Azul
- **Miércoles** 🟢 - Verde
- **Jueves** 🟠 - Naranja
- **Viernes** 🔴 - Rojo/Rosa
- **Sábado** 🌊 - Teal/Cian
- **Domingo** 💜 - Índigo

## Características

✨ **Cambio Automático**: El tema se aplica automáticamente al cargar la página y cambia cada medianoche.

🎨 **Material 3 Expressive**: Cada paleta sigue los principios de diseño Material 3 Expressive con colores vibrantes y expresivos.

🌐 **Indicador Visual**: En la esquina superior derecha del encabezado se muestra un badge con el emoji del día actual y el nombre del tema.

## Cómo Usar

### Visualización Normal
La aplicación cambiará automáticamente el tema cada día. No necesitas hacer nada especial.

### Testing - Ver Todos los Temas

Abre la consola del navegador (F12) y usa el comando:
```javascript
ThemeSystem.showAllThemes()
```

Esto listará todos los temas disponibles.

### Vista Previa de un Tema Específico

Para ver cómo se vería el tema de un día específico:
```javascript
ThemeSystem.previewDay(0)  // Ver tema de Lunes
ThemeSystem.previewDay(1)  // Ver tema de Martes
ThemeSystem.previewDay(2)  // Ver tema de Miércoles
// ... y así sucesivamente
```

Los números van del 0 (Lunes) al 6 (Domingo).

### Volver al Tema Actual

Después de una vista previa, vuelve al tema del día actual:
```javascript
ThemeSystem.resetToToday()
```

## Información Técnica

### Archivos Modificados

1. **css/styles.css**
   - Agregadas 7 paletas de colores con selectores `[data-theme="0"]` a `[data-theme="6"]`
   - Cada paleta redefine las variables CSS personalizadas

2. **js/themes.js** (Nuevo)
   - Sistema completo de gestión de temas
   - Funciones para detectar el día, aplicar temas y hacer testing

3. **js/app.js**
   - Inicialización del sistema de temas en el evento DOMContentLoaded

4. **index.html**
   - Inclusión del script themes.js
   - Agregado badge visual del tema actual

### Variables CSS Modificadas

Cada tema personaliza estas variables:
- `--bg`: Color de fondo principal
- `--surface`: Color de superficie
- `--surface2`: Color de superficie secundaria (botones)
- `--onsurface2`: Color del texto sobre surface2
- `--text`: Color del texto principal
- `--muted`: Color de texto atenuado
- `--faint`: Color de texto muy atenuado
- `--accent`: Color de acento principal
- `--accent-dim`: Color de acento más suave

## Personalización

Si deseas cambiar los colores de cualquier día, edita el archivo `css/styles.css` en las secciones de tema correspondientes (líneas 33-137).

## Soporte

Si encuentras algún problema o deseas agregar más días/temas, no dudes en contactar al equipo de desarrollo.
