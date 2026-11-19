/* 161 (corretor 16/11): a ilustração "genérica" era sempre o Congresso Nacional, em qualquer notícia (China, voos
   nos EUA, Nvidia, fundo de florestas…). Agora o desenho segue o assunto (rótulo + texto alternativo): futebol,
   avião, floresta/clima, tecnologia, mundo; o Congresso fica só para Brasília/governo/Congresso; sem pista, um
   desenho neutro de jornal, sem prédio nenhum. */
const gen161Congresso=ILL.generica;
function gen161Tema(d){
  const t=String((d&&d.rotulo)||"")+" "+String((d&&d._alt)||"");
  const r=t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  if(/futebol|\bbola\b|gramado|brasileirao|serie [ab]\b|selecao|sul-americana|libertadores|copa do|rodada|amistoso|playoff/.test(r))return "bola";
  if(/aviao|\bvoos?\b|decolag|aeroport|viagem|aereo/.test(r))return "aviao";
  if(/floresta|clima|\bcop\s?\d|ambient|desmat|amazonia|folhas/.test(r))return "floresta";
  if(/tecnolog|servidor|\bchips?\b|nvidia|microsoft|big tech|digita|internet|\bia\b|intelig.ncia artificial|software|apple|google|meta\b/.test(r))return "tec";
  if(/cupula|bandeira|china|\beua\b|estados unidos|russia|mundo|globo|internacional|guerra|otan|\bonu\b|apec|g20|europa/.test(r))return "mundo";
  if(/congresso|camara|senado|planalto|esplanada|ministerio|brasilia|governo|stf|plenario|deputad|senador/.test(r))return "congresso";
  return "neutro";
}
function gen161Cena(tema,d){
  const rot=()=>d.rotulo?chip(16,12,d.rotulo,"ii","ic"):"";
  let s="";
  if(tema==="bola"){
    s+=`<rect class="ia" x="0" y="150" width="400" height="90" opacity=".9"/>`;
    for(let i=0;i<8;i++)s+=`<rect class="ic" x="${i*50}" y="150" width="25" height="90" opacity=".07"/>`;
    s+=`<path class="nf sc" stroke-width="2.5" opacity=".8" d="M0 196 H400 M200 150 V240"/>`;
    s+=`<circle class="ic" cx="200" cy="132" r="44"/><circle class="nf si" stroke-width="2.5" cx="200" cy="132" r="44"/>`;
    s+=`<polygon class="ii" points="200,112 218,125 211,146 189,146 182,125"/>`;
    s+=`<path class="nf si" stroke-width="2.5" d="M200 112 V90 M218 125 L240 118 M211 146 L224 166 M189 146 L176 166 M182 125 L160 118"/>`;
    return s+rot();
  }
  if(tema==="aviao"){
    for(let i=0;i<30;i++){const x=(i*97)%400,y=(i*53)%240;s+=`<circle class="im" cx="${x}" cy="${y}" r="1.4" opacity=".6"/>`}
    s+=`<circle class="ic" cx="200" cy="176" r="110"/><circle class="nf sm" stroke-width="2" cx="200" cy="176" r="110"/>`;
    [40,76].forEach(rx=>{s+=`<ellipse class="nf sm" stroke-width="1.5" cx="200" cy="176" rx="${rx}" ry="110"/>`});
    s+=`<path class="nf sy" stroke-width="2.5" stroke-dasharray="6 7" d="M60 150 Q150 40 300 78"/>`;
    s+=`<g transform="translate(300 78) rotate(-18)"><path class="ii" d="M-34 -4 H22 Q34 -4 36 0 Q34 4 22 4 H-34z"/><path class="ii" d="M-4 -3 L-18 -30 H-8 L14 -3z M-4 3 L-18 30 H-8 L14 3z"/><path class="ii" d="M-30 -3 L-38 -16 H-32 L-22 -3z M-30 3 L-38 16 H-32 L-22 3z"/></g>`;
    return s+rot();
  }
  if(tema==="floresta"){
    s+=`<rect class="id" x="0" y="196" width="400" height="44"/>`;
    [[60,196,46],[110,196,62],[166,196,52],[232,196,66],[292,196,50],[346,196,58]].forEach(([x,y,h],i)=>{
      s+=`<rect class="ii" x="${x-3}" y="${y-14}" width="6" height="14"/><polygon class="${i%2?"ia":"im"}" points="${x-h*0.42},${y-12} ${x},${y-12-h*1.6} ${x+h*0.42},${y-12}"/>`});
    [[300,70],[324,84],[348,70]].forEach(([x,y])=>{s+=`<circle class="iy" cx="${x}" cy="${y}" r="15"/><circle class="nf si" stroke-width="1.5" cx="${x}" cy="${y}" r="10"/>`});
    return s+rot();
  }
  if(tema==="tec"){
    s+=`<rect class="id" x="0" y="206" width="400" height="34"/>`;
    [[70,"im"],[150,"ii"],[230,"im"]].forEach(([x,c])=>{s+=`<rect class="${c}" x="${x}" y="70" width="64" height="136" rx="4"/>`;
      for(let k=0;k<5;k++)s+=`<rect class="ic" x="${x+8}" y="${82+k*24}" width="48" height="14" rx="2" opacity=".85"/><circle class="iy" cx="${x+50}" cy="${89+k*24}" r="2.5"/>`});
    s+=`<rect class="ia" x="316" y="96" width="56" height="56" rx="6"/><rect class="ii" x="330" y="110" width="28" height="28" rx="3"/>`;
    for(let k=0;k<4;k++){const o=104+k*12;s+=`<rect class="ia" x="${o+212}" y="86" width="4" height="10"/><rect class="ia" x="${o+212}" y="152" width="4" height="10"/>`}
    return s+rot();
  }
  if(tema==="mundo")return ILL.globo({rotulo:d.rotulo});
  if(tema==="congresso")return gen161Congresso(d);
  /* neutro: folhas de jornal empilhadas, com a cor da editoria */
  s+=`<rect class="id" x="0" y="204" width="400" height="36"/>`;
  s+=`<rect class="im" x="118" y="58" width="190" height="140" rx="4" transform="rotate(-5 213 128)"/>`;
  s+=`<rect class="ic" x="104" y="52" width="192" height="146" rx="4"/><rect class="nf sm" stroke-width="1.5" x="104" y="52" width="192" height="146" rx="4"/>`;
  s+=`<rect class="ia" x="120" y="68" width="160" height="16" rx="2"/>`;
  s+=`<rect class="im" x="120" y="94" width="74" height="54" rx="2"/>`;
  for(let k=0;k<6;k++)s+=`<rect class="im" x="204" y="${96+k*9}" width="76" height="4" rx="2" opacity=".8"/>`;
  for(let k=0;k<4;k++)s+=`<rect class="im" x="120" y="${160+k*9}" width="160" height="4" rx="2" opacity=".8"/>`;
  return s+rot();
}
ILL.generica=function(d){d=d||{};return gen161Cena(gen161Tema(d),d)};
/* o texto alternativo da pauta ajuda a escolher o desenho */
const gen161SceneOf=sceneOf;
sceneOf=function(img){
  if(img&&(img.modelo==="generica"||!ILL[img.modelo])&&img.alt){
    try{return ILL.generica(Object.assign({},img.dados||{},{_alt:img.alt}))}catch(e){}
  }
  return gen161SceneOf(img);
};

/* 19/11 (testador): quando o desenho cai no jornal neutro, o texto alternativo diz isso, em vez de descrever um barco ou
   postes que não estão no desenho */
function illAlt(img){const a=img&&img.alt||"Ilustração";try{if(img&&(img.modelo==="generica"||!ILL[img.modelo])&&gen161Tema(Object.assign({},img.dados||{},{_alt:img.alt}))==="neutro")return "Ilustração: jornal (sem foto desta notícia)"}catch(e){}return a}
