// Corretor 20/11: retrato em pé ou pequeno no alto da matéria (js/210 ct210Foto + css/89). A correção de 19/11 deixava a
// foto nítida com position:relative, que a empurrava para baixo do quadro (só o fundo borrado aparecia). Agora a foto
// nítida fica dentro do quadro, inteira (contain), sobre o fundo borrado. Classe: retrato em pé, foto pequena deitada e
// foto grande deitada (esta continua cobrindo o quadro, sem fundo). Porta 9420.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const fs = require('fs'), path = require('path');
const PORTA = 9420, BASE = `http://localhost:${PORTA}/index.html`;
(async () => {
  U.feedFresco('site'); const srv = U.servir('site', PORTA); await sleep(800);
  const b = await U.navegador();
  for (const vp of [{ width: 412, height: 915 }, { width: 320, height: 568 }, { width: 900, height: 700 }]) {
    const ctx = await b.newContext({ viewport: vp, isMobile: vp.width < 600, hasTouch: true });
    const P = U.erros(await ctx.newPage(), 'P'); await P.goto(BASE);
    await esperar(P, () => window.FEED && FEED.pautas && FEED.pautas.length && document.querySelector('#v-capa .cp'), null, 10000);
    const casos = [['retrato 354×472', 354, 472, true], ['pequena deitada 500×300', 500, 300, true], ['grande deitada 1200×800', 1200, 800, false]];
    for (const [nome, w, h, ret] of casos) {
      const r = await P.evaluate(async ([w, h]) => {
        const x = FEED.pautas.find(p => p.neutro); abrirMateria(x.id); await new Promise(r => setTimeout(r, 400));
        const a = document.querySelector('#layer .mat-arte'); if (!a) return 'sem mat-arte';
        // quadro de foto como o app monta (span.art.paper.foto > .ill + img, como capaArte), com uma imagem do tamanho pedido
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
        g.fillStyle = '#c33'; g.fillRect(0, 0, w, h); g.fillStyle = '#3c3'; g.fillRect(0, 0, w, 20); g.fillRect(0, h - 20, w, 20);
        a.innerHTML = '<span class="art paper foto" data-sec="politica"><span class="ill"><svg viewBox="0 0 400 240"></svg></span><img alt="" loading="eager"></span>';
        const img = a.querySelector('img'); await new Promise(res => { img.onload = () => setTimeout(res, 50); img.src = cv.toDataURL() });
        await new Promise(r => setTimeout(r, 300));
        const c = a.querySelector('.paper.foto'), n = c.querySelector('img:not(.ct210-fd)'), fd = c.querySelector('.ct210-fd');
        const R = e => e.getBoundingClientRect(); const q = R(c), ni = R(n), cs = getComputedStyle(n);
        // área desenhada da foto nítida (contain ou cover)
        const k = cs.objectFit === 'contain' ? Math.min(ni.width / w, ni.height / h) : Math.max(ni.width / w, ni.height / h);
        const dw = w * k, dh = h * k;
        return { ret: c.classList.contains('ct210-ret'), fd: !!fd, dentro: ni.top >= q.top - 1 && ni.bottom <= q.bottom + 1 && ni.left >= q.left - 1 && ni.right <= q.right + 1,
          alturaQuadro: Math.round(q.height), alturaFoto: Math.round(ni.height), inteira: dw <= ni.width + 1 && dh <= ni.height + 1, fit: cs.objectFit,
          visivel: (() => { const e = document.elementFromPoint(ni.left + ni.width / 2, ni.top + ni.height / 2); return e === n })() };
      }, [w, h]);
      const tag = `${vp.width}px ${nome}`;
      if (typeof r === 'string') { ok(false, tag + ': ' + r); continue }
      ok(r.dentro && r.alturaFoto >= r.alturaQuadro - 2, `${tag}: foto nítida dentro do quadro e da altura dele`, r);
      ok(r.visivel, `${tag}: a foto nítida é o que aparece no meio do quadro`, r);
      if (ret) ok(r.ret && r.fd && r.inteira, `${tag}: aparece inteira (sem cortar testa e queixo) sobre o fundo borrado`, r);
      else ok(!r.ret && !r.fd && r.fit === 'cover', `${tag}: foto grande deitada continua cobrindo o quadro, sem fundo`, r);
    }
    await ctx.close();
  }
  const css = fs.readFileSync(path.join(__dirname, '..', 'app/src/css/89-correcoes-tarde.css'), 'utf8');
  ok(!/ct210-ret>img:not\(\.ct210-fd\)\{[^}]*position:relative/.test(css), 'css/89: foto nítida do retrato sem position:relative');
  await b.close(); srv.close && srv.close(); const s = U.resumo(); console.log(`${s.OKS} ok, ${s.FALHAS} falhas`); process.exit(s.FALHAS ? 1 : 0);
})();
