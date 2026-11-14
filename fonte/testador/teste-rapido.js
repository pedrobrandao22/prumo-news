const { abrir, entrar, foto } = require('./abrir');
(async () => { const { b, p } = await abrir(); await foto(p, 'capa'); await entrar(p);
  console.log('entrou:', await p.evaluate(() => ({ uid: !!S.uid, membro: !!S.membro, view: VIEW })), 'erros:', p._erros); await b.close() })();
