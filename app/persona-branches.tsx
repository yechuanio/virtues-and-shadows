'use client';
import { useState } from 'react';
import { type Profile } from '../lib/mirror';
import { PERSONA_KINDS, personaBranch, type PersonaKind } from '../lib/report';

export default function PersonaBranches({ profile }: {profile:Profile}) {
 const [selected,setSelected]=useState<PersonaKind>('neutral');
 return <div className="persona-branches"><div className="branch-tabs" aria-label="人格的三种分类">{PERSONA_KINDS.map(kind=><button type="button" aria-pressed={selected===kind} aria-controls={'branch-panel-'+kind} onClick={()=>setSelected(kind)} key={kind}>{({virtue:'善主导',neutral:'中性',shadow:'恶主导'})[kind]}</button>)}</div>{PERSONA_KINDS.map(kind=>{const branch=personaBranch(profile,kind);return <div id={'branch-panel-'+kind} hidden={selected!==kind} key={kind} className={'branch-panel branch-'+kind}>{branch?<><section className="atlas-copy-section"><h2>人格底色</h2><h3>{branch.title}</h3><p>{branch.description}</p></section><section className="atlas-copy-section atlas-growth"><h2>成长建议</h2><h3>{branch.adviceTitle}</h3><p>{branch.advice}</p></section></>:<p className="pending-persona-copy">暂时无法展开这段文字，请稍后重试。</p>}</div>;})}</div>;
}
