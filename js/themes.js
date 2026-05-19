/**
 * Sistema de Temas Dinámicos por Día de la Semana
 * Material 3 Expressive Design
 */

const THEME_CONFIG = {
  0: { name: 'Lunes', color: 'Lila/Púrpura', emoji: '🟣' },
  1: { name: 'Martes', color: 'Azul', emoji: '🔵' },
  2: { name: 'Miércoles', color: 'Verde', emoji: '🟢' },
  3: { name: 'Jueves', color: 'Naranja', emoji: '🟠' },
  4: { name: 'Viernes', color: 'Rojo/Rosa', emoji: '🔴' },
  5: { name: 'Sábado', color: 'Teal/Cian', emoji: '🌊' },
  6: { name: 'Domingo', color: 'Índigo', emoji: '💜' }
};

/**
 * Obtiene el índice del día de la semana (0 = Lunes, 6 = Domingo)
 */
function getDayIndex() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  // Convertir: 0 (domingo) -> 6, 1 (lunes) -> 0, ..., 6 (sábado) -> 5
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
}

/**
 * Aplica el tema al documento basado en el día actual
 */
function applyTheme() {
  const dayIndex = getDayIndex();
  const root = document.documentElement;
  
  // Aplicar el atributo data-theme al root
  root.setAttribute('data-theme', dayIndex.toString());
  
  // Actualizar el badge visual
  const badge = document.getElementById('theme-badge');
  const themeInfo = THEME_CONFIG[dayIndex];
  if (badge) {
    badge.textContent = themeInfo.emoji;
    badge.setAttribute('title', `${themeInfo.name} - ${themeInfo.color}`);
  }
  
  // Log del tema aplicado
  console.log(
    `%c🎨 Tema aplicado: ${themeInfo.name} - ${themeInfo.color} ${themeInfo.emoji}`,
    'color: #6750a4; font-weight: bold; font-size: 14px;'
  );
  
  return dayIndex;
}

/**
 * Obtiene información del tema actual
 */
function getCurrentThemeInfo() {
  const dayIndex = getDayIndex();
  return {
    dayIndex,
    ...THEME_CONFIG[dayIndex],
    dayName: THEME_CONFIG[dayIndex].name,
    colorName: THEME_CONFIG[dayIndex].color
  };
}

/**
 * Cambia el tema manualmente (útil para testing)
 */
function setThemeManually(dayIndex) {
  if (dayIndex < 0 || dayIndex > 6) {
    console.error('El índice del día debe estar entre 0 y 6');
    return;
  }
  const root = document.documentElement;
  root.setAttribute('data-theme', dayIndex.toString());
  console.log(`Tema cambiado manualmente a: ${THEME_CONFIG[dayIndex].name}`);
}

/**
 * Inicializa el sistema de temas cuando el documento está listo
 */
function initThemeSystem() {
  // Aplicar tema al cargar
  applyTheme();
  
  // Opcional: Reaplica el tema cada medianoche
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const timeUntilMidnight = tomorrow - now;
  
  setTimeout(() => {
    applyTheme();
    // Reaplica cada 24 horas
    setInterval(applyTheme, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
}

// Exportar para uso global
window.ThemeSystem = {
  getDayIndex,
  applyTheme,
  getCurrentThemeInfo,
  setThemeManually,
  initThemeSystem,
  THEME_CONFIG,
  
  // Funciones de testing
  previewDay(dayIndex) {
    if (dayIndex < 0 || dayIndex > 6) {
      console.error('El índice del día debe estar entre 0 y 6');
      return;
    }
    setThemeManually(dayIndex);
    console.log(`%c✅ Vista previa activada: ${THEME_CONFIG[dayIndex].name}`, 'color: green; font-weight: bold;');
  },
  
  resetToToday() {
    applyTheme();
    console.log('✅ Tema vuelto al día actual');
  },
  
  showAllThemes() {
    console.log('%c🎨 Temas disponibles:', 'color: #6750a4; font-weight: bold; font-size: 14px;');
    Object.entries(THEME_CONFIG).forEach(([index, theme]) => {
      console.log(`  ${theme.emoji} ${theme.name} (${index}): ${theme.color}`);
    });
    console.log('%cUsa: ThemeSystem.previewDay(0-6) para cambiar el tema', 'color: gray;');
    console.log('%cUsa: ThemeSystem.resetToToday() para volver al tema actual', 'color: gray;');
  }
};
