// Apoio do QA da noite C (127): pasta servida como o GitHub Pages com a edição real do repositório.
const U = require('../t_util'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const spIso = ms => new Date(Date.now() + ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
function montarPasta(nome) {
  const DIR = path.join(__dirname, '..', nome);
  fs.rmSync(DIR, { recursive: true, force: true }); fs.cpSync(path.join(__dirname, '..', 'site'), DIR, { recursive: true });
  let F; try { F = JSON.parse(fs.readFileSync(path.join(U.REPO, 'feed.json'), 'utf8')) } catch (e) { F = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app', 'feed.json'), 'utf8')) }
  F.atualizado_em = spIso(-25 * 60000); const sp = spIso(-25 * 60000); F.edicao = String(F.edicao || '').replace(/\d{2}h\d{2}/, sp.slice(11, 13) + 'h' + sp.slice(14, 16));
  fs.writeFileSync(path.join(DIR, 'feed.json'), JSON.stringify(F));
  try { cp.execFileSync('python3', ['-I', path.join(U.REPO, 'tools', 'feed_leve.py'), path.join(DIR, 'feed.json')]) } catch (e) { }
  for (const f of ['oficiais.json', 'fotos-arquivo.json', 'indicadores.json']) { try { fs.copyFileSync(path.join(U.REPO, f), path.join(DIR, f)) } catch (e) { } }
  for (const d of ['series', 'acervo']) { try { fs.symlinkSync(path.join(U.REPO, d), path.join(DIR, d)) } catch (e) { } }
  fs.writeFileSync(path.join(DIR, 'rodadas.json'), JSON.stringify({ dia: spIso(0).slice(0, 10), itens: { [sp.slice(11, 13) + 'h' + sp.slice(14, 16)]: { tipo: 'rapida', status: 'ok', publicou: true } } }));
  return { DIR, F };
}
// estado de produção nos testes automáticos
const PROD = () => { try { for (const x of ['foco', 'semreels', 'visual', 'capa']) localStorage.setItem('prumo-teste-' + x, '1'); localStorage.setItem('prumo-fase2', '1') } catch (e) { } };
// o que sai da tela na horizontal (fora dos carrosséis), visível
const VAZA = () => {
  const W = innerWidth, out = [];
  const rolaX = el => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true } return false };
  const raiz = document.querySelector('#layer2 > *') ? '#layer2' : document.querySelector('#layer > *') ? '#layer' : 'body';
  for (const el of document.querySelectorAll(raiz + ' *')) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight * 3) continue;
    if (r.right > W + 1.5 || r.left < -1.5) { const s = getComputedStyle(el); if (s.visibility === 'hidden' || s.position === 'fixed' && r.left >= W) continue; if (rolaX(el)) continue;
      out.push((el.tagName + '.' + String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).split(' ').slice(0, 2).join('.')) + ' ' + Math.round(r.left) + '→' + Math.round(r.right)) }
    if (out.length > 6) break;
  }
  return { sw: document.scrollingElement.scrollWidth, W, out };
};
module.exports = { montarPasta, PROD, VAZA, spIso };
