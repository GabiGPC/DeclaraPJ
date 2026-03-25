var notas = JSON.parse(localStorage.getItem('notas') || '[]');

var MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function fmt(v) {
  return 'R$ ' + Math.max(0, v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(v) {
  v = Math.max(0, v);
  if (v >= 1000) return 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k';
  return 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function salvar() {
  localStorage.setItem('notas', JSON.stringify(notas));
}

// ── LANÇAMENTOS ──────────────────────────────────────

function adicionarNota() {
  var data  = document.getElementById('nota-data').value;
  var valor = parseFloat(document.getElementById('nota-valor').value);
  var desc  = document.getElementById('nota-desc').value.trim();

  if (!data || !valor || valor <= 0 || !desc) {
    alert('Preencha todos os campos da nota.');
    return;
  }

  notas.push({ id: Date.now(), data: data, valor: valor, desc: desc });
  salvar();
  document.getElementById('nota-valor').value = '';
  document.getElementById('nota-desc').value  = '';
  renderNotas();
  recalcular();
}

function removerNota(id) {
  notas = notas.filter(function(n) { return n.id !== id; });
  salvar();
  renderNotas();
  recalcular();
}

function renderNotas() {
  var container = document.getElementById('lista-notas');
  if (!container) return;

  if (notas.length === 0) {
    container.innerHTML = '<div class="vazio">Nenhuma nota registrada ainda.</div>';
  } else {
    var html = '';
    var lista = notas.slice().reverse();
    for (var i = 0; i < lista.length; i++) {
      var n = lista[i];
      var dataFmt = new Date(n.data + 'T00:00:00').toLocaleDateString('pt-BR');
      html += '<div class="nota-item">';
      html += '<div class="nota-info">';
      html += '<div class="nota-desc">' + n.desc + '</div>';
      html += '<div class="nota-data">' + dataFmt + '</div>';
      html += '</div>';
      html += '<div style="display:flex;align-items:center;gap:10px;">';
      html += '<div class="nota-valor">' + fmt(n.valor) + '</div>';
      html += '<button class="btn btn-outline" data-id="' + n.id + '">&times;</button>';
      html += '</div>';
      html += '</div>';
    }
    container.innerHTML = html;

    var botoes = container.querySelectorAll('.btn-outline');
    for (var j = 0; j < botoes.length; j++) {
      botoes[j].addEventListener('click', function() {
        removerNota(Number(this.getAttribute('data-id')));
      });
    }
  }

  var badge = document.getElementById('badge-notas');
  if (badge) badge.textContent = notas.length + (notas.length === 1 ? ' nota' : ' notas');

  var sub = document.getElementById('m-notas');
  if (sub) sub.textContent = notas.length === 1 ? '1 nota emitida' : notas.length + ' notas emitidas';
}

function recalcular() {
  var receita = 0;
  for (var i = 0; i < notas.length; i++) { receita += notas[i].valor; }

  var proLabore = parseFloat(document.getElementById('pro-labore').value) || 0;
  var despesas  = parseFloat(document.getElementById('despesas').value)   || 0;
  var impostos  = parseFloat(document.getElementById('impostos').value)   || 0;

  var lucro      = Math.max(0, receita - despesas - impostos - proLabore);
  var tributavel = Math.min(proLabore, receita);

  document.getElementById('m-receita').textContent    = fmtShort(receita);
  document.getElementById('m-tributavel').textContent = fmtShort(tributavel);
  document.getElementById('m-isento').textContent     = fmtShort(lucro);

  document.getElementById('r-receita').textContent   = fmt(receita);
  document.getElementById('r-despesas').textContent  = fmt(despesas);
  document.getElementById('r-impostos').textContent  = fmt(impostos);
  document.getElementById('r-prolabore').textContent = fmt(proLabore);
  document.getElementById('r-lucro').textContent     = fmt(lucro);

  document.getElementById('decl-tributavel').textContent = fmt(tributavel);
  document.getElementById('decl-isento').textContent     = fmt(lucro);
}

// ── DASHBOARD ────────────────────────────────────────

function renderDashboard() {
  var ano = new Date().getFullYear();
  document.getElementById('d-ano-badge').textContent = ano;

  var porMes = [0,0,0,0,0,0,0,0,0,0,0,0];
  var notasAno = [];
  for (var i = 0; i < notas.length; i++) {
    if (new Date(notas[i].data + 'T00:00:00').getFullYear() === ano) {
      notasAno.push(notas[i]);
    }
  }
  for (var i = 0; i < notasAno.length; i++) {
    var mes = new Date(notasAno[i].data + 'T00:00:00').getMonth();
    porMes[mes] += notasAno[i].valor;
  }

  var receitaTotal = 0;
  for (var m = 0; m < 12; m++) { receitaTotal += porMes[m]; }

  var impostos = parseFloat(document.getElementById('impostos').value) || 0;

  var mesesComNotas = 0;
  for (var m = 0; m < 12; m++) { if (porMes[m] > 0) mesesComNotas++; }
  var media = mesesComNotas > 0 ? receitaTotal / mesesComNotas : 0;

  var melhorValor = 0;
  var melhorMes = -1;
  for (var k = 0; k < 12; k++) {
    if (porMes[k] > melhorValor) {
      melhorValor = porMes[k];
      melhorMes = k;
    }
  }

  document.getElementById('d-impostos').textContent     = fmtShort(impostos);
  document.getElementById('d-media').textContent        = fmtShort(media);
  document.getElementById('d-media-sub').textContent    = mesesComNotas + (mesesComNotas === 1 ? ' mês com notas' : ' meses com notas');
  document.getElementById('d-melhor-valor').textContent = fmtShort(melhorValor);
  document.getElementById('d-melhor-mes').textContent   = melhorMes >= 0 ? MESES[melhorMes] : '—';
  document.getElementById('d-receita-total').textContent  = fmt(receitaTotal);
  document.getElementById('d-impostos-total').textContent = fmt(impostos);
  document.getElementById('d-media-total').textContent    = fmt(media);
  document.getElementById('d-carga').textContent = receitaTotal > 0 ? ((impostos / receitaTotal) * 100).toFixed(1) + '%' : '0%';

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
    html += '<div class="barra-col" style="position:relative;">';
    html += '<div class="barra' + (isZero ? ' barra-zero' : '') + '" style="height:' + (isZero ? 4 : altura) + 'px;">';
    if (valorLabel) html += '<span class="barra-valor">' + valorLabel + '</span>';
    html += '</div>';
    html += '<span class="barra-label">' + MESES[b] + '</span>';
    html += '</div>';
  }
  grafico.innerHTML = html;
}

// ── ABAS ─────────────────────────────────────────────

function mostrarAba(aba) {
  var lancamentos = document.getElementById('pagina-lancamentos');
  var dashboard   = document.getElementById('pagina-dashboard');
  var btnLanc     = document.getElementById('tab-lancamentos');
  var btnDash     = document.getElementById('tab-dashboard');

  if (aba === 'dashboard') {
    lancamentos.style.display = 'none';
    dashboard.style.display   = 'block';
    btnLanc.classList.remove('active');
    btnDash.classList.add('active');
    renderDashboard();
  } else {
    dashboard.style.display   = 'none';
    lancamentos.style.display = 'block';
    btnDash.classList.remove('active');
    btnLanc.classList.add('active');
  }
}

// ── INIT ─────────────────────────────────────────────

window.onload = function() {
  var hoje = new Date().toISOString().split('T')[0];
  document.getElementById('nota-data').value = hoje;

  document.getElementById('btn-adicionar').addEventListener('click', adicionarNota);
  document.getElementById('pro-labore').addEventListener('input', recalcular);
  document.getElementById('despesas').addEventListener('input', recalcular);
  document.getElementById('impostos').addEventListener('input', recalcular);
  document.getElementById('tab-lancamentos').addEventListener('click', function() { mostrarAba('lancamentos'); });
  document.getElementById('tab-dashboard').addEventListener('click', function() { mostrarAba('dashboard'); });

  renderNotas();
  recalcular();
};
