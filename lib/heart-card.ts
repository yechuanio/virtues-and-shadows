import { type Profile, familyById } from './mirror';
import { dominance, type Feature } from './report';
export const SITE_URL='https://virtues-and-shadows-98.peppyvale17.chatgpt.site';
export function downloadBlob(blob:Blob,name:string){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);}
function wrapText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number){let line='';for(const char of text){if(ctx.measureText(line+char).width>width){ctx.fillText(line,x,y);line=char;y+=lineHeight;}else line+=char;}if(line)ctx.fillText(line,x,y);return y+lineHeight;}
export async function renderHeartCard(profile:Profile,features:Feature[],dom?:ReturnType<typeof dominance>):Promise<Blob>{
const family=familyById(profile.familyId);
 const image=new Image();image.src=profile.image;await image.decode();await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1800;const ctx=canvas.getContext('2d')!;
 const paper=family.palette.paper,ink=family.palette.ink,gold=family.palette.accent,muted='#717260';
 const line=(x1:number,y1:number,x2:number,y2:number,color=gold)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();};
 const diamond=(x:number,y:number,size:number)=>{ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y);ctx.closePath();ctx.fillStyle=gold;ctx.fill();};
 ctx.fillStyle=ink;ctx.fillRect(0,0,1200,1800);ctx.fillStyle=paper;ctx.fillRect(20,20,1160,1760);
 ctx.strokeStyle='#b6aa87';ctx.lineWidth=1;ctx.strokeRect(34.5,34.5,1131,1731);
 ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle=ink;ctx.font='21px SimSun,serif';ctx.fillText('十四面镜人格',80,82);
 ctx.textAlign='right';ctx.fillStyle=gold;ctx.font='18px Microsoft YaHei,sans-serif';ctx.fillText(dom?dom.label+' / HEARTSCAPE':'A PORTRAIT OF YOUR INNER WORLD',1120,82);
 // A softly arched frame gives the existing portrait room without adding new art.
 ctx.save();ctx.beginPath();ctx.roundRect(80,114,1040,914,[210,210,6,6]);ctx.clip();
 const w=1040,h=914,scale=Math.max(w/image.naturalWidth,h/image.naturalHeight),sw=w/scale,sh=h/scale;
 ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)*.24,sw,sh,80,114,w,h);
 const fade=ctx.createLinearGradient(0,875,0,1028);fade.addColorStop(0,paper+'00');fade.addColorStop(1,paper);ctx.fillStyle=fade;ctx.fillRect(80,875,1040,153);ctx.restore();
 ctx.beginPath();ctx.roundRect(72,106,1056,930,[218,218,8,8]);ctx.strokeStyle='#ac986a';ctx.lineWidth=1.5;ctx.stroke();
 // Centered type and fine ornaments replace the large rectangular score boxes.
 line(406,1081,565,1081,'#c2b48d');diamond(600,1081,5);line(635,1081,794,1081,'#c2b48d');
 ctx.textAlign='center';ctx.fillStyle=ink;ctx.font=(dom?'60px':'72px')+' SimSun,serif';ctx.fillText(profile.cn+(dom?'-'+dom.label:''),600,1180,1020);
 ctx.fillStyle=gold;ctx.font='italic 29px Georgia,serif';ctx.fillText(profile.en,600,1238);
 ctx.fillStyle='#61745c';ctx.font='30px SimSun,serif';
 const tagline=profile.positioning;wrapText(ctx,tagline,600,1312,960,47);
 line(92,1380,1108,1380,'#c7bea4');

 features.forEach((feature,index)=>{
   const x=219+index*254,label=feature.label;
   if(index>0)line(92+index*254,1422,92+index*254,1592,'#d9d1bc');
   ctx.fillStyle=muted;ctx.font='17px Microsoft YaHei,sans-serif';ctx.fillText(label.replace('七宗罪','宗罪'),x,1441);
   ctx.fillStyle=index%2?'#976c51':ink;ctx.font='59px Georgia,serif';ctx.fillText(String(feature.score),x,1518);
   ctx.fillStyle=ink;ctx.font='28px SimSun,serif';ctx.fillText(feature.name,x,1571);
 });
 line(92,1625,1108,1625,'#c7bea4');ctx.fillStyle=muted;ctx.font='17px Microsoft YaHei,sans-serif';ctx.fillText('此刻的纹路，不是全部的你。',600,1672);
 ctx.textAlign='center';ctx.fillStyle=gold;ctx.font='18px Georgia,serif';ctx.fillText('https://virtues-and-shadows-98.peppyvale17.chatgpt.site',600,1711);
 ctx.fillStyle=muted;ctx.font='19px Microsoft YaHei,sans-serif';ctx.fillText('作者 / 野川 yechuan',600,1744);
 return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('未能生成图片')),'image/png'));
}
