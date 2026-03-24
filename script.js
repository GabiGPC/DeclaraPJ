let notas = JSON.parse(localStorage.getItem('notas') || '[]');

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

function adicionarNota() {
  const data = document.getElementById('nota-data').value;
  const valor = parseFloat(document.getElementById('nota-valor').value);
  const desc = document.getElementById('nota-desc').value.trim();

  if (!data || !valor || valor <= 0 || !desc) {
    alert('Preencha todos os campos da nota.');
    return;
  }

  notas.push({ id: Date.now(), data, valor, desc });
  salvar();
  document.getElementById('nota-valor').value = '';
  document.getElementById('nota-desc').value = '';
  renderNotas();
  recalcular();
}

function removerNota(id) {
  notas = notas.filter(n => n.id !== id);
  salvar();
  renderNotas();
  recalcular();
}

function renderNotas() {
  const container = document.getElementById('lista-notas');

  if (notas.length === 0) {
    container.innerHTML = '<div class="vazio">Nenhuma nota registrada ainda.</div>';
  } else {
    container.innerHTML = notas.slice().reverse().map(n => `
      <div class="nota-item">
        <div class="nota-info">
          <div class="nota-desc">${n.desc}</div>
          <div class="nota-data">${new Date(n.data + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="nota-valor">${fmt(n.valor)}</div>
          <button class="btn btn-outline" onclick="removerNota(${n.id})">×</button>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('badge-notas').textContent = notas.length + (notas.length === 1 ? ' nota' : ' notas');
  document.getElementById('m-notas').textContent = notas.length === 1 ? '1 nota emitida' : notas.length + ' notas emitidas';
}

function recalcular() {
  const receita = notas.reduce((s, n) => s + n.valor, 0);
  const proLabore = parseFloat(document.getElementById('pro-labore').value) || 0;
  const despesas = parseFloat(document.getElementById('despesas').value) || 0;
  const impostos = parseFloat(document.getElementById('impostos').value) || 0;

  const lucro = Math.max(0, receita - despesas - impostos - proLabore);
  const tributavel = Math.min(proLabore, receita);
  const isento = lucro;

  document.getElementById('m-receita').textContent = fmtShort(receita);
  document.getElementById('m-tributavel').textContent = fmtShort(tributavel);
  document.getElementById('m-isento').textContent = fmtShort(isento);

  document.getElementById('r-receita').textContent = fmt(receita);
  document.getElementById('r-despesas').textContent = fmt(despesas);
  document.getElementById('r-impostos').textContent = fmt(impostos);
  document.getElementById('r-prolabore').textContent = fmt(proLabore);
  document.getElementById('r-lucro').textContent = fmt(lucro);

  document.getElementById('decl-tributavel').textContent = fmt(tributavel);
  document.getElementById('decl-isento').textContent = fmt(isento);
}

// Inicializa
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('nota-data').value = hoje;
renderNotas();
recalcular();
```

---

A estrutura de arquivos fica assim:
```
hub-pj-ir/
├── index.html
├── style.css
└── script.js