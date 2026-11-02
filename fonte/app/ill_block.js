/* ---------- ilustrações genéricas (sem pessoas reais, sem logotipos) ---------- */
const T=(x,y,s,txt,cls="ii",anchor="start",w=500)=>`<text class="t ${cls}" x="${x}" y="${y}" font-size="${s}" font-weight="${w}" text-anchor="${anchor}">${esc(txt)}</text>`;
const chip=(x,y,txt,cls="ii",tcls="ic")=>{const w=txt.length*6.6+18;return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="20" rx="10"/>${T(x+w/2,y+14,10.5,txt,tcls,"middle",600)}`};
const person=(x,y,s,cls)=>`<circle class="${cls}" cx="${x}" cy="${y}" r="${5*s}"/><path class="${cls}" d="M${x-9*s} ${y+18*s} q0 -11 ${9*s} -11 q${9*s} 0 ${9*s} 11z"/>`;

const ILL={
plenario(d){
  const rows=[[72,11],[92,14],[112,16],[132,19],[152,21]],pts=[];
  rows.forEach(([r,n])=>{for(let i=0;i<n;i++){const a=Math.PI-(Math.PI*i/(n-1));pts.push([200+r*Math.cos(a),206-r*Math.sin(a),a])}});
  pts.sort((p,q)=>q[2]-p[2]);
  const total=d.total||81,on=Math.min(d.destaque||0,pts.length);
  let s=`<rect class="id" x="0" y="206" width="400" height="34"/>`;
  rows.forEach(([r])=>{s+=`<path class="nf sm" stroke-width="1" opacity=".5" d="M${200-r-9} 206 A${r+9} ${r+9} 0 0 1 ${200+r+9} 206"/>`});
  s+=pts.map((p,i)=>{const x=p[0].toFixed(1),y=p[1].toFixed(1);return `<rect class="${i<on?"ia":"im"}" x="${(p[0]-4.5).toFixed(1)}" y="${(p[1]-3.5).toFixed(1)}" width="9" height="7" rx="2.5"/>`}).join("");
  s+=`<rect class="ii" x="160" y="196" width="80" height="10" rx="2"/><rect class="iy" x="194" y="190" width="12" height="6" rx="1"/>`;
  s+=T(200,168,40,on,"ii","middle",700)+T(200,186,11,`de ${total} votos`,"ii","middle",500);
  s+=T(16,26,11,d.rotulo||"PLENÁRIO","ii","start",600);
  if(d.legenda)s+=`<rect class="ia" x="16" y="219" width="10" height="7" rx="2"/>`+T(32,226,11,d.legenda,"ii","start",500);
  return s},
debate(d){
  let s=`<rect class="ii" x="0" y="0" width="400" height="240" opacity=".08"/>`;
  s+=`<rect class="ic" x="96" y="26" width="208" height="70" rx="6"/><rect class="ia" x="96" y="26" width="208" height="16" rx="6"/><rect class="ia" x="96" y="34" width="208" height="8"/>`;
  s+=T(200,74,13,d.rotulo||"DEBATE","ii","middle",700);
  s+=`<path class="iy" opacity=".22" d="M120 0 L80 182 L176 182 L136 0z"/><path class="iy" opacity=".22" d="M264 0 L224 182 L320 182 L280 0z"/>`;
  s+=`<rect class="id" x="0" y="176" width="400" height="64"/><rect class="im" x="0" y="176" width="400" height="4"/>`;
  [128,272].forEach(x=>{s+=`<path class="ii" d="M${x-26} 118 h52 l-6 60 h-40z"/><rect class="ia" x="${x-30}" y="112" width="60" height="9" rx="2"/><path class="nf si" stroke-width="2.5" stroke-linecap="round" d="M${x+6} 112 q2 -14 10 -18"/><rect class="ii" x="${x+12}" y="86" width="8" height="12" rx="4"/><ellipse class="iy" cx="${x}" cy="182" rx="40" ry="5" opacity=".5"/>`});
  for(let i=0;i<14;i++){const x=12+i*29,y=222+(i%2)*6;s+=`<circle class="ii" cx="${x}" cy="${y}" r="10"/><rect class="ii" x="${x-15}" y="${y+8}" width="30" height="20" rx="10"/>`}
  return s},
celular(d){
  let s="";
  for(let i=0;i<9;i++)for(let j=0;j<5;j++)s+=`<circle class="im" cx="${18+i*24}" cy="${22+j*48}" r="1.6" opacity=".7"/>`;
  s+=`<rect class="ii" x="118" y="14" width="112" height="212" rx="18"/><rect class="ic" x="126" y="32" width="96" height="182" rx="6"/><rect class="ii" x="160" y="20" width="28" height="5" rx="2.5"/>`;
  s+=`<rect class="ia" x="126" y="32" width="96" height="24" rx="6"/><rect class="ia" x="126" y="46" width="96" height="10"/><circle class="ic" cx="140" cy="44" r="6"/><rect class="ic" x="151" y="40" width="40" height="5" rx="2"/>`;
  [[134,66,58,"ia"],[150,92,64,"im"],[134,118,50,"ia"],[160,144,54,"im"],[134,170,62,"ia"]].forEach(([x,y,w,c])=>{s+=`<rect class="${c}" x="${x}" y="${y}" width="${w}" height="18" rx="7" opacity="${c==="ia"?".3":".55"}"/>`});
  s+=`<rect class="ic" x="126" y="32" width="96" height="182" rx="6" opacity=".55"/>`;
  s+=`<circle class="iy" cx="174" cy="124" r="24"/><rect class="ii" x="164" y="112" width="7" height="24" rx="2"/><rect class="ii" x="177" y="112" width="7" height="24" rx="2"/>`;
  s+=`<circle class="ic sa" stroke-width="5" cx="310" cy="112" r="50"/><path class="nf sy" stroke-width="5" stroke-linecap="round" d="M310 62 A50 50 0 0 1 360 112"/><rect class="ii" x="303" y="52" width="14" height="8" rx="2"/>`;
  s+=T(310,118,(d.contador||"").length>4?17:26,d.contador||"","ii","middle",700);
  s+=chip(248,184,d.status||"Canal pausado","ii","ic");
  return s},
remocao(d){
  let s="";
  [[40,-5,"ia"],[214,4,"iy"]].forEach(([x,rot,c])=>{
    s+=`<g transform="rotate(${rot} ${x+73} 128)"><rect class="ic sm" stroke-width="2" x="${x}" y="40" width="146" height="170" rx="10"/><circle class="${c}" cx="${x+20}" cy="60" r="9"/><rect class="im" x="${x+34}" y="54" width="60" height="6" rx="3"/><rect class="im" x="${x+34}" y="64" width="38" height="5" rx="2.5" opacity=".7"/>
    <rect class="id" x="${x+12}" y="80" width="122" height="78" rx="4"/><path class="ic" d="M${x+66} 106 l18 13 l-18 13z"/>
    <rect class="im" x="${x+12}" y="168" width="110" height="6" rx="3"/><rect class="im" x="${x+12}" y="180" width="80" height="6" rx="3"/>
    <rect class="ic" x="${x}" y="40" width="146" height="170" rx="10" opacity=".35"/>
    <circle class="ii" cx="${x+130}" cy="196" r="17"/><path class="nf sc" stroke-width="4" stroke-linecap="round" d="M${x+123} 189 l14 14 M${x+137} 189 l-14 14"/></g>`});
  s+=chip(16,12,d.rotulo||"Remover","ii","ic");
  return s},
tribunal(d){
  let s=`<rect class="id" x="0" y="200" width="400" height="40"/>`;
  s+=`<polygon class="ii" points="70,74 200,24 330,74"/><rect class="ii" x="64" y="74" width="272" height="12"/>`;
  for(let i=0;i<7;i++){const x=88+i*37;s+=`<rect class="im" x="${x-7}" y="90" width="14" height="96"/><rect class="ii" x="${x-10}" y="86" width="20" height="5"/><rect class="ii" x="${x-10}" y="184" width="20" height="5"/>`}
  s+=`<rect class="ii" x="56" y="189" width="288" height="11"/><rect class="ii" x="44" y="200" width="312" height="8"/>`;
  s+=T(200,64,12,d.rotulo||"TRIBUNAL","ic","middle",700);
  return s},
investigacao(d){
  let s=`<rect class="id" x="0" y="196" width="400" height="44"/>`;
  s+=`<path class="iy" d="M40 70 h70 l12 12 h120 v120 h-202z" opacity=".9"/><rect class="ic sm" stroke-width="2" x="58" y="56" width="150" height="130" rx="3" transform="rotate(-6 133 121)"/>`;
  s+=`<rect class="ic sm" stroke-width="2" x="78" y="46" width="150" height="140" rx="3"/>`;
  [64,78,92,106,120,134,148].forEach((y,i)=>{s+=`<rect class="${i===2||i===5?"ii":"im"}" x="92" y="${y}" width="${i%3===2?84:118}" height="6" rx="3" opacity="${i===2||i===5?".85":"1"}"/>`});
  s+=`<g transform="rotate(-12 170 166)"><rect class="nf sy" stroke-width="3" x="112" y="152" width="118" height="28" rx="3"/>${T(171,171,12,d.carimbo||"SIGILOSO","iy","middle",700)}</g>`;
  s+=`<circle class="ic sa" stroke-width="10" cx="296" cy="102" r="46" opacity=".9"/><circle class="nf si" stroke-width="2" cx="296" cy="102" r="52"/><rect class="ii" x="326" y="138" width="18" height="62" rx="8" transform="rotate(-40 335 169)"/>`;
  s+=`<rect class="im" x="270" y="92" width="52" height="6" rx="3"/><rect class="ii" x="270" y="106" width="36" height="6" rx="3"/>`;
  return s},
rua(d){
  let s="";
  [[0,70,46,130],[46,40,40,160],[86,92,58,108],[144,56,34,144],[178,82,50,118],[228,30,44,170],[272,74,52,126],[324,50,38,150],[362,86,38,114]].forEach(([x,y,w,h])=>{s+=`<rect class="im" x="${x}" y="${y}" width="${w}" height="${h}" opacity=".55"/>`;for(let wy=y+10;wy<y+h-30;wy+=16)for(let wx=x+7;wx<x+w-8;wx+=12)s+=`<rect class="ic" x="${wx}" y="${wy}" width="5" height="8" opacity=".5"/>`});
  [[70,"ia",-6],[150,"iy",4],[262,"ia",-3],[338,"iy",6]].forEach(([x,c,r])=>{s+=`<rect class="ii" x="${x}" y="78" width="3" height="110"/><path class="${c}" transform="rotate(${r} ${x} 80)" d="M${x+3} 78 q22 -8 44 0 q-4 16 0 32 q-22 -8 -44 0z"/>`});
  s+=`<rect class="ia" x="168" y="120" width="96" height="30" rx="3" opacity=".9"/><rect class="ii" x="172" y="150" width="3" height="40"/><rect class="ii" x="257" y="150" width="3" height="40"/>`;
  s+=`<rect class="ic" x="180" y="131" width="72" height="8" rx="4"/>`;
  [[150,1.5,24,"im"],[168,1.8,29,"id"],[190,2.2,36,"ii"]].forEach(([y,sc,gap,c],row)=>{for(let x=(row%2)*gap/2-4;x<410;x+=gap)s+=person(x,y,sc,c)});
  s+=`<rect class="ii" x="0" y="232" width="400" height="8"/>`;
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s},
dinheiro(d){
  let s=`<rect class="id" x="0" y="196" width="400" height="44"/>`;
  [[52,7],[92,11],[132,5],[172,14]].forEach(([x,n])=>{for(let i=0;i<n;i++){const y=190-i*9;s+=`<ellipse class="iy" cx="${x}" cy="${y+4}" rx="17" ry="5"/><rect class="iy" x="${x-17}" y="${y-2}" width="34" height="6"/><ellipse class="${i===n-1?"ic":"iy"}" cx="${x}" cy="${y-2}" rx="17" ry="5" ${i===n-1?'opacity=".85"':""}/><path class="nf si" stroke-width=".6" opacity=".35" d="M${x-17} ${y+4} a17 5 0 0 0 34 0"/>`}});
  s+=T(224,70,30,d.valor||"","ii","start",700);
  if(d.legenda)s+=T(224,90,10.5,d.legenda,"ii","start",500);
  (d.itens||[]).slice(0,3).forEach(([k,v],i)=>{const y=120+i*30;s+=`<rect class="ic" x="224" y="${y}" width="160" height="24" rx="4"/>`+T(232,y+16,10,k,"ii","start",500)+T(376,y+16,10.5,v,"ii","end",700)});
  return s},
pesquisa(d){
  const ser=(d.series||[]).slice(0,4),n=ser.length||1,x0=40,x1=384,b=196,top=56,max=60;
  const yv=v=>b-(b-top)*v/max;
  let s=T(16,24,11,d.titulo||"Pesquisas","ii","start",600);
  s+=`<rect class="ia" x="${400-16-150}" y="15" width="10" height="10" rx="2"/>`+T(400-16-136,24,10.5,d.a||"A")+`<rect class="iy" x="${400-16-70}" y="15" width="10" height="10" rx="2"/>`+T(400-16-56,24,10.5,d.b||"B");
  [0,25,50].forEach(v=>{s+=`<rect class="im" x="${x0}" y="${yv(v).toFixed(1)}" width="${x1-x0}" height="1" opacity="${v===50?1:.6}"/>`+T(x0-6,yv(v)+4,9,v+"%","ii","end",500)});
  const gw=(x1-x0)/n,bw=Math.min(34,gw/2-10);
  ser.forEach(([nome,a,c],i)=>{const cx=x0+gw*i+gw/2;
    s+=`<rect class="ia" x="${cx-bw-3}" y="${yv(a).toFixed(1)}" width="${bw}" height="${(b-yv(a)).toFixed(1)}" rx="2"/><rect class="iy" x="${cx+3}" y="${yv(c).toFixed(1)}" width="${bw}" height="${(b-yv(c)).toFixed(1)}" rx="2"/>`;
    s+=T(cx-bw/2-3,yv(a)-5,10.5,String(a).replace(".",","),"ii","middle",700)+T(cx+3+bw/2,yv(c)-5,10.5,String(c).replace(".",","),"ii","middle",700)+T(cx,b+18,10,nome,"ii","middle",500)});
  s+=`<rect class="ii" x="${x0}" y="${b}" width="${x1-x0}" height="1.5"/>`;
  return s},
generica(d){
  let s=`<rect class="id" x="0" y="190" width="400" height="50"/>`;
  s+=`<rect class="ii" x="186" y="40" width="12" height="150"/><rect class="ii" x="202" y="40" width="12" height="150"/><rect class="ii" x="186" y="96" width="28" height="6"/>`;
  s+=`<path class="im" d="M70 176 a52 26 0 0 1 104 0z"/><path class="ia" d="M232 150 a50 26 0 0 0 100 0z"/><rect class="ii" x="40" y="176" width="320" height="12"/>`;
  s+=`<rect class="iy" x="60" y="188" width="280" height="4"/>`;
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s}
};
