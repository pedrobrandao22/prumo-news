// Apoio dos testes: servidor local, navegador, usuários pelo harness, capturas e checagens.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const AQUI = __dirname;
const EXE_PADRAO = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';  // o Chromium desta máquina; em outra, use PRUMO_CHROMIUM ou o do próprio Playwright
const EXE = process.env.PRUMO_CHROMIUM || (fs.existsSync(EXE_PADRAO) ? EXE_PADRAO : undefined);
const SHOTS = path.join(AQUI, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

function servir(pasta, porta) {
  const p = spawn('python3', ['-m', 'http.server', String(porta)], { cwd: path.join(AQUI, pasta), stdio: 'ignore' });
  SERVIDORES.push(p); return p;
}
// servidores filhos morrem junto com o teste (erro, process.exit ou o "timeout" do testar.sh): senão a porta fica presa e o teste seguinte que usa a mesma porta cai com EADDRINUSE
const SERVIDORES = [];
const matarServidores = () => { for (const s of SERVIDORES) { try { if (s.exitCode === null && !s.killed) s.kill() } catch (e) {} } };
process.on('exit', matarServidores);
for (const sinal of ['SIGTERM', 'SIGINT', 'SIGHUP']) process.once(sinal, () => { matarServidores(); process.exit(128 + ({ SIGTERM: 15, SIGINT: 2, SIGHUP: 1 })[sinal]) });
// feed de teste com horário "agora" (para não aparecer o aviso de atraso nas capturas)
function feedFresco(pasta) {
  const f = JSON.parse(fs.readFileSync(path.join(AQUI, 'app', 'feed.json'), 'utf8'));
  const d = new Date(Date.now() - 12 * 60000);
  const sp = new Date(d.getTime() - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
  f.atualizado_em = sp;
  const hh = sp.slice(11, 13) + 'h' + sp.slice(14, 16);
  f.edicao = f.edicao.replace(/\d{2}h\d{2}/, hh);
  fs.writeFileSync(path.join(AQUI, pasta, 'feed.json'), JSON.stringify(f));
  return f;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
let FALHAS = 0, OKS = 0;
const RES = [];
function ok(cond, nome, extra) {
  if (cond) { OKS++; RES.push('ok   ' + nome); console.log('ok   ' + nome) }
  else { FALHAS++; RES.push('FAIL ' + nome + (extra ? ' :: ' + extra : '')); console.log('FAIL ' + nome + (extra ? ' :: ' + JSON.stringify(extra).slice(0, 300) : '')) }
}
function erros(page, nome) {
  page._erros = [];
  page.on('console', m => { if (/^DBG/.test(m.text())) console.log(m.text()) }); page.on('pageerror', e => { page._erros.push(e.message); console.log('PAGEERROR[' + nome + ']', e.message) });
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|fonts\.g|Viewport argument key/.test(m.text())) { page._erros.push('console: ' + m.text()); console.log('CONSOLE[' + nome + ']', m.text()) } });
  return page;
}
async function foto(page, nome) { await sleep(250); await page.screenshot({ path: path.join(SHOTS, nome + '.png') }); }
async function navegador(o) { return chromium.launch({ executablePath: EXE, ...(o || {}) }); }
async function esperar(page, fn, arg, ms = 5000) {
  try { await page.waitForFunction(fn, arg, { timeout: ms, polling: 100 }); return true } catch (e) { return false }
}
const REPO = process.env.PRUMO_REPO || path.resolve(AQUI, '..');  // raiz do repositório do site (fonte/ fica dentro dele)
module.exports = { REPO, servir, feedFresco, sleep, ok, erros, foto, navegador, esperar, SHOTS, resumo: () => ({ OKS, FALHAS, RES }) };
