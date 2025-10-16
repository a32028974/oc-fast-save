// /js/fastsave.js — v2025-10-16a (para v05 Óptica Cristal)
// Guarda RÁPIDO (solo Sheet) y Entrega (genera PDF) usando tu WebApp nueva.

const API_URL = 'https://script.google.com/macros/s/AKfycbwVmlfFxAycG_TBSGGdgmPafrdz1a5nemrGL2CJ-Tlcl4ZOiH96CLlkp-qsm5X8MXCO9g/exec';

// === Selectores de TU v05 (IDs reales de tu HTML) ===
const SEL = {
  nro:              '#numero_trabajo',
  dni:              '#dni',
  nombre:           '#nombre',
  telefono:         '#telefono',
  localidad:        '#localidad',
  cristal:          '#cristal',
  precioCristal:    '#precio_cristal',
  conceptoNeg:      '#obra_social',
  descuento:        '#importe_obra_social',
  od_esf:           '#od_esf', od_cil:'#od_cil', od_eje:'#od_eje',
  dist_focal:       '#distancia_focal',
  oi_esf:           '#oi_esf', oi_cil:'#oi_cil', oi_eje:'#oi_eje',
  dr:               '#dr', dnp:'#dnp', add:'#add',
  otro:             '#otro_concepto',
  precioOtro:       '#precio_otro',
  vendedor:         '#vendedor',
  formaPago:        '#forma_pago',
  nArmazon:         '#numero_armazon',
  detArmazon:       '#armazon_detalle',
  precioArmazon:    '#precio_armazon',
  total:            '#total', sena:'#sena', saldo:'#saldo',
  // botones nuevos:
  btnGuardar:       '#btnGuardarRapido',
  btnEntregar:      '#btnEntregar',
  // mensaje de estado
  msg:              '#fastsave_msg'
};

const $ = (s) => document.querySelector(s);
const V = (s) => { const el = $(s); return (el ? (el.value ?? '').toString().trim() : ''); };
const U = (v) => (v ?? '').toString().trim().toUpperCase();

function setMsg(txt, ok=true){
  const el = $(SEL.msg); if (!el) return;
  el.textContent = txt;
  el.style.color = ok ? '#36d399' : '#ff8b8b';
}

function swalOK(title, text){
  if (window.Swal) return Swal.fire({ icon:'success', title, text, timer:1400, showConfirmButton:false });
  setMsg(`${title} ${text||''}`, true);
}
function swalERR(text){
  if (window.Swal) return Swal.fire({ icon:'error', title:'Error', text: String(text) });
  setMsg('Error: '+String(text), false);
}

// --- Construye body para SAVE (rápido) ---
function buildSaveParams(){
  const nro = V(SEL.nro);
  if (!nro) throw new Error('Falta el Nº de trabajo');
  // Si pedís dist. focal obligatoria para guardar rápido, descomentá:
  // if (!V(SEL.dist_focal)) throw new Error('Elegí la Distancia focal');

  const p = new URLSearchParams();
  p.set('action','save');
  p.set('nro', nro);

  p.set('dni', V(SEL.dni));
  p.set('nombre', U(V(SEL.nombre)));
  p.set('cristal', V(SEL.cristal));
  p.set('armazon', V(SEL.detArmazon));
  p.set('otro', V(SEL.otro));

  // Si querés enviar TODO para tener respaldo, lo metemos en "extra" (columna opcional):
  const extra = {
    telefono: V(SEL.telefono),
    localidad: V(SEL.localidad),
    precioCristal: V(SEL.precioCristal),
    conceptoNeg: V(SEL.conceptoNeg),
    descuento: V(SEL.descuento),
    od: { esf: V(SEL.od_esf), cil: V(SEL.od_cil), eje: V(SEL.od_eje) },
    oi: { esf: V(SEL.oi_esf), cil: V(SEL.oi_cil), eje: V(SEL.oi_eje) },
    dist_focal: V(SEL.dist_focal),
    dr: V(SEL.dr), dnp: V(SEL.dnp), add: V(SEL.add),
    precioOtro: V(SEL.precioOtro),
    vendedor: V(SEL.vendedor),
    formaPago: V(SEL.formaPago),
    nArmazon: V(SEL.nArmazon),
    precioArmazon: V(SEL.precioArmazon),
    total: V(SEL.total), sena: V(SEL.sena), saldo: V(SEL.saldo)
  };
  // Si no querés usar "extra" en el Apps Script, simplemente lo ignora.
  p.set('extra', JSON.stringify(extra));

  return p;
}

// --- Guardado rápido (sólo al Sheet) ---
async function guardarRapido(){
  try{
    setMsg('Guardando…', true);
    const body = buildSaveParams();
    const r = await fetch(API_URL, { method:'POST', body });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'No se pudo guardar');
    swalOK('Guardado rápido ✔️', `Nº ${j.nro} (fila ${j.row})`);
    setMsg('');
  }catch(err){
    swalERR(err.message || err);
  }
}

// --- Entregar: genera PDF + (opcional Telegram) ---
async function entregar(){
  try{
    const nro = V(SEL.nro);
    if (!nro) throw new Error('Falta el Nº de trabajo');
    // Para cerrar, sí conviene exigir dist. focal:
    if (!V(SEL.dist_focal)) throw new Error('Elegí la Distancia focal antes de entregar');

    setMsg('Generando PDF…', true);
    const p = new URLSearchParams();
    p.set('action','deliver');
    p.set('nro', nro);
    p.set('entrega', V(SEL.vendedor) || '');
    p.set('forma',   V(SEL.formaPago) || '');

    const r = await fetch(API_URL, { method:'POST', body: p });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'No se pudo generar el PDF');

    swalOK('Entrega registrada ✔️', 'Se generó el PDF');
    setMsg('');
    // Si querés abrir el PDF:
    // if (j.pdfUrl) window.open(j.pdfUrl, '_blank');
  }catch(err){
    swalERR(err.message || err);
  }
}

// --- Bind automático a tus botones ---
function bind(){
  const b1 = $(SEL.btnGuardar);
  const b2 = $(SEL.btnEntregar);
  if (b1 && !b1.__fs){ b1.addEventListener('click', guardarRapido); b1.__fs = 1; }
  if (b2 && !b2.__fs){ b2.addEventListener('click', entregar);     b2.__fs = 1; }
}
document.addEventListener('DOMContentLoaded', bind);

// Exponer por si querés llamar desde otros scripts
export { guardarRapido, entregar };
