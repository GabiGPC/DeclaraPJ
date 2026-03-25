// Estrutura de dados: { "2025": { "0": { valor: 0, imposto: 0 }, ... }, "2026": { ... } }
// "meses" é um objeto onde a chave é "ano" e o valor é objeto com chaves "0"-"11"

var dados = JSON.parse(localStorage.getItem('declarapj_dados') || '{}');
// retiradas por ano: { "2025": { proLabore: 0, despesas: 0 }, ... }
var retiradas = JSON.parse(localStorage.getItem('declarapj_retiradas') || '{}');

var MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

var anoLancamento = new Date().getFullYear();
var anoDashboard  = new Date().getFullYear();

function salvar() {
  localStorage.setItem('declarapj_dados',    JSON.stringify(dados));
  localStorage.setItem('declarapj_retiradas', JSON.stringify(retiradas));
}

function fmt(v) {
  return 'R$ ' + Math.max(0, v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(v) {
  v = Math.max(0, v);
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getMesesDoAno(ano) {
  return dados[String(ano)] || {};
}

function getRet(ano) {
  return retiradas[String(ano)] || { proLabore: 0, despesas: 0 };
}

// ── LANÇAMENTOS ──────────────────────────────────────

function adicionarNota() {
  var mes     = parseInt(document.getElementById('nota-mes').value);
  var anoNota = parseInt(document.getElementById('nota-ano').value);
  var valor   = parseFloat(document.getElementById('nota-valor').value) || 0;
  var imposto = parseFloat(document.getElementById('nota-imposto').value) || 0;

  if (valor <= 0) {
    alert('Informe o valor total do mês.');
    return;
  }

  var anoStr = String(anoNota);
  if (!dados[anoStr]) dados[anoStr] = {};
  dados[anoStr][String(mes)] = { valor: valor, imposto: imposto };

  salvar();
  document.getElementById('nota-valor').value   = '';
  document.getElementById('nota-imposto').value = '';

  // Se o ano da nota for o mesmo que está sendo visualizado, atualiza a lista
  if (anoNota === anoLancamento) {
    renderNotas();
    recalcular();
  } else {
    // Navega para o ano da nota adicionada
    anoLancamento = anoNota;
    document.getElementById('ano-lancamentos').textContent = anoLancamento;
    carregarRetiradas();
    renderNotas();
    recalcular();
  }
}

function removerMes(mes) {
  var anoStr = String(anoLancamento);
  if (dados[anoStr]) {
    delete dados[anoStr][String(mes)];
    if (Object.keys(dados[anoStr]).length === 0) delete dados[anoStr];
  }
  salvar();
  renderNotas();
  recalcular();
}

function renderNotas() {
  var container = document.getElementById('lista-notas');
  if (!container) return;

  var mesesAno = getMesesDoAno(anoLancamento);
  var chaves   = Object.keys(mesesAno).map(Number).sort(function(a,b){ return a - b; });

  if (chaves.length === 0) {
    container.innerHTML = '<div class="vazio">Nenhum mês registrado ainda.</div>';
  } else {
    var html = '';
    for (var i = 0; i < chaves.length; i++) {
      var m   = chaves[i];
      var reg = mesesAno[String(m)];
      html += '<div class="nota-item">';
      html += '  <div class="nota-item-top">';
      html += '    <div class="nota-info">';
      html += '      <div class="nota-mes">' + MESES[m] + ' ' + anoLancamento + '</div>';
      if (reg.imposto > 0) {
        html += '      <div class="nota-imposto">Impostos: ' + fmt(reg.imposto) + '</div>';
      }
      html += '    </div>';
      html += '    <div style="display:flex;align-items:center;gap:10px;">';
      html += '      <div class="nota-valor">' + fmt(reg.valor) + '</div>';
      html += '      <button class="btn btn-outline" data-mes="' + m + '">&times;</button>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';
    }
    container.innerHTML = html;

    var botoes = container.querySelectorAll('.btn-outline');
    for (var j = 0; j < botoes.length; j++) {
      botoes[j].addEventListener('click', function() {
        removerMes(Number(this.getAttribute('data-mes')));
      });
    }
  }

  var total = chaves.length;
  var badge = document.getElementById('badge-notas');
  if (badge) badge.textContent = total + (total === 1 ? ' mês' : ' meses');
}

function recalcular() {
  var mesesAno  = getMesesDoAno(anoLancamento);
  var chaves    = Object.keys(mesesAno);

  var receita  = 0;
  var impostos = 0;
  for (var i = 0; i < chaves.length; i++) {
    receita  += mesesAno[chaves[i]].valor;
    impostos += mesesAno[chaves[i]].imposto || 0;
  }

  var ret       = getRet(anoLancamento);
  var proLabore = parseFloat(document.getElementById('pro-labore').value) || 0;
  var despesas  = parseFloat(document.getElementById('despesas').value)   || 0;

  // salva retiradas do ano atual
  retiradas[String(anoLancamento)] = { proLabore: proLabore, despesas: despesas };
  salvar();

  var lucro      = Math.max(0, receita - impostos - despesas - proLabore);
  var tributavel = Math.min(proLabore, receita);

  var mCount = chaves.length;
  document.getElementById('m-receita').textContent    = fmtShort(receita);
  document.getElementById('m-tributavel').textContent = fmtShort(tributavel);
  document.getElementById('m-isento').textContent     = fmtShort(lucro);
  document.getElementById('m-notas').textContent      = mCount + (mCount === 1 ? ' mês registrado' : ' meses registrados');

  document.getElementById('r-receita').textContent   = fmt(receita);
  document.getElementById('r-impostos').textContent  = fmt(impostos);
  document.getElementById('r-despesas').textContent  = fmt(despesas);
  document.getElementById('r-prolabore').textContent = fmt(proLabore);
  document.getElementById('r-lucro').textContent     = fmt(lucro);

  document.getElementById('decl-tributavel').textContent = fmt(tributavel);
  document.getElementById('decl-isento').textContent     = fmt(lucro);
  document.getElementById('decl-ano').textContent        = anoLancamento;
}

function carregarRetiradas() {
  var ret = getRet(anoLancamento);
  document.getElementById('pro-labore').value = ret.proLabore > 0 ? ret.proLabore : '';
  document.getElementById('despesas').value   = ret.despesas  > 0 ? ret.despesas  : '';
}

// ── DASHBOARD ────────────────────────────────────────

function renderDashboard() {
  var ano    = anoDashboard;
  var anoStr = String(ano);

  document.getElementById('d-ano-badge').textContent  = ano;
  document.getElementById('ano-dashboard').textContent = ano;

  var mesesAno = getMesesDoAno(ano);
  var porMes   = [0,0,0,0,0,0,0,0,0,0,0,0];
  var impostoPorMes = [0,0,0,0,0,0,0,0,0,0,0,0];

  var chaves = Object.keys(mesesAno);
  for (var i = 0; i < chaves.length; i++) {
    var m = parseInt(chaves[i]);
    porMes[m]        = mesesAno[chaves[i]].valor;
    impostoPorMes[m] = mesesAno[chaves[i]].imposto || 0;
  }

  var receitaTotal  = 0;
  var impostosTotal = 0;
  for (var m = 0; m < 12; m++) {
    receitaTotal  += porMes[m];
    impostosTotal += impostoPorMes[m];
  }

  var mesesComNotas = 0;
  for (var m = 0; m < 12; m++) { if (porMes[m] > 0) mesesComNotas++; }
  var media = mesesComNotas > 0 ? receitaTotal / mesesComNotas : 0;

  var melhorValor = 0;
  var melhorMes   = -1;
  for (var k = 0; k < 12; k++) {
    if (porMes[k] > melhorValor) { melhorValor = porMes[k]; melhorMes = k; }
  }

  document.getElementById('d-impostos').textContent     = fmtShort(impostosTotal);
  document.getElementById('d-media').textContent        = fmtShort(media);
  document.getElementById('d-media-sub').textContent    = mesesComNotas + (mesesComNotas === 1 ? ' mês com notas' : ' meses com notas');
  document.getElementById('d-melhor-valor').textContent = fmtShort(melhorValor);
  document.getElementById('d-melhor-mes').textContent   = melhorMes >= 0 ? MESES_CURTO[melhorMes] : '—';

  document.getElementById('d-receita-total').textContent  = fmt(receitaTotal);
  document.getElementById('d-impostos-total').textContent = fmt(impostosTotal);
  document.getElementById('d-media-total').textContent    = fmt(media);
  document.getElementById('d-carga').textContent = receitaTotal > 0 ? ((impostosTotal / receitaTotal) * 100).toFixed(1) + '%' : '0%';

  var grafico = document.getElementById('grafico-barras');
  var vazio   = document.getElementById('dashboard-vazio');

  if (receitaTotal === 0) {
    grafico.style.display = 'none';
    vazio.style.display   = 'block';
    return;
  }

  grafico.style.display = 'flex';
  vazio.style.display   = 'none';

  var maximo = 0;
  for (var b = 0; b < 12; b++) { if (porMes[b] > maximo) maximo = porMes[b]; }

  var alturaMax = 140;
  var html = '';
  for (var b = 0; b < 12; b++) {
    var altura     = maximo > 0 ? Math.round((porMes[b] / maximo) * alturaMax) : 0;
    var isZero     = porMes[b] === 0;
    var valorLabel = porMes[b] > 0 ? fmtShort(porMes[b]) : '';
    html += '<div class="barra-col">';
    html += '<div class="barra' + (isZero ? ' barra-zero' : '') + '" style="height:' + (isZero ? 4 : altura) + 'px;">';
    if (valorLabel) html += '<span class="barra-valor">' + valorLabel + '</span>';
    html += '</div>';
    html += '<span class="barra-label">' + MESES_CURTO[b] + '</span>';
    html += '</div>';
  }
  grafico.innerHTML = html;
}

// ── ABAS ─────────────────────────────────────────────

function mostrarAba(aba) {
  var elLanc = document.getElementById('pagina-lancamentos');
  var elDash = document.getElementById('pagina-dashboard');
  var btnLanc = document.getElementById('tab-lancamentos');
  var btnDash = document.getElementById('tab-dashboard');

  if (aba === 'dashboard') {
    elLanc.style.display = 'none';
    elDash.style.display = 'block';
    btnLanc.classList.remove('active');
    btnDash.classList.add('active');
    renderDashboard();
  } else {
    elDash.style.display = 'none';
    elLanc.style.display = 'block';
    btnDash.classList.remove('active');
    btnLanc.classList.add('active');
  }
}

// ── INIT ─────────────────────────────────────────────

window.onload = function() {

  // Selecionar mês e ano atual por padrão
  var mesAtual = new Date().getMonth();
  document.getElementById('nota-mes').value = mesAtual;
  document.getElementById('nota-ano').value = anoLancamento;

  // Mostrar ano atual
  document.getElementById('ano-lancamentos').textContent = anoLancamento;
  document.getElementById('ano-dashboard').textContent   = anoDashboard;

  // Navegação de ano — Lançamentos
  document.getElementById('ano-prev').addEventListener('click', function() {
    anoLancamento--;
    document.getElementById('ano-lancamentos').textContent = anoLancamento;
    carregarRetiradas();
    renderNotas();
    recalcular();
  });

  document.getElementById('ano-next').addEventListener('click', function() {
    anoLancamento++;
    document.getElementById('ano-lancamentos').textContent = anoLancamento;
    carregarRetiradas();
    renderNotas();
    recalcular();
  });

  // Navegação de ano — Dashboard
  document.getElementById('dash-ano-prev').addEventListener('click', function() {
    anoDashboard--;
    renderDashboard();
  });

  document.getElementById('dash-ano-next').addEventListener('click', function() {
    anoDashboard++;
    renderDashboard();
  });

  // Botão adicionar
  document.getElementById('btn-adicionar').addEventListener('click', adicionarNota);

  // Campos de retiradas
  document.getElementById('pro-labore').addEventListener('input', recalcular);
  document.getElementById('despesas').addEventListener('input', recalcular);

  // Abas
  document.getElementById('tab-lancamentos').addEventListener('click', function() { mostrarAba('lancamentos'); });
  document.getElementById('tab-dashboard').addEventListener('click', function() { mostrarAba('dashboard'); });

  // Carregar dados do ano atual
  carregarRetiradas();
  renderNotas();
  recalcular();
};
