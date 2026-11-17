process.env.PRUMO_FORMATOS_TODOS = '1';  // testa os formatos escondidos em 17/11 (FT182_ESCONDE), religados só no teste
// Criar (155, 15/11, achados do testador): um caminho só para criar (barra do Feed → caixa; "O que você acha?" → formulário
// da notícia sem a faixa de tipos, voltar → caixa com a notícia); @ sugere amigos na caixa; o texto da caixa não se perde
// (Giro, voltar do celular, reabrir); enquete exige opções; Publicar legível no escuro; sem rede diz por quê e tenta sozinho;
// Giro sem câmera; coluna: apagar rascunho com 2º toque e Desfazer, barra com nomes, "0 palavras"; editorias legíveis;
// "Editar texto" em post só de texto; Feed sem o quadro 4:5 vazio (análise com gráfico, notícia sem foto). Porta 8610.
const U = require('../t_util'); const { ok, sleep, esperar } = U; const path = require('path');
const { montarPasta, PROD } = require('./_qc_comum');
let srv = null;
const ev = (p, fn, a) => p.evaluate(fn, a);
const fecha = p => ev(p, () => { ED = null; closeLayer._ok = true; closeLayer(); closeLayer._ok = false });
// contraste WCAG entre duas cores rgb(...)
const CONTRASTE = ([a, b]) => { const l = s => { const m = String(s).match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2] };
  const x = l(a), y = l(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05) };
(async () => {
  montarPasta('xg155'); srv = U.servir('xg155', 8610); await sleep(800);
  const H = await require('../harness').criar();
  const ids = {}; for (const k of ['a', 'b']) ids[k] = await H.criarConta(k + '@x', '123456');
  await H.sql(`insert into public.membros(uid,nome,papel) values ($1,'Pedro Brandão','admin'),($2,'Bia Souza','membro')`, [ids.a, ids.b]);
  await H.sql(`insert into public.amizades(de,para,status) values ($1,$2,'aceita')`, [ids.a, ids.b]);
  const br = await U.navegador();
  const A = U.erros(await H.pagina(br, { sessao: { user: { id: ids.a, email: 'a@x' } }, viewport: { width: 390, height: 844 }, ctx: { deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: 'dark' } }), 'Pedro');
  await A.addInitScript(PROD); await A.goto('http://localhost:8610/index.html');
  await esperar(A, () => typeof VIEW !== 'undefined' && S.membro && S.amigosOk && PUB.on === true, null, 20000); await sleep(600);
  await ev(A, () => go('feed')); await esperar(A, () => !!document.querySelector('#cn102-bar [data-fc107sug]'), null, 8000);

  // ===== 1. um caminho só =====
  await ev(A, () => document.querySelector('#cn102-bar [data-cn102bar]').click()); await sleep(400);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && !document.querySelector('#layer .ce')), 'o "+" da barra do Feed abre a caixa (e não o antigo "Novo post")');
  ok(await ev(A, () => { const b = document.querySelector('[data-cp152pub]'); const s = getComputedStyle(b); return b.disabled && s.opacity === '1' }), 'Publicar desligado sem transparência');
  const ctr = await ev(A, () => { const s = getComputedStyle(document.querySelector('[data-cp152pub]')); return [s.color, s.backgroundColor] });
  ok(CONTRASTE(ctr) >= 4.5, 'Publicar desligado legível no escuro (contraste ≥ 4,5)', ctr);
  // @ sugere amigos
  await A.click('#cp152-tx'); await A.keyboard.type('Olha isso @Bi'); await sleep(400);
  const men = await ev(A, () => { const b = document.querySelector('.men-box'); if (!b) return null; const r = b.getBoundingClientRect(), t = document.querySelector('#cp152-tx').getBoundingClientRect(), ab = document.querySelector('.cp152-abas').getBoundingClientRect(); return { n: b.querySelectorAll('[data-men]').length, t: b.textContent, abaixo: r.top >= t.bottom - 1, cobreAbas: r.top < ab.bottom } });
  ok(men && men.n === 1 && /Bia Souza/.test(men.t) && men.abaixo && !men.cobreAbas, '@ na caixa sugere a amiga, logo abaixo do texto', men);
  await ev(A, () => document.querySelector('.men-box [data-men]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))); await sleep(200);
  ok(await ev(A, () => CP152.txt === 'Olha isso @Bia Souza ' && !document.querySelector('.men-box')), 'tocar no nome completa a marcação');

  // ===== 2. Giro e volta: o texto fica =====
  await ev(A, () => document.querySelector('[data-cp152aba="giro"]').click()); await sleep(900);
  ok(await ev(A, () => ED && ED.modo === 'story' && getComputedStyle(document.querySelector('#layer .ce-modos')).display === 'none'), 'Giro aberto pela caixa sem o 2º seletor POST/GIRO');
  const cam = await ev(A, () => { const m = document.querySelector('#cam-msg'), r = document.querySelector('#layer .ce-rail'); const vis = s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' };
    return { msg: !!m && !m.hidden, abaixo: !!m && !!r && m.getBoundingClientRect().top >= r.getBoundingClientRect().bottom, shut: vis('#layer .ce-shut'), flash: vis('#layer .ce-flb'), vira: vis('#layer .ce-vira'), gal: vis('#layer .ce-gal') } });
  ok(cam.msg && cam.abaixo && !cam.shut && !cam.flash && !cam.vira && cam.gal, 'Giro sem câmera: aviso abaixo do menu, sem obturador, flash e virar; galeria fica', cam);
  await ev(A, () => document.querySelector('#layer [data-edfechar]').click()); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && document.querySelector('#cp152-tx').value === 'Olha isso @Bia Souza '), '× do giro vazio volta para a caixa com o texto');
  await ev(A, () => document.querySelector('[data-cp152aba="giro"]').click()); await sleep(700);
  await ev(A, () => document.querySelector('#layer [data-edmodo="post"]').click()); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#cp152-tx') && document.querySelector('#cp152-tx').value === 'Olha isso @Bia Souza '), 'POST do giro volta para a caixa com o texto');

  // ===== 3. notícia escolhida: fica na caixa ao voltar =====
  await ev(A, () => document.querySelector('[data-cp152ax="nt"]').click()); await sleep(600);
  const pid0 = await ev(A, () => { const b = document.querySelector('#layer .cn102-ntl [data-edpnt]'); return b && b.dataset.edpnt });
  const cores = await ev(A, () => [...document.querySelectorAll('#layer .cn102-ntl small')].slice(0, 6).map(s => [getComputedStyle(s).color, getComputedStyle(s.closest('.ce-selp')).backgroundColor]));
  ok(cores.length && cores.every(c => CONTRASTE(c) >= 4.5), 'editorias legíveis na lista de notícias (contraste ≥ 4,5)', cores.map(c => CONTRASTE(c).toFixed(1)).join(' '));
  await ev(A, () => document.querySelector('#layer .cn102-ntl [data-edpnt]').click()); await sleep(400);
  ok(await ev(A, () => { const k = document.querySelector('#layer .cn102-ks'); return (!k || k.hidden) && document.querySelector('#layer .ce-ph b').textContent === 'Notícia' }), 'formulário "Notícia", sem a faixa de tipos');
  await ev(A, () => document.querySelector('#layer [data-edvolta]').click()); await sleep(500);
  ok(await ev(A, p => !!document.querySelector('#layer > .cp152 .cr155-nt') && CR155.pid === p && document.querySelector('#cp152-tx').value.trim() === 'Olha isso @Bia Souza', pid0), 'voltar: a caixa mostra a notícia escolhida e o texto');

  // ===== 4. voltar do celular: pergunta antes, e o texto e a notícia voltam ao reabrir =====
  await A.goBack(); await sleep(500);
  ok(await ev(A, () => !!document.querySelector('#layer > .cp152') && /Volte de novo/.test(document.querySelector('.toast')?.textContent || '')), '1º voltar do celular não fecha (avisa)');
  await A.goBack(); await sleep(500);
  ok(await ev(A, () => !document.querySelector('#layer > .cp152') && /guardado/.test(document.querySelector('.toast')?.textContent || '')), '2º voltar fecha e avisa que o texto ficou guardado');
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, p => document.querySelector('#cp152-tx').value.trim() === 'Olha isso @Bia Souza' && CR155.pid === p && !!document.querySelector('.cr155-nt'), pid0), 'reabrir a caixa traz o texto e a notícia');
  // publicar com a notícia
  await ev(A, () => document.querySelector('[data-cp152pub]').click());
  ok(await esperar(A, p => PUB.itens.some(x => x.autor === S.uid && x.pid === p && x.texto === 'Olha isso @Bia Souza' && x.estilo && x.estilo.cn && x.estilo.cn.k === 'nt'), pid0, 8000), 'Publicar da caixa com a notícia sai como notícia comentada');
  await sleep(800); await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => document.querySelector('#cp152-tx').value === '' && !CR155.pid), 'depois de publicar, a caixa começa vazia');
  // Descartar limpa o guardado
  await A.fill('#cp152-tx', 'Vou desistir'); await sleep(400); await ev(A, () => document.querySelector('[data-cp152x]').click()); await sleep(100); await ev(A, () => document.querySelector('[data-cp152x]').click()); await sleep(300);
  await ev(A, () => criarMenu()); await sleep(400);
  ok(await ev(A, () => document.querySelector('#cp152-tx').value === ''), '"Descartar?" apaga o texto guardado');
  await fecha(A); await sleep(300);

  // ===== 5. "O que você acha?" =====
  const sug = await ev(A, () => document.querySelector('#cn102-bar [data-fc107sug]').dataset.fc107sug);
  await ev(A, () => document.querySelector('#cn102-bar [data-fc107sug]').click()); await sleep(700);
  ok(await ev(A, p => ED && ED.po.cn && ED.po.cn.k === 'nt' && ED.po.pid === p && document.querySelector('#layer .cn102-ks').hidden, sug), '"O que você acha?" abre a notícia já escolhida, sem a faixa de tipos');
  await ev(A, () => document.querySelector('#layer [data-edvolta]').click()); await sleep(500);
  ok(await ev(A, p => !!document.querySelector('#layer > .cp152 .cr155-nt') && CR155.pid === p, sug), 'voltar de "O que você acha?" leva à caixa, com a notícia (e não à tela antiga)');
  await ev(A, () => document.querySelector('[data-cr155ntx]').click()); await sleep(200);
  ok(await ev(A, () => !document.querySelector('.cr155-nt') && !CR155.pid && document.querySelector('[data-cp152pub]').disabled), '× tira a notícia da caixa');

  // ===== 6. enquete: as opções são da pessoa =====
  await A.fill('#cp152-tx', 'Qual a melhor?'); await ev(A, () => document.querySelector('[data-cp152ax="enq"]').click()); await sleep(500);
  ok(await ev(A, () => [...document.querySelectorAll('#layer [data-cn102o]')].map(i => i.placeholder).join('|') === 'Opção 1|Opção 2'), 'enquete: campos "Opção 1" e "Opção 2"');
  const n0 = await ev(A, () => PUB.itens.length);
  await ev(A, () => document.querySelector('#layer [data-edpubpo]').click()); await sleep(600);
  ok(await ev(A, n => PUB.itens.length === n && !!document.querySelector('#layer .ce') && /opções/.test(document.querySelector('#layer .cr166-er')?.textContent || ''), n0), 'enquete sem opções não publica Sim/Não inventados; pede as opções');
  await fecha(A); await sleep(300); await ev(A, () => { try { localStorage.removeItem(cr155K()) } catch (e) { } });

  // ===== 7. sem rede =====
  await ev(A, () => { window.__on = true; Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => window.__on !== false }); const o0 = window.__sb; window.__sb = function () { if (window.__on === false) return Promise.reject(new TypeError('Failed to fetch')); return o0.apply(this, arguments) } });
  await ev(A, () => { window.__on = false; criarMenu() }); await sleep(300); await A.fill('#cp152-tx', 'Texto escrito sem internet nenhuma');
  await ev(A, () => document.querySelector('[data-cp152pub]').click());
  await esperar(A, () => !!document.querySelector('#pq .pq-row.erro'), null, 8000); await sleep(300);
  ok(await ev(A, () => { const t = document.querySelector('#pq .pq-row.erro').textContent; return /Sem conexão/.test(t) && /Texto escrito sem internet/.test(t) && !!document.querySelector('#pq [data-pqdesc]') }), 'sem rede: diz "Sem conexão", mostra o começo do post e mantém Descartar');
  await ev(A, () => { window.__on = true; dispatchEvent(new Event('online')) });
  ok(await esperar(A, () => PUB.itens.some(x => x.texto === 'Texto escrito sem internet nenhuma') && !document.querySelector('#pq .pq-row.erro'), null, 10000), 'a internet volta: publica sozinho');

  // ===== 8. Feed: sem o quadro 4:5 vazio =====
  await sleep(1200); await ev(A, () => criarMenu()); await sleep(300); await A.fill('#cp152-tx', 'O dólar subiu de novo');
  await ev(A, () => document.querySelector('[data-cp152ax="ana"]').click()); await sleep(800); await ev(A, () => document.querySelector('#layer [data-cn102dok]')?.click()); await sleep(400);
  await ev(A, () => document.querySelector('#layer [data-edpubpo]').click());
  await esperar(A, () => PUB.itens.some(x => x.texto && /dólar subiu/.test(x.texto)), null, 8000); await sleep(1500);
  await ev(A, () => go('me')); await sleep(1200);
  const fd = await ev(A, () => PUB.itens.filter(x => x.autor === S.uid && (x.pid || /dólar/.test(x.texto || ''))).map(x => { const el = document.getElementById('p-u:' + x.id); const sl = el && el.querySelector('.track > .sl'); if (!sl) return { id: x.id, sem: 1 };
    el.scrollIntoView(); const r = sl.getBoundingClientRect(), c = sl.firstElementChild.getBoundingClientRect(); return { auto: el.classList.contains('cr155-auto'), h: Math.round(r.height), w: Math.round(r.width), sobra: Math.round(r.height - c.height) } }));
  ok(fd.length >= 2 && fd.every(f => f.auto && f.h < f.w * 1.15 && f.sobra < 40), 'análise com gráfico e post com notícia: cartão do tamanho do conteúdo', fd);
  await U.foto(A, 'criar1511-perfil');

  // ===== 9. post só de texto: "Editar texto" =====
  const tid = await ev(A, () => PUB.itens.find(x => x.autor === S.uid && x.texto === 'Texto escrito sem internet nenhuma').id);
  await ev(A, id => document.querySelector(`[data-umenu="${id}"]`).click(), tid); await sleep(400);
  ok(await ev(A, () => { const b = document.querySelector('.sheet [data-ueditar]'); return b && /^Editar texto/.test(b.textContent) }), 'menu do post só de texto: "Editar texto"');
  await ev(A, () => document.querySelector('.sheet [data-ueditar]').click()); await sleep(700);
  ok(await ev(A, () => /^Editar texto/.test(document.querySelector('.sheet .sh-h').textContent) && /Continuar em outra parte/.test(document.querySelector('.sheet').textContent) && /como um fio/.test(document.querySelector('.sheet').textContent)), 'folha "Editar texto" com "Continuar em outra parte" explicado');
  await ev(A, () => closeLayer()); await sleep(300);

  // ===== 10. coluna =====
  await ev(A, () => { localStorage.setItem(ed132RK(), JSON.stringify([{ rid: 'cr155abc', at: Date.now(), tit: 'Coluna de horas', html: '<p>muito trabalho</p>', pal: 2 }])) });
  await ev(A, () => criarMenu()); await sleep(300); await ev(A, () => document.querySelector('[data-cp152aba="coluna"]').click()); await sleep(300);
  await ev(A, () => document.querySelector('[data-cp152rasc]').click()); await sleep(700);
  ok(await ev(A, () => { const b = document.querySelector('#layer .ed132-bar [data-ed132cmd="h3"]'); const h2 = document.querySelector('#layer .ed132-bar [data-ed132cmd="h2"]'); return b && h2 && b.dataset.cr155n === 'Subtítulo' && h2.dataset.cr155n === 'Título' && getComputedStyle(b, '::after').content.includes('Subtítulo') }), 'barra da coluna: "Título" e "Subtítulo" escritos');
  await ev(A, () => { ED132.E.salvou = true; ed132Mais() }); await sleep(300);
  await ev(A, () => document.querySelector('[data-cr155rapaga]').click()); await sleep(200);
  ok(await ev(A, () => ed132RascLe().some(r => r.rid === 'cr155abc') && /Toque de novo/.test(document.querySelector('[data-cr155rapaga]').textContent) && /Coluna de horas/.test(document.querySelector('[data-cr155rapaga]').textContent)), 'apagar rascunho: 1º toque só pergunta (com o título)');
  await ev(A, () => document.querySelector('[data-cr155rapaga]').click()); await sleep(300);
  ok(await ev(A, () => !ed132RascLe().some(r => r.rid === 'cr155abc') && !!document.querySelector('.toast .toast-a')), '2º toque apaga, com "Desfazer" no aviso');
  await ev(A, () => document.querySelector('.toast .toast-a').click()); await sleep(300);
  ok(await ev(A, () => ed132RascLe().some(r => r.rid === 'cr155abc' && r.tit === 'Coluna de horas')), '"Desfazer" traz o rascunho de volta');
  await fecha(A); await sleep(300);
  await ev(A, () => criarMenu()); await sleep(300); await ev(A, () => document.querySelector('[data-cp152aba="coluna"]').click()); await ev(A, () => document.querySelector('[data-cp152nova]').click()); await sleep(900);
  ok(await ev(A, () => { const k = document.querySelector('#layer .cr137-ct'); return !k || k.hidden || k.textContent === '0 palavras' || !/1 min/.test(k.textContent) }), 'coluna vazia: "0 palavras", sem "1 min"', await ev(A, () => document.querySelector('#layer .cr137-ct')?.textContent));
  await fecha(A);

  ok(!A._erros.length, 'sem erros ' + A._erros.join('|'));
  await br.close(); srv.kill(); require('fs').rmSync(path.join(__dirname, '..', 'xg155'), { recursive: true, force: true });
  const R = U.resumo(); console.log(`\nRESUMO t_criar_1511: ${R.OKS} ok, ${R.FALHAS} falhas`); process.exit(R.FALHAS ? 1 : 0);
})().catch(e => { console.error(e); try { srv && srv.kill() } catch (_) { } process.exit(2) });
