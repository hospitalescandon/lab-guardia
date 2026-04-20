/**
 * Sistema de Entrega de Guardia - Laboratorio HE
 * Archivo JavaScript modular
 */

// ==================== ESTADO GLOBAL ====================
let turno = '';
const statusMap = {
  op: { l: 'Operativo', c: 'p-op' },
  fa: { l: 'Con falla', c: 'p-fa' },
  ma: { l: 'Mantenimiento', c: 'p-ma' },
  ap: { l: 'Apagado', c: 'p-ap' }
};

// Clave para localStorage
const STORAGE_KEY = 'guardia_draft';

// ==================== DATOS ====================
const equipos = [
  { n: 'Vitros 5600', cat: 'Química Clínica', status: 'op' },
  { n: 'Beckman DxH 500', cat: 'Hematología', status: 'op' },
  { n: 'ACL Top 350', cat: 'Coagulación', status: 'op' },
  { n: 'Vidas', cat: 'Inmunología', status: 'op' },
  { n: 'Cliniteck Status', cat: 'Urianálisis', status: 'op' },
  { n: 'Vitek', cat: 'Microbiología', status: 'op' },
  { n: 'BactAlert', cat: 'Microbiología', status: 'op' },
  { n: 'Film Array', cat: 'Microbiología', status: 'op' },
  { n: 'RAMP', cat: 'Pruebas rápidas', status: 'op' },
  { n: 'iStat', cat: 'Q.C. / POC', status: 'op' },
  { n: 'Epoc', cat: 'Q.C. / POC', status: 'op' }
];

const areas = [
  { n: 'Química (Vitros 5600)', ctrl: null, calib: null, obs: '' },
  { n: 'Hematología (DxH 500)', ctrl: null, calib: null, obs: '' },
  { n: 'Coagulación (ACL Top 350)', ctrl: null, calib: null, obs: '' },
  { n: 'Inmunología (Vidas)', ctrl: null, calib: null, obs: '' },
  { n: 'Urianálisis (Cliniteck)', ctrl: null, calib: null, obs: '' }
];

const pruebasRapidas = [
  { n: 'HIV', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Embarazo (PIE)', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Drogas', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Clostridium toxina A y B', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Sangre oculta en heces', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Influenza A/B + COVID', usado: 0, fallo: false, falto: false, acabo: false },
  { n: 'Influenza A/B + COVID + RSV', usado: 0, fallo: false, falto: false, acabo: false }
];

const cartuchos = {
  istat: 0,
  epoc: 0,
  filmarray: { Respiratorio: 0, Gastrointestinal: 0, 'Neumonía': 0, Hemocultivos: 0, 'Inf. rodilla': 0, Meningitis: 0 },
  ramp: { Troponina: 0, Mioglobina: 0, 'Dímero D': 0, 'NT-pro BNP': 0, 'Procalcitonina': 0 }
};

let reactivos = [];
let maquila = [];
let cultivos = [];
let placas = [];
const tasks = { real: [], pend: [], inc: [] };

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
  loadDraft(); // Cargar borrador guardado
  setupAutoSave(); // Configurar guardado automático
  renderAll();
});

// ==================== LOCALSTORAGE - GUARDADO AUTOMÁTICO ====================
function setupAutoSave() {
  // Campos de texto simples
  const textFields = ['g-sale', 'g-entra', 'fecha', 'obs'];
  textFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', saveDraft);
  });
}

function saveDraft() {
  const draft = {
    turno,
    fecha: document.getElementById('fecha').value,
    sale: document.getElementById('g-sale').value,
    entra: document.getElementById('g-entra').value,
    obs: document.getElementById('obs').value,
    equipos: JSON.parse(JSON.stringify(equipos)),
    areas: JSON.parse(JSON.stringify(areas)),
    pruebasRapidas: JSON.parse(JSON.stringify(pruebasRapidas)),
    cartuchos: JSON.parse(JSON.stringify(cartuchos)),
    reactivos: JSON.parse(JSON.stringify(reactivos)),
    maquila: JSON.parse(JSON.stringify(maquila)),
    cultivos: JSON.parse(JSON.stringify(cultivos)),
    placas: JSON.parse(JSON.stringify(placas)),
    tasks: JSON.parse(JSON.stringify(tasks)),
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (e) { console.error('Error guardando borrador:', e); }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    
    // Restaurar campos simples
    if (d.fecha) document.getElementById('fecha').value = d.fecha;
    if (d.sale) document.getElementById('g-sale').value = d.sale;
    if (d.entra) document.getElementById('g-entra').value = d.entra;
    if (d.obs) document.getElementById('obs').value = d.obs;
    if (d.turno) {
      turno = d.turno;
      document.querySelectorAll('.tb').forEach(b => {
        b.classList.remove('active');
        if ((turno === 'Manana' && b.classList.contains('m')) ||
            (turno === 'Tarde' && b.classList.contains('t')) ||
            (turno === 'Noche' && b.classList.contains('n'))) {
          b.classList.add('active');
        }
      });
    }
    
    // Restaurar datos complejos
    if (d.equipos) d.equipos.forEach((e, i) => { if (equipos[i]) equipos[i].status = e.status; });
    if (d.areas) d.areas.forEach((a, i) => { if (areas[i]) { areas[i].ctrl = a.ctrl; areas[i].calib = a.calib; areas[i].obs = a.obs; } });
    if (d.pruebasRapidas) d.pruebasRapidas.forEach((p, i) => { if (pruebasRapidas[i]) { pruebasRapidas[i].usado = p.usado; pruebasRapidas[i].fallo = p.fallo; pruebasRapidas[i].falto = p.falto; pruebasRapidas[i].acabo = p.acabo; } });
    if (d.cartuchos) Object.assign(cartuchos, d.cartuchos);
    if (d.reactivos) reactivos = d.reactivos;
    if (d.maquila) maquila = d.maquila;
    if (d.cultivos) cultivos = d.cultivos;
    if (d.placas) placas = d.placas;
    if (d.tasks) Object.assign(tasks, d.tasks);
    
    showToast('Borrador recuperado', false);
  } catch (e) { console.error('Error cargando borrador:', e); }
}

function clearAllData() {
  if (!confirm('¿Estás seguro de que quieres borrar todos los datos?\n\nEsta acción no se puede deshacer.')) return;
  
  // Limpiar campos de texto
  document.getElementById('g-sale').value = '';
  document.getElementById('g-entra').value = '';
  document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('obs').value = '';
  
  // Resetear turno
  turno = '';
  document.querySelectorAll('.tb').forEach(b => b.classList.remove('active'));
  
  // Resetear equipos
  equipos.forEach(e => e.status = 'op');
  
  // Resetear áreas
  areas.forEach(a => { a.ctrl = null; a.calib = null; a.obs = ''; });
  
  // Resetear pruebas rápidas
  pruebasRapidas.forEach(p => { p.usado = 0; p.fallo = false; p.falto = false; p.acabo = false; });
  
  // Resetear cartuchos
  cartuchos.istat = 0;
  cartuchos.epoc = 0;
  Object.keys(cartuchos.filmarray).forEach(k => cartuchos.filmarray[k] = 0);
  Object.keys(cartuchos.ramp).forEach(k => cartuchos.ramp[k] = 0);
  
  // Limpiar arrays
  reactivos = [];
  maquila = [];
  cultivos = [];
  placas = [];
  tasks.real = [];
  tasks.pend = [];
  tasks.inc = [];
  
  // Eliminar borrador de localStorage
  localStorage.removeItem(STORAGE_KEY);
  
  // Re-renderizar todo
  renderAll();
  
  // Ocultar panel de errores
  document.getElementById('validation-errors').classList.remove('show');
  
  // Ocultar resumen
  document.getElementById('resumen-box').classList.remove('show');
  
  showToast('Todos los datos han sido borrados');
}

function renderAll() {
  renderEquipos();
  renderAreas();
  renderPR();
  renderCartuchos();
  renderReactivos();
  renderMaquila();
  renderCultivos();
  renderPlacas();
  renderTasks('real');
  renderTasks('pend');
  renderTasks('inc');
}

// ==================== VALIDACIÓN ====================
function validateForm() {
  const errors = [];
  let hasErrors = false;

  // Limpiar errores previos
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.error-msg.show').forEach(el => el.classList.remove('show'));

  // Validar fecha
  const fecha = document.getElementById('fecha');
  if (!fecha.value) {
    errors.push('La fecha es obligatoria');
    fecha.classList.add('error');
    hasErrors = true;
  }

  // Validar turno
  if (!turno) {
    errors.push('Debes seleccionar un turno');
    document.querySelectorAll('.tb').forEach(b => b.classList.add('error'));
    hasErrors = true;
  }

  // Validar guardia saliente
  const sale = document.getElementById('g-sale');
  if (!sale.value.trim()) {
    errors.push('El nombre de la guardia saliente es obligatorio');
    sale.classList.add('error');
    hasErrors = true;
  }

  // Validar guardia entrante
  const entra = document.getElementById('g-entra');
  if (!entra.value.trim()) {
    errors.push('El nombre de la guardia entrante es obligatorio');
    entra.classList.add('error');
    hasErrors = true;
  }

  // Mostrar errores si existen
  const errorPanel = document.getElementById('validation-errors');
  const errorList = document.getElementById('error-list');
  
  if (hasErrors) {
    errorList.innerHTML = errors.map(e => `<li>${e}</li>`).join('');
    errorPanel.classList.add('show');
    errorPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('⚠ Por favor completa todos los campos obligatorios', true);
    return false;
  } else {
    errorPanel.classList.remove('show');
    return true;
  }
}

// ==================== FUNCIONES DE UI ====================
function setTurno(t, el) {
  turno = t;
  document.querySelectorAll('.tb').forEach(b => {
    b.classList.remove('active', 'error');
  });
  el.classList.add('active');
  saveDraft();
}

function toggleForm(id) {
  const f = document.getElementById(id);
  const open = f.classList.toggle('show');
  if (open) {
    const i = f.querySelector('input');
    if (i) i.focus();
  }
}

function switchView(v, el) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('view-form').style.display = v === 'form' ? 'block' : 'none';
  document.getElementById('view-history').style.display = v === 'history' ? 'block' : 'none';
  if (v === 'history') loadHistory();
}

// ==================== EQUIPOS ====================
function renderEquipos() {
  document.getElementById('eq-body').innerHTML = equipos.map((e, i) => {
    const s = statusMap[e.status];
    return `<tr>
      <td class="eq-name">${e.n}</td>
      <td class="eq-cat">${e.cat}</td>
      <td><select class="stat-sel" onchange="equipos[${i}].status=this.value;renderEquipos()">
        <option value="op"${e.status === 'op' ? ' selected' : ''}>Operativo</option>
        <option value="fa"${e.status === 'fa' ? ' selected' : ''}>Con falla</option>
        <option value="ma"${e.status === 'ma' ? ' selected' : ''}>Mantenimiento</option>
        <option value="ap"${e.status === 'ap' ? ' selected' : ''}>Apagado</option>
      </select></td>
      <td><span class="pill ${s.c}">${s.l}</span></td>
    </tr>`;
  }).join('');
  saveDraft();
}

// ==================== CONTROLES ====================
function renderAreas() {
  document.getElementById('area-body').innerHTML = areas.map((a, i) => `
    <tr>
      <td style="font-weight:600">${a.n}</td>
      <td><div class="tgl-grp">
        <button class="tgl yes${a.ctrl === true ? ' active' : ''}" onclick="areas[${i}].ctrl=true;renderAreas()">Sí</button>
        <button class="tgl no${a.ctrl === false ? ' active' : ''}" onclick="areas[${i}].ctrl=false;renderAreas()">No</button>
      </div></td>
      <td><div class="tgl-grp">
        <button class="tgl yes${a.calib === true ? ' active' : ''}" onclick="areas[${i}].calib=true;renderAreas()">Sí</button>
        <button class="tgl no${a.calib === false ? ' active' : ''}" onclick="areas[${i}].calib=false;renderAreas()">No</button>
      </div></td>
      <td><input class="ti" type="text" placeholder="Observación..." value="${a.obs}" oninput="areas[${i}].obs=this.value;saveDraft()"></td>
    </tr>`).join('');
  saveDraft();
}

// ==================== PRUEBAS RÁPIDAS ====================
function renderPR() {
  document.getElementById('pr-grid').innerHTML = pruebasRapidas.map((p, i) => `
    <div class="pr-card">
      <div class="pr-name">${p.n}</div>
      <div class="pr-row"><span class="pr-lbl">Usadas</span>
        <div class="cnt">
          <button onclick="pruebasRapidas[${i}].usado=Math.max(0,pruebasRapidas[${i}].usado-1);renderPR()">−</button>
          <span>${p.usado}</span>
          <button onclick="pruebasRapidas[${i}].usado++;renderPR()">+</button>
        </div>
      </div>
      <div class="pr-issues">
        <button class="iss fallo${p.fallo ? ' active' : ''}" onclick="pruebasRapidas[${i}].fallo=!pruebasRapidas[${i}].fallo;renderPR()">falló</button>
        <button class="iss falto${p.falto ? ' active' : ''}" onclick="pruebasRapidas[${i}].falto=!pruebasRapidas[${i}].falto;renderPR()">faltó</button>
        <button class="iss acabo${p.acabo ? ' active' : ''}" onclick="pruebasRapidas[${i}].acabo=!pruebasRapidas[${i}].acabo;renderPR()">se acabó</button>
      </div>
    </div>`).join('');
  saveDraft();
}

// ==================== CARTUCHOS ====================
function crtRow(label, val, dec, inc) {
  return `<div class="crt-item"><span class="crt-name">${label}</span>
    <div class="cnt"><button onclick="${dec}">−</button><span>${val}</span><button onclick="${inc}">+</button></div>
  </div>`;
}

function renderCartuchos() {
  const c = cartuchos;
  let h = '';
  h += `<div class="crt-section-title">Gasometrías</div><div class="crt-grid" style="margin-bottom:1rem">`;
  h += crtRow('iStat', c.istat, 'cartuchos.istat=Math.max(0,cartuchos.istat-1);renderCartuchos()', 'cartuchos.istat++;renderCartuchos()');
  h += crtRow('Epoc', c.epoc, 'cartuchos.epoc=Math.max(0,cartuchos.epoc-1);renderCartuchos()', 'cartuchos.epoc++;renderCartuchos()');
  h += `</div><div class="crt-section-title">Film Array — paneles</div><div class="crt-grid" style="margin-bottom:1rem">`;
  Object.keys(c.filmarray).forEach(k => {
    h += crtRow(k, c.filmarray[k], `cartuchos.filmarray['${k}']=Math.max(0,cartuchos.filmarray['${k}']-1);renderCartuchos()`, `cartuchos.filmarray['${k}']++;renderCartuchos()`);
  });
  h += `</div><div class="crt-section-title">RAMP — pruebas</div><div class="crt-grid">`;
  Object.keys(c.ramp).forEach(k => {
    h += crtRow(k, c.ramp[k], `cartuchos.ramp['${k}']=Math.max(0,cartuchos.ramp['${k}']-1);renderCartuchos()`, `cartuchos.ramp['${k}']++;renderCartuchos()`);
  });
  h += `</div>`;
  document.getElementById('crt-content').innerHTML = h;
  saveDraft();
}

// ==================== REACTIVOS ====================
function renderReactivos() {
  const el = document.getElementById('list-react');
  if (!reactivos.length) { el.innerHTML = '<div class="empty">sin incidencias registradas</div>'; return; }
  el.innerHTML = reactivos.map((r, i) => `<div class="item-row">
    <span class="it">${r.n}</span>
    <div style="display:flex;gap:4px;flex-wrap:wrap">
      <button class="rb falto${r.falto ? ' active' : ''}" onclick="reactivos[${i}].falto=!reactivos[${i}].falto;renderReactivos()">faltó</button>
      <button class="rb fallo${r.fallo ? ' active' : ''}" onclick="reactivos[${i}].fallo=!reactivos[${i}].fallo;renderReactivos()">falló</button>
      <button class="rb acabo${r.acabo ? ' active' : ''}" onclick="reactivos[${i}].acabo=!reactivos[${i}].acabo;renderReactivos()">se acabó</button>
    </div>
    <button class="xbtn" onclick="reactivos.splice(${i},1);renderReactivos()">×</button>
  </div>`).join('');
  saveDraft();
}

function addReact() {
  const i = document.getElementById('in-react');
  const v = i.value.trim();
  if (!v) return;
  reactivos.push({ n: v, falto: false, fallo: false, acabo: false });
  i.value = '';
  renderReactivos();
  saveDraft();
}

// ==================== MAQUILA ====================
function renderMaquila() {
  const el = document.getElementById('maquila-content');
  if (!maquila.length) { el.innerHTML = '<div class="empty">sin estudios de maquila</div>'; return; }
  const rows = maquila.map((m, i) => `<tr>
    <td><input class="ti" type="text" value="${m.pac}" placeholder="Paciente" oninput="maquila[${i}].pac=this.value;saveDraft()" style="min-width:90px"></td>
    <td><input class="ti" type="text" value="${m.folio}" placeholder="Folio" oninput="maquila[${i}].folio=this.value;saveDraft()" style="min-width:60px"></td>
    <td><input class="ti" type="text" value="${m.estudio}" placeholder="Estudio" oninput="maquila[${i}].estudio=this.value;saveDraft()" style="min-width:100px"></td>
    <td><input class="ti" type="text" value="${m.codigo || ''}" placeholder="Código" oninput="maquila[${i}].codigo=this.value;saveDraft()" style="min-width:80px"></td>
    <td><input class="ti" type="text" value="${m.lab}" placeholder="Laboratorio" oninput="maquila[${i}].lab=this.value;saveDraft()" style="min-width:100px"></td>
    <td><div class="tgl-grp">
      <button class="tgl yes${m.resultado === true ? ' active' : ''}" onclick="maquila[${i}].resultado=true;renderMaquila()">Sí</button>
      <button class="tgl no${m.resultado === false ? ' active' : ''}" onclick="maquila[${i}].resultado=false;renderMaquila()">No</button>
    </div></td>
    <td><div class="tgl-grp">
      <button class="tgl yes${m.capturado === true ? ' active' : ''}" onclick="maquila[${i}].capturado=true;renderMaquila()">Sí</button>
      <button class="tgl no${m.capturado === false ? ' active' : ''}" onclick="maquila[${i}].capturado=false;renderMaquila()">No</button>
    </div></td>
    <td><div class="tgl-grp">
      <button class="tgl yes${m.entregado === true ? ' active' : ''}" onclick="maquila[${i}].entregado=true;renderMaquila()">Sí</button>
      <button class="tgl no${m.entregado === false ? ' active' : ''}" onclick="maquila[${i}].entregado=false;renderMaquila()">No</button>
    </div></td>
    <td><button class="xbtn" onclick="maquila.splice(${i},1);renderMaquila()">×</button></td>
  </tr>`).join('');
  el.innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr><th>Paciente</th><th>ID</th><th>Estudios</th><th>Código estudios</th><th>Laboratorio</th><th>Resultado recibido</th><th>Capturado en easyLIS</th><th>Entregado</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  saveDraft();
}

function addMaquila() {
  maquila.push({ pac: '', folio: '', estudio: '', codigo: '', lab: '', resultado: null, capturado: null, entregado: null });
  renderMaquila();
  saveDraft();
}

// ==================== CULTIVOS ====================
function renderCultivos() {
  const el = document.getElementById('cultivos-content');
  if (!cultivos.length) { el.innerHTML = '<div class="empty">sin cultivos registrados</div>'; return; }
  const estadoPill = { pendiente: 'p-pend', preliminar: 'p-prel', final: 'p-final' };
  const estadoLabel = { pendiente: 'Pendiente', preliminar: 'Preliminar', final: 'Final' };
  const rows = cultivos.map((c, i) => `<tr>
    <td><input class="ti" type="text" value="${c.pac}" placeholder="Paciente" oninput="cultivos[${i}].pac=this.value;saveDraft()" style="min-width:90px"></td>
    <td><input class="ti" type="text" value="${c.tipo}" placeholder="Tipo de cultivo" oninput="cultivos[${i}].tipo=this.value;saveDraft()" style="min-width:110px"></td>
    <td><select class="stat-sel" onchange="cultivos[${i}].estado=this.value;renderCultivos()">
      <option value="pendiente"${c.estado === 'pendiente' ? ' selected' : ''}>Pendiente</option>
      <option value="preliminar"${c.estado === 'preliminar' ? ' selected' : ''}>Preliminar entregado</option>
      <option value="final"${c.estado === 'final' ? ' selected' : ''}>Final entregado</option>
    </select></td>
    <td><span class="pill ${estadoPill[c.estado]}">${estadoLabel[c.estado]}</span></td>
    <td><input class="ti" type="text" value="${c.obs}" placeholder="Seguimiento / notas..." oninput="cultivos[${i}].obs=this.value;saveDraft()" style="min-width:130px"></td>
    <td><button class="xbtn" onclick="cultivos.splice(${i},1);renderCultivos()">×</button></td>
  </tr>`).join('');
  el.innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr><th>Paciente</th><th>Tipo de cultivo</th><th>Estado</th><th></th><th>Seguimiento</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  saveDraft();
}

function addCultivo() {
  cultivos.push({ pac: '', tipo: '', estado: 'pendiente', obs: '' });
  renderCultivos();
  saveDraft();
}

// ==================== PLACAS ====================
function renderPlacas() {
  const el = document.getElementById('placas-content');
  if (!placas.length) { el.innerHTML = '<div class="empty">sin placas registradas</div>'; return; }
  const rows = placas.map((p, i) => `<tr>
    <td><input class="ti" type="text" value="${p.id}" placeholder="ID / muestra" oninput="placas[${i}].id=this.value;saveDraft()" style="min-width:80px"></td>
    <td><input class="ti" type="text" value="${p.tipo}" placeholder="Tipo" oninput="placas[${i}].tipo=this.value;saveDraft()" style="min-width:90px"></td>
    <td><input class="ti" type="datetime-local" value="${p.sembrado}" oninput="placas[${i}].sembrado=this.value;saveDraft()"></td>
    <td><input class="ti" type="text" value="${p.seg}" placeholder="Seguimiento..." oninput="placas[${i}].seg=this.value;saveDraft()" style="min-width:130px"></td>
    <td><button class="xbtn" onclick="placas.splice(${i},1);renderPlacas()">×</button></td>
  </tr>`).join('');
  el.innerHTML = `<div class="tbl-wrap"><table>
    <thead><tr><th>ID / Muestra</th><th>Tipo de placa</th><th>Fecha y hora de siembra</th><th>Seguimiento</th><th></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
  saveDraft();
}

function addPlaca() {
  const now = new Date();
  const loc = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  placas.push({ id: '', tipo: '', sembrado: loc, seg: '' });
  renderPlacas();
  saveDraft();
}

// ==================== TAREAS ====================
function renderTasks(key) {
  const el = document.getElementById('list-' + key);
  const arr = tasks[key];
  const msgs = { real: 'sin tareas', pend: 'sin pendientes', inc: 'sin incidencias' };
  if (!arr.length) { el.innerHTML = `<div class="empty">${msgs[key]}</div>`; return; }
  el.innerHTML = arr.map((t, i) => `<div class="item-row">
    <span class="it">${t.text}</span>
    ${key === 'pend' ? `<span class="pbadge b${t.prio[0]}">${t.prio}</span>` : ''}
    <button class="xbtn" onclick="tasks['${key}'].splice(${i},1);renderTasks('${key}')">×</button>
  </div>`).join('');
  saveDraft();
}

function addTask(key) {
  const i = document.getElementById('in-' + key);
  const v = i.value.trim();
  if (!v) return;
  const o = { text: v };
  if (key === 'pend') o.prio = document.getElementById('prio').value;
  tasks[key].push(o);
  i.value = '';
  renderTasks(key);
  saveDraft();
}

// ==================== RESUMEN ====================
function genResumen() {
  const fecha = document.getElementById('fecha').value;
  const sale = document.getElementById('g-sale').value || '—';
  const entra = document.getElementById('g-entra').value || '—';
  const obs = document.getElementById('obs').value;
  const tLabel = { Manana: 'Mañana', Tarde: 'Tarde', Noche: 'Noche' }[turno] || '(sin seleccionar)';

  const eqFallas = equipos.filter(e => e.status === 'fa').map(e => e.n);
  const eqMant = equipos.filter(e => e.status === 'ma').map(e => e.n);
  const eqApag = equipos.filter(e => e.status === 'ap').map(e => e.n);
  const sinCtrl = areas.filter(a => a.ctrl === false).map(a => a.n);
  const sinCalib = areas.filter(a => a.calib === false).map(a => a.n);
  const sinReg = areas.filter(a => a.ctrl === null).map(a => a.n);
  const prUsadas = pruebasRapidas.filter(p => p.usado > 0);
  const prProbs = pruebasRapidas.filter(p => p.fallo || p.falto || p.acabo);
  const reactProbs = reactivos.filter(r => r.falto || r.fallo || r.acabo);
  const maqPend = maquila.filter(m => !m.entregado);
  const cultPend = cultivos.filter(c => c.estado === 'pendiente');
  const pendAlta = tasks.pend.filter(t => t.prio === 'alta');

  const totalCrt = cartuchos.istat + cartuchos.epoc +
    Object.values(cartuchos.filmarray).reduce((a, b) => a + b, 0) +
    Object.values(cartuchos.ramp).reduce((a, b) => a + b, 0);

  let h = `<div class="sum-title">Resumen de entrega — Turno ${tLabel} | ${fecha}</div>`;
  h += `<div class="sum-row"><b>${sale}</b> entrega guardia a <b>${entra}</b></div>`;

  h += `<div class="sum-divider"></div>`;
  h += `<div class="sum-row">
    <b>${tasks.real.length}</b> tarea(s) realizadas &nbsp;|&nbsp;
    <b>${tasks.pend.length}</b> pendiente(s)${pendAlta.length ? ` <span class="alert">⚠ ${pendAlta.length} alta prioridad</span>` : '<span class="ok"> ✔</span>'} &nbsp;|&nbsp;
    <b>${tasks.inc.length}</b> incidencia(s)${tasks.inc.length ? ' <span class="alert">⚠</span>' : '<span class="ok"> ✔</span>'}
  </div>`;

  h += `<div class="sum-divider"></div>`;
  h += `<div class="sum-row"><b>Equipos:</b> `;
  if (!eqFallas.length && !eqMant.length && !eqApag.length) { h += '<span class="ok">todos operativos ✔</span>'; }
  else {
    if (eqFallas.length) h += `<span class="alert">falla: ${eqFallas.join(', ')}</span> &nbsp;`;
    if (eqMant.length) h += `<span class="warn">mantenimiento: ${eqMant.join(', ')}</span> &nbsp;`;
    if (eqApag.length) h += `apagados: ${eqApag.join(', ')}`;
  }
  h += `</div>`;

  h += `<div class="sum-row"><b>Controles / calibradores:</b> `;
  if (!sinCtrl.length && !sinCalib.length && !sinReg.length) { h += '<span class="ok">todas las áreas al día ✔</span>'; }
  else {
    if (sinCtrl.length) h += `<span class="alert">sin controles: ${sinCtrl.join(', ')}</span> &nbsp;`;
    if (sinCalib.length) h += `<span class="alert">sin calibradores: ${sinCalib.join(', ')}</span> &nbsp;`;
    if (sinReg.length) h += `<span class="warn">sin registrar: ${sinReg.join(', ')}</span>`;
  }
  h += `</div>`;

  if (prUsadas.length) {
    h += `<div class="sum-row"><b>Pruebas rápidas usadas:</b> ${prUsadas.map(p => `${p.n} <span style="color:var(--muted)">(×${p.usado})</span>`).join(' | ')}</div>`;
  }
  if (prProbs.length) {
    h += `<div class="sum-row"><b>Problemas en pruebas rápidas:</b> `;
    h += prProbs.map(p => { let is = []; if (p.fallo) is.push('falló'); if (p.falto) is.push('faltó'); if (p.acabo) is.push('se acabó'); return `<span class="alert">${p.n} (${is.join(', ')})</span>`; }).join(' | ');
    h += `</div>`;
  }

  if (totalCrt > 0) {
    h += `<div class="sum-row"><b>Cartuchos:</b> `;
    const parts = [];
    if (cartuchos.istat) parts.push(`iStat ×${cartuchos.istat}`);
    if (cartuchos.epoc) parts.push(`Epoc ×${cartuchos.epoc}`);
    Object.entries(cartuchos.filmarray).filter(([, v]) => v > 0).forEach(([k, v]) => parts.push(`FA-${k} ×${v}`));
    Object.entries(cartuchos.ramp).filter(([, v]) => v > 0).forEach(([k, v]) => parts.push(`RAMP-${k} ×${v}`));
    h += parts.join(' | ') + '</div>';
  }

  if (reactProbs.length) {
    h += `<div class="sum-row"><b>Reactivos con incidencias:</b> `;
    h += reactProbs.map(r => { let is = []; if (r.falto) is.push('faltó'); if (r.fallo) is.push('falló'); if (r.acabo) is.push('se acabó'); return `<span class="alert">${r.n} (${is.join(', ')})</span>`; }).join(' | ');
    h += `</div>`;
  }

  if (maqPend.length) {
    h += `<div class="sum-row"><span class="warn"><b>Maquila pendiente (${maqPend.length}):</b> `;
    h += maqPend.map(m => `${m.pac || '—'} — ${m.estudio || '—'}`).join(' | ');
    h += `</span></div>`;
  } else if (maquila.length) {
    h += `<div class="sum-row"><b>Maquila:</b> <span class="ok">todos entregados ✔</span></div>`;
  }

  if (cultPend.length) {
    h += `<div class="sum-row"><span class="warn"><b>Cultivos pendientes (${cultPend.length}):</b> `;
    h += cultPend.map(c => `${c.pac || '—'} — ${c.tipo || '—'}`).join(' | ');
    h += `</span></div>`;
  }

  if (obs) {
    h += `<div class="sum-divider"></div>`;
    h += `<div class="sum-row"><b>Observaciones:</b> <em>${obs}</em></div>`;
  }

  const box = document.getElementById('resumen-box');
  box.innerHTML = h;
  box.classList.add('show');
  setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

// ==================== GUARDAR ====================
async function guardarEntrega() {
  if (!validateForm()) return;

  const fecha = document.getElementById('fecha').value;
  const snap = {
    fecha, turno,
    sale: document.getElementById('g-sale').value.trim(),
    entra: document.getElementById('g-entra').value.trim(),
    equipos: JSON.parse(JSON.stringify(equipos)),
    areas: JSON.parse(JSON.stringify(areas)),
    pruebasRapidas: JSON.parse(JSON.stringify(pruebasRapidas)),
    cartuchos: JSON.parse(JSON.stringify(cartuchos)),
    reactivos: JSON.parse(JSON.stringify(reactivos)),
    maquila: JSON.parse(JSON.stringify(maquila)),
    cultivos: JSON.parse(JSON.stringify(cultivos)),
    placas: JSON.parse(JSON.stringify(placas)),
    tasks: JSON.parse(JSON.stringify(tasks)),
    obs: document.getElementById('obs').value,
    savedAt: new Date().toISOString()
  };
  const key = 'guardia_' + fecha + '_' + turno.toLowerCase();
  try {
    localStorage.setItem(key, JSON.stringify(snap));
    downloadHTML(snap);
    showToast('✔ Entrega guardada y descargada correctamente');
  } catch (e) { showToast('Error al guardar', true); }
}

function downloadHTML(data) {
  const tLabel = { Manana: 'Mañana', Tarde: 'Tarde', Noche: 'Noche' }[data.turno] || data.turno;
  
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Entrega de Guardia - ${data.fecha}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #fafafa; }
    h1 { color: #29252b; font-size: 20px; border-bottom: 2px solid #6399f6; padding-bottom: 10px; }
    h2 { color: #565b67; font-size: 14px; font-weight: normal; margin-top: 5px; }
    .meta { display: flex; gap: 20px; margin: 20px 0; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .meta div { flex: 1; }
    .label { font-size: 11px; color: #565b67; text-transform: uppercase; }
    .value { font-size: 14px; font-weight: 600; color: #29252b; }
    .section { margin: 20px 0; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h3 { color: #6399f6; font-size: 13px; margin: 0 0 10px; text-transform: uppercase; }
    .row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 5px; }
    .pill { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .pill-ok { background: #d3f1e2; color: #03b444; }
    .pill-warn { background: #f7ecd2; color: #ef9402; }
    .pill-error { background: #f9dada; color: #d50303; }
    .empty { color: #888; font-style: italic; }
    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Hospital Escandón — Laboratorio</h1>
  <h2>Entrega de Guardia | Turno ${tLabel} | ${data.fecha}</h2>
  
  <div class="meta">
    <div><div class="label">Guardia saliente</div><div class="value">${data.sale}</div></div>
    <div><div class="label">Guardia entrante</div><div class="value">${data.entra}</div></div>
    <div><div class="label">Fecha</div><div class="value">${data.fecha}</div></div>
  </div>
  
  <div class="section">
    <h3>Estado de Equipos</h3>
    ${(data.equipos || []).filter(e => e.status !== 'op').length ? (data.equipos || []).filter(e => e.status !== 'op').map(e => `<span class="pill ${e.status === 'fa' ? 'pill-error' : 'pill-warn'}">${e.n}: ${e.status === 'fa' ? 'Falla' : e.status === 'ma' ? 'Mantenimiento' : 'Apagado'}</span>`).join(' ') : '<span class="empty">Todos operativos</span>'}
  </div>
  
  <div class="section">
    <h3>Controles y Calibradores</h3>
    ${(data.areas || []).filter(a => a.ctrl === false || a.calib === false).length ? (data.areas || []).filter(a => a.ctrl === false || a.calib === false).map(a => `<span class="pill pill-error">${a.n}</span>`).join(' ') : '<span class="pill pill-ok">Todos al día</span>'}
  </div>
  
  <div class="section">
    <h3>Pruebas Rápidas</h3>
    ${(data.pruebasRapidas || []).filter(p => p.usado > 0).length ? (data.pruebasRapidas || []).filter(p => p.usado > 0).map(p => `<span class="pill pill-ok">${p.n} ×${p.usado}</span>`).join(' ') : '<span class="empty">Sin pruebas usadas</span>'}
  </div>
  
  <div class="section">
    <h3>Cartuchos</h3>
    ${Object.entries(data.cartuchos || {}).filter(([,v]) => typeof v === 'number' ? v > 0 : Object.values(v || {}).some(x => x > 0)).length ? Object.entries(data.cartuchos || {}).flatMap(([k, v]) => typeof v === 'number' && v > 0 ? [`${k} ×${v}`] : Object.entries(v || {}).filter(([,x]) => x > 0).map(([x, y]) => `${k} - ${x} ×${y}`)).join(', ') : '<span class="empty">Sin cartuchos registrados</span>'}
  </div>
  
  ${(data.tasks?.pend || []).length ? `
  <div class="section">
    <h3>Pendientes</h3>
    ${(data.tasks.pend || []).map(t => `<span class="pill pill-${t.prio === 'alta' ? 'error' : 'warn'}">[${t.prio}] ${t.text}</span>`).join(' ')}
  </div>` : ''}
  
  ${data.obs ? `
  <div class="section">
    <h3>Observaciones</h3>
    <p>${data.obs}</p>
  </div>` : ''}
  
  <div class="footer">
    Generado el ${new Date().toLocaleString('es-MX')} | Laboratorio HE
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `guardia_${data.fecha}_${data.turno}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==================== HISTORIAL ====================
let allHistoryData = [];

function loadHistory() {
  const el = document.getElementById('hist-list');
  const keys = Object.keys(localStorage).filter(k => k.startsWith('guardia_')).sort().reverse();
  
  if (!keys.length) {
    el.innerHTML = '<div class="hist-empty">No hay entregas guardadas aún.<br>Los químicos deben llenar el formulario y presionar <b>Guardar entrega</b>.</div>';
    return;
  }

  allHistoryData = keys.map(k => {
    try { return { key: k, ...JSON.parse(localStorage.getItem(k)) }; }
    catch (e) { return null; }
  }).filter(Boolean);

  renderHistoryList(allHistoryData);
}

function renderHistoryList(entries) {
  const el = document.getElementById('hist-list');
  
  if (!entries.length) {
    el.innerHTML = '<div class="no-results">No se encontraron resultados con los filtros aplicados.</div>';
    return;
  }

  el.innerHTML = entries.map((d, i) => {
    const tc = { Manana: 'ht-m', Tarde: 'ht-t', Noche: 'ht-n' }[d.turno] || 'ht-m';
    const tLabel = { Manana: 'Mañana', Tarde: 'Tarde', Noche: 'Noche' }[d.turno] || d.turno;
    const alerts = [];
    (d.equipos || []).filter(e => e.status === 'fa').forEach(e => alerts.push({ t: 'red', l: 'Falla: ' + e.n }));
    (d.areas || []).filter(a => a.ctrl === false).forEach(a => alerts.push({ t: 'red', l: 'Sin ctrl: ' + a.n.split(' ')[0] }));
    (d.reactivos || []).filter(r => r.falto || r.fallo || r.acabo).forEach(r => alerts.push({ t: 'warn', l: 'Reactivo: ' + r.n }));
    const maqPend = (d.maquila || []).filter(m => !m.entregado).length;
    const cultPend = (d.cultivos || []).filter(c => c.estado === 'pendiente').length;
    const pendAlta = (d.tasks?.pend || []).filter(t => t.prio === 'alta').length;
    if (maqPend) alerts.push({ t: 'warn', l: maqPend + ' maquila pendiente' });
    if (cultPend) alerts.push({ t: 'warn', l: cultPend + ' cultivo pendiente' });
    if (pendAlta) alerts.push({ t: 'red', l: pendAlta + ' pendiente alta prioridad' });
    const alertsHtml = alerts.length
      ? alerts.map(a => `<span class="al-pip ${a.t === 'red' ? 'al-red' : 'al-warn'}">${a.l}</span>`).join('')
      : `<span class="al-pip al-ok">sin alertas ✔</span>`;
    return `<div class="hist-card" id="hc${i}" onclick="toggleDet(${i},this)">
      <div class="hist-top">
        <span class="ht-pill ${tc}">${tLabel}</span>
        <span class="hist-fecha">${d.fecha}</span>
        <span class="hist-names">${d.sale || '—'} → ${d.entra || '—'}</span>
        <span class="hist-chevron">▶</span>
      </div>
      <div class="alerts-row">${alertsHtml}</div>
    </div>
    <div id="hd${i}" class="det-panel">${buildDet(d)}</div>`;
  }).join('');
}

function filterHistory() {
  const searchTerm = document.getElementById('hist-search').value.toLowerCase();
  const dateFilter = document.getElementById('hist-date').value;
  const turnoFilter = document.getElementById('hist-turno').value;

  const filtered = allHistoryData.filter(d => {
    const matchSearch = !searchTerm || 
      (d.sale || '').toLowerCase().includes(searchTerm) ||
      (d.entra || '').toLowerCase().includes(searchTerm) ||
      (d.fecha || '').includes(searchTerm);
    const matchDate = !dateFilter || d.fecha === dateFilter;
    const matchTurno = !turnoFilter || d.turno === turnoFilter;
    return matchSearch && matchDate && matchTurno;
  });

  renderHistoryList(filtered);
}

function clearFilters() {
  document.getElementById('hist-search').value = '';
  document.getElementById('hist-date').value = '';
  document.getElementById('hist-turno').value = '';
  renderHistoryList(allHistoryData);
}

function toggleDet(i, card) {
  const p = document.getElementById('hd' + i);
  const open = p.classList.toggle('open');
  card.classList.toggle('open', open);
}

function buildDet(d) {
  let h = '';
  const eqF = (d.equipos || []).filter(e => e.status !== 'op');
  h += `<div class="det-block"><div class="det-block-title">Equipos</div>`;
  h += eqF.length ? eqF.map(e => `<span class="det-a">${e.n}: ${statusMap[e.status]?.l || e.status}</span>`).join(' | ') : '<span class="det-g">todos operativos ✔</span>';
  h += `</div>`;

  const sC = (d.areas || []).filter(a => a.ctrl === false), sCal = (d.areas || []).filter(a => a.calib === false);
  h += `<div class="det-block"><div class="det-block-title">Controles / calibradores</div>`;
  if (!sC.length && !sCal.length) h += '<span class="det-g">al día ✔</span>';
  else {
    if (sC.length) h += `<span class="det-a">sin controles: ${sC.map(a => a.n).join(', ')}</span> `;
    if (sCal.length) h += `<span class="det-a">sin calibradores: ${sCal.map(a => a.n).join(', ')}</span>`;
  }
  h += `</div>`;

  const prU = (d.pruebasRapidas || []).filter(p => p.usado > 0), prP = (d.pruebasRapidas || []).filter(p => p.fallo || p.falto || p.acabo);
  if (prU.length) h += `<div class="det-block"><div class="det-block-title">Pruebas rápidas usadas</div>${prU.map(p => `<span class="det-r">${p.n}</span> ×${p.usado}`).join(' | ')}</div>`;
  if (prP.length) {
    h += `<div class="det-block"><div class="det-block-title">Problemas pruebas rápidas</div>`;
    h += prP.map(p => { let is = []; if (p.fallo) is.push('falló'); if (p.falto) is.push('faltó'); if (p.acabo) is.push('se acabó'); return `<span class="det-a">${p.n} (${is.join(', ')})</span>`; }).join(' | ');
    h += `</div>`;
  }

  const c = d.cartuchos;
  if (c) {
    const fa = Object.entries(c.filmarray || {}).filter(([, v]) => v > 0), rp = Object.entries(c.ramp || {}).filter(([, v]) => v > 0);
    if (c.istat || c.epoc || fa.length || rp.length) {
      h += `<div class="det-block"><div class="det-block-title">Cartuchos</div>`;
      const parts = [];
      if (c.istat) parts.push(`iStat ×${c.istat}`); if (c.epoc) parts.push(`Epoc ×${c.epoc}`);
      fa.forEach(([k, v]) => parts.push(`FA-${k} ×${v}`)); rp.forEach(([k, v]) => parts.push(`RAMP-${k} ×${v}`));
      h += parts.join(' | '); h += `</div>`;
    }
  }

  if ((d.maquila || []).length) {
    h += `<div class="det-block"><div class="det-block-title">Maquila</div>`;
    d.maquila.forEach(m => {
      const st = m.entregado ? '<span class="det-g">entregado ✔</span>' : m.capturado ? '<span class="det-w">capturado EasyLIS</span>' : '<span class="det-a">pendiente ⚠</span>';
      h += `${m.pac || '—'} (folio: ${m.folio || '—'}) — ${m.estudio || '—'} → ${m.lab || '—'}: ${st}<br>`;
    }); h += `</div>`;
  }

  if ((d.cultivos || []).length) {
    h += `<div class="det-block"><div class="det-block-title">Cultivos</div>`;
    d.cultivos.forEach(c => {
      const st = c.estado === 'pendiente' ? '<span class="det-a">pendiente</span>' : c.estado === 'preliminar' ? '<span class="det-w">preliminar</span>' : '<span class="det-g">final</span>';
      h += `${c.pac || '—'} — ${c.tipo || '—'}: ${st} ${c.obs ? '— ' + c.obs : ''}<br>`;
    }); h += `</div>`;
  }

  if ((d.placas || []).length) {
    h += `<div class="det-block"><div class="det-block-title">Placas sembradas</div>`;
    d.placas.forEach(p => { h += `${p.id || '—'} (${p.tipo || '—'}) — sembrado: ${p.sembrado || '—'}${p.seg ? ' — ' + p.seg : ''}<br>`; });
    h += `</div>`;
  }

  if ((d.tasks?.real || []).length) h += `<div class="det-block"><div class="det-block-title">Tareas realizadas</div>${d.tasks.real.map(t => `<span class="det-r">${t.text}</span>`).join('<br>')}</div>`;
  if ((d.tasks?.pend || []).length) {
    h += `<div class="det-block"><div class="det-block-title">Pendientes</div>`;
    d.tasks.pend.forEach(t => { h += `${t.prio === 'alta' ? '<span class="det-a">' : '<span class="det-r">'}${t.text} [${t.prio}]</span><br>`; });
    h += `</div>`;
  }
  if ((d.tasks?.inc || []).length) h += `<div class="det-block"><div class="det-block-title">Incidencias</div>${d.tasks.inc.map(t => `<span class="det-a">${t.text}</span>`).join('<br>')}</div>`;
  if (d.obs) h += `<div class="det-block"><div class="det-block-title">Observaciones</div><span class="det-r">${d.obs}</span></div>`;
  return h || '<div class="empty">sin datos</div>';
}

// ==================== EXPORTAR PDF ====================
function exportPDF() {
  if (!validateForm()) return;

  const fecha = document.getElementById('fecha').value;
  const sale = document.getElementById('g-sale').value.trim() || '—';
  const entra = document.getElementById('g-entra').value.trim() || '—';
  const obs = document.getElementById('obs').value;
  const tLabel = { Manana: 'Mañana', Tarde: 'Tarde', Noche: 'Noche' }[turno] || '(sin seleccionar)';

  // Generar resumen primero
  genResumen();

  // Crear ventana de impresión optimizada para PDF
  const printWindow = window.open('', '_blank');
  
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Entrega de Guardia - ${fecha}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
  <style>
    body { padding: 20px; background: #fff; }
    .pdf-header { border-bottom: 2px solid #6399f6; padding-bottom: 15px; margin-bottom: 20px; }
    .pdf-header h1 { font-size: 24px; margin: 0; color: #29252b; font-family: 'Syne', sans-serif; }
    .pdf-header h2 { font-size: 14px; margin: 5px 0 0; color: #565b67; font-family: 'DM Mono', monospace; }
    .pdf-meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; font-family: 'DM Mono', monospace; }
    .pdf-section { margin-bottom: 20px; }
    .pdf-section-title { font-size: 13px; font-weight: 700; color: #6399f6; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #d3ddf0; }
    .pdf-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px; }
    .pdf-table th, .pdf-table td { border: 1px solid #d3ddf0; padding: 8px 10px; text-align: left; }
    .pdf-table th { background: #f0f1f3; font-weight: 600; text-transform: uppercase; font-size: 10px; }
    .pdf-table td { font-family: 'DM Mono', monospace; }
    .pdf-row { font-size: 12px; margin-bottom: 8px; font-family: 'DM Mono', monospace; line-height: 1.6; }
    .pdf-row b { color: #29252b; }
    .pdf-footer { text-align: center; font-size: 10px; color: #565b67; margin-top: 30px; padding-top: 15px; border-top: 1px solid #d3ddf0; font-family: 'DM Mono', monospace; }
    .status-ok { color: #03b444; font-weight: 600; }
    .status-warn { color: #ef9402; font-weight: 600; }
    .status-error { color: #d50303; font-weight: 600; }
    .pill-pdf { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600; }
    .pill-ok { background: #d3f1e2; color: #03b444; }
    .pill-warn { background: #f7ecd2; color: #ef9402; }
    .pill-error { background: #f9dada; color: #d50303; }
    @media print {
      body { padding: 0; }
      .pdf-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="pdf-header">
    <h1>Hospital Escandón - Laboratorio</h1>
    <h2>Entrega de Guardia | Turno ${tLabel} | ${fecha}</h2>
  </div>
  
  <div class="pdf-meta">
    <div><strong>Guardia saliente:</strong> ${sale}</div>
    <div><strong>Guardia entrante:</strong> ${entra}</div>
    <div><strong>Fecha:</strong> ${fecha}</div>
  </div>

  ${generatePDFEquipos()}
  ${generatePDFControles()}
  ${generatePDFPruebasRapidas()}
  ${generatePDFCartuchos()}
  ${generatePDFReactivos()}
  ${generatePDFMaquila()}
  ${generatePDFCultivos()}
  ${generatePDFTareas()}
  
  ${obs ? `<div class="pdf-section">
    <div class="pdf-section-title">Observaciones</div>
    <div class="pdf-row">${obs}</div>
  </div>` : ''}

  <div class="pdf-footer">
    Documento generado el ${new Date().toLocaleString('es-MX')} | Laboratorio HE
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  
  // Esperar a que cargue y abrir diálogo de impresión
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

function generatePDFEquipos() {
  const eqFallas = equipos.filter(e => e.status === 'fa');
  const eqMant = equipos.filter(e => e.status === 'ma');
  const eqApag = equipos.filter(e => e.status === 'ap');
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Estado de Equipos</div>`;
  
  if (!eqFallas.length && !eqMant.length && !eqApag.length) {
    html += `<div class="pdf-row"><span class="status-ok">✓ Todos los equipos operativos</span></div>`;
  } else {
    html += `<table class="pdf-table"><thead><tr><th>Equipo</th><th>Estado</th></tr></thead><tbody>`;
    [...eqFallas, ...eqMant, ...eqApag].forEach(e => {
      const statusText = { fa: 'Con falla', ma: 'Mantenimiento', ap: 'Apagado' }[e.status];
      const pillClass = e.status === 'fa' ? 'pill-error' : 'pill-warn';
      html += `<tr><td>${e.n}</td><td><span class="pill-pdf ${pillClass}">${statusText}</span></td></tr>`;
    });
    html += `</tbody></table>`;
  }
  html += `</div>`;
  return html;
}

function generatePDFControles() {
  const sinCtrl = areas.filter(a => a.ctrl === false);
  const sinCalib = areas.filter(a => a.calib === false);
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Controles y Calibradores</div>`;
  
  if (!sinCtrl.length && !sinCalib.length) {
    html += `<div class="pdf-row"><span class="status-ok">✓ Todas las áreas al día</span></div>`;
  } else {
    html += `<table class="pdf-table"><thead><tr><th>Área</th><th>Control</th><th>Calibrador</th><th>Observación</th></tr></thead><tbody>`;
    areas.forEach(a => {
      html += `<tr>
        <td>${a.n}</td>
        <td>${a.ctrl === true ? '<span class="status-ok">✓</span>' : a.ctrl === false ? '<span class="status-error">✗</span>' : '—'}</td>
        <td>${a.calib === true ? '<span class="status-ok">✓</span>' : a.calib === false ? '<span class="status-error">✗</span>' : '—'}</td>
        <td>${a.obs || '—'}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }
  html += `</div>`;
  return html;
}

function generatePDFPruebasRapidas() {
  const prUsadas = pruebasRapidas.filter(p => p.usado > 0);
  const prProbs = pruebasRapidas.filter(p => p.fallo || p.falto || p.acabo);
  
  if (!prUsadas.length && !prProbs.length) return '';
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Pruebas Rápidas</div>`;
  
  if (prUsadas.length) {
    html += `<table class="pdf-table"><thead><tr><th>Prueba</th><th>Cantidad usada</th><th>Observaciones</th></tr></thead><tbody>`;
    prUsadas.forEach(p => {
      let obs = [];
      if (p.fallo) obs.push('falló');
      if (p.falto) obs.push('faltó');
      if (p.acabo) obs.push('se acabó');
      html += `<tr><td>${p.n}</td><td>${p.usado}</td><td>${obs.length ? obs.join(', ') : '—'}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  html += `</div>`;
  return html;
}

function generatePDFCartuchos() {
  const total = cartuchos.istat + cartuchos.epoc +
    Object.values(cartuchos.filmarray).reduce((a, b) => a + b, 0) +
    Object.values(cartuchos.ramp).reduce((a, b) => a + b, 0);
  
  if (total === 0) return '';
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Cartuchos Utilizados</div>
    <table class="pdf-table"><thead><tr><th>Tipo</th><th>Cantidad</th></tr></thead><tbody>`;
  
  if (cartuchos.istat) html += `<tr><td>iStat</td><td>${cartuchos.istat}</td></tr>`;
  if (cartuchos.epoc) html += `<tr><td>Epoc</td><td>${cartuchos.epoc}</td></tr>`;
  Object.entries(cartuchos.filmarray).filter(([, v]) => v > 0).forEach(([k, v]) => {
    html += `<tr><td>Film Array - ${k}</td><td>${v}</td></tr>`;
  });
  Object.entries(cartuchos.ramp).filter(([, v]) => v > 0).forEach(([k, v]) => {
    html += `<tr><td>RAMP - ${k}</td><td>${v}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function generatePDFReactivos() {
  const reactProbs = reactivos.filter(r => r.falto || r.fallo || r.acabo);
  if (!reactProbs.length) return '';
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Reactivos con Incidencias</div>
    <table class="pdf-table"><thead><tr><th>Reactivo</th><th>Incidencia</th></tr></thead><tbody>`;
  
  reactProbs.forEach(r => {
    let obs = [];
    if (r.falto) obs.push('faltó');
    if (r.fallo) obs.push('falló');
    if (r.acabo) obs.push('se acabó');
    html += `<tr><td>${r.n}</td><td>${obs.join(', ')}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function generatePDFMaquila() {
  if (!maquila.length) return '';
  
  let html = `<div class="pdf-section">
    <div class="pdf-section-title">Maquila</div>
    <table class="pdf-table"><thead><tr><th>Paciente</th><th>Folio</th><th>Estudio</th><th>Código estudio</th><th>Laboratorio</th><th>Resultado</th><th>Capturado</th><th>Entregado</th></tr></thead><tbody>`;
  
  maquila.forEach(m => {
    html += `<tr>
      <td>${m.pac || '—'}</td>
      <td>${m.folio || '—'}</td>
      <td>${m.estudio || '—'}</td>
      <td>${m.codigo || '—'}</td>
      <td>${m.lab || '—'}</td>
      <td>${m.resultado === true ? '<span class="status-ok">✓</span>' : m.resultado === false ? '<span class="status-error">✗</span>' : '—'}</td>
      <td>${m.capturado === true ? '<span class="status-ok">✓</span>' : m.capturado === false ? '<span class="status-error">✗</span>' : '—'}</td>
      <td>${m.entregado === true ? '<span class="status-ok">✓</span>' : m.entregado === false ? '<span class="status-error">✗</span>' : '—'}</td>
    </tr>`;
  });
  html += `</tbody></table></div>`;
  return html;
}

function generatePDFCultivos() {
  let html = '';
  
  if (cultivos.length) {
    html += `<div class="pdf-section">
      <div class="pdf-section-title">Cultivos</div>
      <table class="pdf-table"><thead><tr><th>Paciente</th><th>Tipo</th><th>Estado</th><th>Seguimiento</th></tr></thead><tbody>`;
    cultivos.forEach(c => {
      const statusClass = c.estado === 'final' ? 'status-ok' : c.estado === 'preliminar' ? 'status-warn' : 'status-error';
      html += `<tr>
        <td>${c.pac || '—'}</td>
        <td>${c.tipo || '—'}</td>
        <td><span class="${statusClass}">${c.estado}</span></td>
        <td>${c.obs || '—'}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  
  if (placas.length) {
    html += `<div class="pdf-section">
      <div class="pdf-section-title">Placas Sembradas</div>
      <table class="pdf-table"><thead><tr><th>ID/Muestra</th><th>Tipo</th><th>Fecha siembra</th><th>Seguimiento</th></tr></thead><tbody>`;
    placas.forEach(p => {
      html += `<tr>
        <td>${p.id || '—'}</td>
        <td>${p.tipo || '—'}</td>
        <td>${p.sembrado || '—'}</td>
        <td>${p.seg || '—'}</td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
  }
  
  return html;
}

function generatePDFTareas() {
  let html = '';
  
  if (tasks.real.length) {
    html += `<div class="pdf-section">
      <div class="pdf-section-title">Tareas Realizadas</div>
      <ul style="margin:0;padding-left:20px;font-family:'DM Mono',monospace;font-size:11px;">`;
    tasks.real.forEach(t => { html += `<li>${t.text}</li>`; });
    html += `</ul></div>`;
  }
  
  if (tasks.pend.length) {
    html += `<div class="pdf-section">
      <div class="pdf-section-title">Tareas Pendientes</div>
      <ul style="margin:0;padding-left:20px;font-family:'DM Mono',monospace;font-size:11px;">`;
    tasks.pend.forEach(t => {
      const priorityClass = t.prio === 'alta' ? 'status-error' : t.prio === 'media' ? 'status-warn' : '';
      html += `<li><span class="${priorityClass}">[${t.prio}]</span> ${t.text}</li>`;
    });
    html += `</ul></div>`;
  }
  
  if (tasks.inc.length) {
    html += `<div class="pdf-section">
      <div class="pdf-section-title">Incidencias</div>
      <ul style="margin:0;padding-left:20px;font-family:'DM Mono',monospace;font-size:11px;">`;
    tasks.inc.forEach(t => { html += `<li><span class="status-error">${t.text}</span></li>`; });
    html += `</ul></div>`;
  }
  
  return html;
}

// ==================== TOAST ====================
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => t.classList.remove('show', 'error'), 3000);
}
