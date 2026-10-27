import fs from 'node:fs';
const profiles=JSON.parse(fs.readFileSync(new URL('../data/profiles.json',import.meta.url),'utf8'));
const errors=[];
for(const p of profiles){if('variants' in p)errors.push(p.cn+'仍含旧A/B文案');for(const kind of ['virtue','neutral','shadow'])for(const field of ['label','title','description','adviceTitle','advice'])if(typeof p.branches?.[kind]?.[field]!=='string'||!p.branches[kind][field].trim())errors.push(`${p.cn}/${kind}/${field} 缺失`);}
if(profiles.length!==15)errors.push('应有15个人格');
if(errors.length){console.error('人格定稿尚未完整接入，禁止发布：\n'+errors.join('\n'));process.exit(1);}
console.log('PASS: 15个人格、45套完整文案，旧随机A/B结构已移除。');
