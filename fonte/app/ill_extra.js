/* ---------- ilustrações das seções novas ---------- */
const wrapT=(x,y,size,txt,max,lh,lines=3,cls="ii")=>{const w=String(txt||"").split(/\s+/),out=[];let cur="";w.forEach(p=>{if((cur+" "+p).trim().length>max){out.push(cur.trim());cur=p}else cur+=" "+p});if(cur.trim())out.push(cur.trim());return out.slice(0,lines).map((l,i)=>T(x,y+i*lh,size,l,cls,"start",500)).join("")};
Object.assign(ILL,{
indicador(d){
  let s="";
  for(let i=0;i<5;i++)s+=`<rect class="im" x="16" y="${96+i*28}" width="368" height="1" opacity=".55"/>`;
  const ser=(d.serie||[]).map(Number).filter(n=>!isNaN(n));
  if(ser.length>=3){
    const mn=Math.min(...ser),mx=Math.max(...ser),r=(mx-mn)||1,x0=180,x1=384,y0=208,y1=104;
    const pts=ser.map((v,i)=>[x0+(x1-x0)*i/(ser.length-1),y0-(y0-y1)*(v-mn)/r]);
    s+=`<path class="ia" opacity=".18" d="M${pts[0][0]} ${y0} ${pts.map(p=>"L"+p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" ")} L${x1} ${y0}z"/>`;
    s+=`<path class="nf sa" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" d="M${pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" L")}"/>`;
    const l=pts[pts.length-1];s+=`<circle class="iy" cx="${l[0]}" cy="${l[1]}" r="7"/>`;
  }else{
    [60,60,60,60,60,60,60].forEach((h,i)=>{s+=`<rect class="${i===6?"ia":"im"}" x="${190+i*28}" y="${208-h}" width="18" height="${h}" rx="3" opacity="${i===6?1:.5}"/>`});
  }
  s+=T(16,30,11,d.rotulo||"INDICADOR","ii","start",600);
  s+=T(16,84,46,d.valor||"","ii","start",700);
  if(d.variacao)s+=chip(18,98,d.variacao,"iy","ii");
  if(d.legenda)s+=wrapT(16,140,10.5,d.legenda,26,15,5);
  return s},
globo(d){
  let s="";
  for(let i=0;i<40;i++){const x=(i*97)%400,y=(i*53)%240;s+=`<circle class="im" cx="${x}" cy="${y}" r="1.4" opacity=".6"/>`}
  s+=`<circle class="ic" cx="200" cy="128" r="96"/><circle class="nf sm" stroke-width="2" cx="200" cy="128" r="96"/>`;
  [30,62].forEach(rx=>{s+=`<ellipse class="nf sm" stroke-width="1.5" cx="200" cy="128" rx="${rx}" ry="96"/>`});
  [-48,0,48].forEach(dy=>{const w=Math.sqrt(96*96-dy*dy);s+=`<path class="nf sm" stroke-width="1.5" d="M${200-w} ${128+dy} Q200 ${128+dy+10} ${200+w} ${128+dy}"/>`});
  s+=`<path class="ia" opacity=".85" d="M150 74 q22 -14 44 -4 q10 14 -4 26 q-18 8 -12 26 q-6 18 -24 12 q-14 -12 -10 -30 q-8 -16 6 -30z"/><path class="ia" opacity=".85" d="M222 104 q26 -8 40 8 q8 18 -6 30 q-4 22 -22 34 q-16 -2 -14 -22 q-12 -12 -4 -30 q2 -12 6 -20z"/><path class="ia" opacity=".7" d="M176 170 q14 -6 22 4 q0 14 -14 18 q-12 -4 -8 -22z"/>`;
  s+=`<path class="iy" d="M246 58 a16 16 0 0 1 32 0 c0 14 -16 30 -16 30 s-16 -16 -16 -30z"/><circle class="ii" cx="262" cy="58" r="6"/>`;
  if(d.local)s+=chip(282,40,d.local,"ii","ic");
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s},
escola(d){
  let s=`<rect class="id" x="0" y="200" width="400" height="40"/>`;
  s+=`<rect class="ic" x="90" y="92" width="220" height="108"/><polygon class="ia" points="80,94 200,46 320,94"/><rect class="ii" x="80" y="92" width="240" height="8"/>`;
  [[104,110],[144,110],[228,110],[268,110],[104,152],[144,152],[228,152],[268,152]].forEach(([x,y])=>{s+=`<rect class="im" x="${x}" y="${y}" width="28" height="26" rx="2"/>`});
  s+=`<rect class="ii" x="184" y="148" width="32" height="52" rx="2"/><rect class="iy" x="196" y="114" width="8" height="22" rx="2"/>`;
  s+=`<circle class="ic sm" stroke-width="2" cx="200" cy="74" r="10"/><path class="nf si" stroke-width="2" d="M200 68 v6 h5"/>`;
  s+=`<rect class="ii" x="334" y="62" width="3" height="138"/><path class="iy" d="M337 64 h34 l-8 10 l8 10 h-34z"/>`;
  [[26,186,"ia"],[30,174,"iy"],[22,162,"im"]].forEach(([x,y,c])=>{s+=`<rect class="${c}" x="${x}" y="${y}" width="48" height="12" rx="2"/>`});
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s},
campo(d){
  let s=`<rect class="ia" x="0" y="96" width="400" height="144" opacity=".9"/>`;
  for(let i=0;i<8;i++)s+=`<rect class="ic" x="${i*50}" y="96" width="25" height="144" opacity=".06"/>`;
  s+=`<g class="nf sc" stroke-width="2.5" opacity=".9" fill="none"><rect class="nf sc" x="24" y="110" width="352" height="118"/><path class="nf sc" d="M200 110 v118"/><circle class="nf sc" cx="200" cy="169" r="24"/><rect class="nf sc" x="24" y="140" width="40" height="58"/><rect class="nf sc" x="336" y="140" width="40" height="58"/></g>`;
  s+=`<circle class="ic" cx="236" cy="184" r="8"/><path class="nf si" stroke-width="1.5" d="M232 180 l4 4 4 -4 M236 184 v6"/>`;
  s+=`<rect class="ii" x="36" y="26" width="328" height="56" rx="8"/>`;
  const ok=d.ga!=null&&d.gb!=null&&d.ga!==""&&d.gb!=="";
  s+=T(150,50,11.5,(d.a||"").slice(0,15),"ic","end",600)+T(250,50,11.5,(d.b||"").slice(0,15),"ic","start",600);
  s+=ok?T(200,62,28,`${d.ga} × ${d.gb}`,"iy","middle",700):T(200,58,16,"×","iy","middle",700);
  s+=T(200,76,9.5,(d.rotulo||"").toUpperCase().slice(0,44),"ic","middle",500);
  return s},
clima(d){
  const r=String(d.rotulo||"").toLowerCase();
  let s="";
  if(/chuv|tempest|alag|enchent|tempo/.test(r)){
    s+=`<path class="im" d="M110 112 a40 40 0 0 1 76 -18 a46 46 0 0 1 88 14 a32 32 0 0 1 4 64 h-170 a30 30 0 0 1 2 -60z"/><path class="ii" opacity=".75" d="M120 120 a34 34 0 0 1 64 -14 a40 40 0 0 1 76 12 a26 26 0 0 1 2 52 h-142 a26 26 0 0 1 0 -50z"/>`;
    for(let i=0;i<14;i++){const x=120+i*12,y=186+(i%3)*10;s+=`<path class="nf sa" stroke-width="3" stroke-linecap="round" d="M${x} ${y} l-6 14"/>`}
    s+=`<path class="iy" d="M236 172 l-16 28 h14 l-8 26 26 -36 h-14 l10 -18z"/>`;
  }else if(/queim|fogo|incênd|fumaça|seca/.test(r)){
    s+=`<rect class="im" x="0" y="0" width="400" height="240" opacity=".35"/>`;
    [[60,70,50],[150,40,64],[250,60,58],[330,80,46]].forEach(([x,y,rr])=>{s+=`<circle class="im" cx="${x}" cy="${y}" r="${rr}" opacity=".55"/>`});
    for(let i=0;i<9;i++){const x=30+i*44,h=40+(i%3)*22;s+=`<path class="ii" opacity=".85" d="M${x-8} 214 v-${h*0.5} l8 -${h*0.5} l8 ${h*0.5} v${h*0.5}z"/>`}
    [[110,206,30],[200,206,40],[290,206,28]].forEach(([x,y,h])=>{s+=`<path class="iy" d="M${x} ${y-h*2} c${h*0.6} ${h*0.7} ${h} ${h} ${h*0.6} ${h*1.6} c-${h*0.2} ${h*0.4} -${h*1} ${h*0.5} -${h*1.2} 0 c-${h*0.4} -${h*0.8} 0 -${h*1.1} ${h*0.6} -${h*1.6}z"/>`});
    s+=`<rect class="id" x="0" y="214" width="400" height="26"/>`;
  }else{
    s+=`<circle class="iy" cx="140" cy="110" r="46"/>`;
    for(let i=0;i<12;i++){const a=i*Math.PI/6;s+=`<path class="nf sy" stroke-width="5" stroke-linecap="round" d="M${(140+62*Math.cos(a)).toFixed(1)} ${(110+62*Math.sin(a)).toFixed(1)} L${(140+80*Math.cos(a)).toFixed(1)} ${(110+80*Math.sin(a)).toFixed(1)}"/>`}
    s+=`<rect class="ic sm" stroke-width="2" x="276" y="44" width="28" height="130" rx="14"/><circle class="ia" cx="290" cy="186" r="24"/><rect class="ia" x="284" y="80" width="12" height="100" rx="6"/>`;
    s+=`<rect class="id" x="0" y="214" width="400" height="26"/>`;
  }
  if(d.temp)s+=T(384,40,30,d.temp,"ii","end",700);
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s},
dinheiro(d){
  let s=`<rect class="id" x="0" y="196" width="400" height="44"/>`;
  [[44,7],[82,11],[120,5],[158,14]].forEach(([x,n])=>{for(let i=0;i<n;i++){const y=190-i*9;s+=`<ellipse class="iy" cx="${x}" cy="${y+4}" rx="16" ry="5"/><rect class="iy" x="${x-16}" y="${y-2}" width="32" height="6"/><ellipse class="${i===n-1?"ic":"iy"}" cx="${x}" cy="${y-2}" rx="16" ry="5"/><path class="nf si" stroke-width=".6" opacity=".35" d="M${x-16} ${y+4} a16 5 0 0 0 32 0"/>`}});
  const v=String(d.valor||"");s+=T(196,62,v.length>9?26:32,v,"ii","start",700);
  if(d.legenda)s+=wrapT(196,82,9.5,d.legenda,32,13,2);
  (d.itens||[]).slice(0,3).forEach(([k,val],i)=>{const y=114+i*28;s+=`<rect class="ic" x="196" y="${y}" width="190" height="22" rx="4"/>`+T(204,y+15,9,String(k).slice(0,22),"ii","start",500)+T(380,y+15,10,val,"ii","end",700)});
  return s},
seguranca(d){
  let s=`<rect class="id" x="0" y="196" width="400" height="44"/>`;
  s+=`<path class="ii" d="M200 40 l64 22 v46 c0 40 -30 64 -64 76 c-34 -12 -64 -36 -64 -76 v-46z"/><path class="ic" d="M200 58 l46 16 v34 c0 28 -22 46 -46 56 c-24 -10 -46 -28 -46 -56 v-34z" opacity=".95"/><path class="ia" d="M200 84 l8 16 18 3 -13 12 3 18 -16 -9 -16 9 3 -18 -13 -12 18 -3z"/>`;
  s+=`<g transform="rotate(-8 200 176)"><rect class="iy" x="-20" y="164" width="440" height="24"/>${[0,1,2,3,4,5,6,7,8,9,10].map(i=>`<path class="ii" d="M${-20+i*44} 164 h20 l-12 24 h-20z"/>`).join("")}</g>`;
  s+=`<rect class="ia" x="40" y="54" width="34" height="14" rx="7"/><rect class="iy" x="326" y="54" width="34" height="14" rx="7"/>`;
  if(d.rotulo)s+=chip(16,12,d.rotulo,"ii","ic");
  return s}
});
