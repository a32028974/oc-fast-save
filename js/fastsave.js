// /js/fastsave.js — v2025-10-16
// Integra "Guardado rápido" y "Entregar (PDF)" en tu página actual.

const API_URL = 'https://script.google.com/macros/s/AKfycbwVmlfFxAycG_TBSGGdgmPafrdz1a5nemrGL2CJ-Tlcl4ZOiH96CLlkp-qsm5X8MXCO9g/exec';

/* ========== CONFIG: mapeo de SELECTORES a tus campos ==========
   Ajustá solo si tus IDs difieren. Si un selector no existe, se ignora.
*/
const SEL = {
  nroTrabajo:     '#nro_trabajo, #nTrabajo, #numTrabajo, #nro',   // Nº trabajo
  dni:            '#dni',
  nombre:         '#nombre, #apellidoNombre, #apellidonombre',
  telefono:       '#telefono',
  localidad:      '#localidad',
  tipoCristal:    '#tipo_cristal, #tipoCristal',
  precioCristal:  '#precio_cristal, #precioCristal',
  conceptoNeg:    '#concepto_negativo, #conceptoNegativo',
  descuento:      '#descuento',
  odEsf:          '#od_esf, #odESF',   odCil: '#od_cil, #odCIL',   odEje: '#od_eje, #odEJE',
  oiEsf:          '#oi_esf, #oiESF',   oiCil: '#oi_cil, #oiCIL',   oiEje: '#oi_eje, #oiEJE',
  dnp:            '#dnp',
  add:            '#add',
  otroConcepto:   '#otro_concepto, #otroConcepto',
  precioOtro:     '#precio_otro, #precioOtro',
  vendedor:       '#vendedor',
  formaPago:      '#forma_pago, #formaPago',
  nArmazon:       '#n_armazon, #nroArmazon, #numArmazon',
  detArmazon:     '#detalle_armazon, #detalleArmazon, #marcaModelo',
  precioArmazon:  '#precio_armazon, #precioArmazon',
  // foto receta (input file). Si no existe, lo salta.
  fotoInput:      '#fotoReceta, input[type="file"][name="foto"], input[type="file"]',
  // BOTONES (podés apuntarlos a los que ya tenés)
  btnGuardar:     '#btnGuardarRapido',
  btnEntregar:    '#btnEntregar'
};

// Helpers DOM
const $  = (sel) => document.querySelector(sel);
const V  = (sel) => { const el = $(sel); return (el ? (el.value ?? el.textContent ?? '') : '').toString().trim(); };
const up = (s)   => (s ?? '').toString().trim().toUpperCase();
const setMsg = (txt, ok=true) => {
  let n = $('#fastsave_msg'); 
  if (!n) {
    n = document.createElement('div');
    n.id = 'fastsave_msg';
    n.style.marginTop = '10px';
    n.style.fontSize = '14px';
    n.style.fontFamily = 'system-ui,Segoe UI,Roboto,Arial,sans-serif';
    const cont = document.body; cont.appendChild(n);
  }
  n.textContent = txt;
  n.style.color = ok ? '#36d399' : '#ff8b8b';
};

// Subir foto si hay input[file]; devuelve fileId o ''
async function uploadPhotoIfAny(){
  const inpSel = SEL.fotoInput;
  if (!inpSel) return '';
  const inp = $(inpSel);
  if (!inp || !inp.files || !inp.files[0]) return '';
  const fd = new FormData();
  fd.append('action','upload_photo');
  fd.append('file', inp.files[0]);
  const r = await fetch(API_URL, { method:'POST', body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error subiendo foto');
  return j.fileId || '';
}

// Empaquetar campos para "save"
function buildSaveParams(fotoId=''){
  const p = new URLSearchParams();
  p.set('action','save');

  const nro = V(SEL.nroTrabajo);
  if (!nro) throw new Error('Falta Nº de trabajo');
  p.set('nro', nro);

  p.set('dni',           V(SEL.dni));
  p.set('nombre',        up(V(SEL.nombre)));
  p.set('cristal',       V(SEL.tipoCristal));
  p.set('armazon',       V(SEL.detArmazon));
  p.set('otro',          V(SEL.otroConcepto));

  // Datos optométricos (si existen)
  const opto = {
    od_esf: V(SEL.odEsf), od_cil: V(SEL.odCil), od_eje: V(SEL.odEje),
    oi_esf: V(SEL.oiEsf), oi_cil: V(SEL.oiCil), oi_eje: V(SEL.oiEje),
    dnp: V(SEL.dnp), add: V(SEL.add),
    telefono: V(SEL.telefono), localidad: V(SEL.localidad),
    conceptoNeg: V(SEL.conceptoNeg), descuento: V(SEL.descuento),
    precioCristal: V(SEL.precioCristal), precioOtro: V(SEL.precioOtro),
    nArmazon: V(SEL.nArmazon), precioArmazon: V(SEL.precioArmazon),
    vendedor: V(SEL.vendedor), formaPago: V(SEL.formaPago)
  };
  // Si querés que lleguen también, podés serializar este objeto como JSON en una columna
  // o ignorarlo aquí y solo enviar lo esencial:
  // p.set('extra', JSON.stringify(opto));

  if (fotoId) p.set('fotoId', fotoId);
  return p;
}

// Guardado rápido
export async function guardarRapido(){
  try{
    setMsg('Guardando...', true);
    const fotoId = await uploadPhotoIfAny().catch(()=> '');
    const params = buildSaveParams(fotoId);
    const r = await fetch(API_URL, { method:'POST', body: params });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    setMsg(`Guardado rápido ✔️ Nº ${j.nro} (fila ${j.row})`, true);
  }catch(err){
    setMsg('Error: ' + (err.message || err), false);
  }
}

// Entregar (genera PDF)
export async function entregar(){
  try{
    setMsg('Generando PDF...', true);
    const p = new URLSearchParams();
    const nro = V(SEL.nroTrabajo);
    if (!nro) throw new Error('Falta Nº de trabajo');
    p.set('action','deliver');
    p.set('nro', nro);
    p.set('entrega', V(SEL.vendedor) || V(SEL.formaPago) || ''); // podés cambiar qué mandás
    p.set('forma',   V(SEL.formaPago) || '');

    const r = await fetch(API_URL, { method:'POST', body: p });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error);
    setMsg('Entrega registrada ✔️ PDF: ' + (j.pdfUrl || ''), true);
    // window.open(j.pdfUrl, '_blank'); // si querés abrirlo
  }catch(err){
    setMsg('Error: ' + (err.message || err), false);
  }
}

// Auto-bind si existen los botones
function bind(){
  const b1 = $(SEL.btnGuardar);
  const b2 = $(SEL.btnEntregar);
  if (b1 && !
