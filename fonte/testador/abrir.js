/* Testador do Prumo: abre o site real num celular simulado (Playwright), como leitor ou com a conta de teste.
   A conta de teste vem das variáveis PRUMO_TESTE_EMAIL e PRUMO_TESTE_SENHA (nunca escritas no repositório).
   Uso: const { abrir, entrar, fotos, apagarTestes } = require('./abrir'); */
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.PRUMO_URL || 'https://prumonews.com.br/';
const SAIDA = process.env.PRUMO_SAIDA || path.join(__dirname, 'saida');
fs.mkdirSync(SAIDA, { recursive: true });
async function abrir(o = {}) {
  const b = o.b || await chromium.launch();
  const ctx = await b.newContext({ ...devices[o.dev || 'iPhone 13'], colorScheme: o.escuro ? 'dark' : 'light', ...(o.ctx || {}) });
  const p = await ctx.newPage(); p._erros = [];
  /* sem isto o app acha que é robô e abre direto no Feed (gente de verdade abre na Capa) */
  await p.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }));
  p.on('pageerror', e => p._erros.push('erro JS: ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error') p._erros.push('console: ' + m.text().slice(0, 200)) });
  p.on('response', r => { if (r.status() >= 400) p._erros.push('HTTP ' + r.status() + ' ' + r.url().slice(0, 140)) });
  await p.goto(URL + (o.q || ''), { waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => typeof FEED !== 'undefined' && FEED && FEED.pautas, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  return { b, ctx, p };
}
async function entrar(p) {
  const em = process.env.PRUMO_TESTE_EMAIL, pw = process.env.PRUMO_TESTE_SENHA;
  if (!em || !pw) throw new Error('faltam PRUMO_TESTE_EMAIL / PRUMO_TESTE_SENHA');
  await p.evaluate(() => { try { closeLayer(); closeLayer() } catch (e) { } abrirLogin('entrar') }); await p.waitForTimeout(800);
  await p.fill('#lemail', em); await p.fill('#lsenha', pw); await p.click('#lform [type=submit]');
  await p.waitForFunction(() => S.uid && S.membro, null, { timeout: 25000 }); await p.waitForTimeout(2000);
  await p.evaluate(() => { try { closeLayer(); closeLayer() } catch (e) { } });
}
const foto = (p, nome) => p.screenshot({ path: path.join(SAIDA, nome + '.png') });
/* apaga o que a conta de teste publicou com "Teste do testador" no texto */
async function apagarTestes(p) {
  return p.evaluate(async () => { const l = (PUB.itens || []).filter(x => x.autor === S.uid && /Teste do testador/.test(JSON.stringify([x.texto, x.estilo]))); let n = 0;
    for (const x of l) { try { if (await pubApagar(x.id, true)) n++ } catch (e) { } } return n });
}
module.exports = { abrir, entrar, foto, apagarTestes, URL, SAIDA };
