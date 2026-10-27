import profilesData from '../data/profiles.json';
import questionsData from '../data/questions.json';
import familiesData from '../data/families.json';
import dimensionsData from '../data/dimensions.json';
export const VERSION = '3.1.0';
export const CONSENT_VERSION = '2026-10-27-v2';
export const profiles = profilesData;
export const questions = questionsData;
export const families = familiesData;
export const dimensions = dimensionsData;
export type Profile = typeof profiles[number];
export type Question = typeof questions[number];
export type Mode = 42 | 70 | 98;
export type Responses = Record<string, number | null>;
export type Session = {
    id: string;
    mode: Mode;
    ids: string[];
    used: string[];
    answers: Responses;
    index: number;
    seed: number;
    created: string;
};
export type Score = {
    dimension: number;
    name: string;
    valid: number;
    total: number;
    score: number | null;
};
export const profileById = (id: string) => profiles.find(p => p.id === id);
export const familyById = (id: string) => families.find(f => f.id === id)!;
export const questionById = (id: string) => questions.find(q => q.id === id);
export const MODE_INFO = [{ count: 42 as Mode, name: '初照', caption: '轻量探索', time: '约 6–9 分钟', detail: '每个方向 3 题，先看一幅粗略轮廓。' }, { count: 70 as Mode, name: '映照', caption: '标准探索', time: '约 10–15 分钟', detail: '每个方向 5 题，在覆盖与节奏之间取得平衡。' }, { count: 98 as Mode, name: '深照', caption: '完整探索', time: '约 15–20 分钟', detail: '每个方向 7 题，用更多场景补充你的心像。' }];
export function rng(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function shuffled<T>(input: T[], random: () => number) { const a = [...input]; for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
} return a; }
function pickDistinct(pool:Question[], selected:Question[], random:()=>number){
 const counts=new Map<string,number>();for(const q of selected)counts.set(q.theme,(counts.get(q.theme)||0)+1);
 return shuffled(pool,random).map(q=>({q,cost:(counts.get(q.theme)||0)*10+selected.filter(s=>s.dimension===q.dimension&&s.domain===q.domain).length})).sort((a,b)=>a.cost-b.cost)[0]?.q;
}
export function makeSession(mode:Mode,seed:number):Session{
 const random=rng(seed),selected:Question[]=[];
 for(let round=0;round<mode/14;round++)for(const d of shuffled(Array.from({length:14},(_,i)=>i),random)){
  const pool=questions.filter(q=>q.dimension===d&&!selected.some(s=>s.id===q.id));
  const directed=round===0?pool.filter(q=>q.reverse):round===1?pool.filter(q=>!q.reverse):pool;
  selected.push(pickDistinct(directed.length?directed:pool,selected,random)!);
 }
 const ids=shuffled(selected,random).map(q=>q.id);
 return{id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+seed,mode,ids,used:[...ids],answers:{},index:0,seed,created:new Date().toISOString()};
}
export function replaceQuestion(session:Session):Session|null{
 const old=questionById(session.ids[session.index]);if(!old)return null;
 const selected=session.ids.filter(id=>id!==old.id).map(questionById).filter((q):q is Question=>!!q);
 const next=pickDistinct(questions.filter(q=>q.dimension===old.dimension&&!session.used.includes(q.id)),selected,rng(session.seed+session.used.length));
 if(!next)return null;const ids=[...session.ids];ids[session.index]=next.id;const answers={...session.answers};delete answers[old.id];return{...session,ids,answers,used:[...session.used,next.id]};
}
export function validSession(value: unknown): value is Session {
    if (!value || typeof value !== 'object')
        return false;
    const s = value as Session;
    if (![42, 70, 98].includes(s.mode) || !Array.isArray(s.ids) || s.ids.length !== s.mode || new Set(s.ids).size !== s.mode || !s.answers || typeof s.answers !== 'object' || Array.isArray(s.answers))
        return false;
    if (typeof s.id !== 'string' || !s.id || s.id.length > 100 || !Number.isSafeInteger(s.seed) || s.seed < 0 || s.seed > 4294967295 || typeof s.created !== 'string' || s.created.length > 50 || !Number.isFinite(Date.parse(s.created)))
        return false;
    if (!Number.isInteger(s.index) || s.index < 0 || s.index >= s.mode || !Array.isArray(s.used) || s.used.length > 210 || new Set(s.used).size !== s.used.length || s.used.some(id => typeof id !== 'string' || !questionById(id)) || s.ids.some(id => !s.used.includes(id)))
        return false;
    if (s.ids.some(id => typeof id !== 'string' || !questionById(id)))
        return false;
    for (let d = 0; d < 14; d++)
        if (s.ids.filter(id => questionById(id)!.dimension === d).length !== s.mode / 14)
            return false;
    return s.ids.every(id => s.answers[id] === undefined || s.answers[id] === null || (Number.isInteger(s.answers[id]) && s.answers[id]! >= 0 && s.answers[id]! <= 4));
}
export function scoreResponses(mode: Mode, ids: string[], answers: Responses): Score[] {
    const min = mode === 42 ? 2 : mode === 70 ? 3 : 4;
    return dimensions.map((d, i) => { const qs = ids.map(questionById).filter((q): q is Question => !!q && q.dimension === i), valid = qs.filter(q => Number.isInteger(answers[q.id]) && answers[q.id]! >= 0 && answers[q.id]! <= 4); const weight = valid.reduce((n, q) => n + q.weight, 0); const sum = valid.reduce((n, q) => n + (q.reverse ? 4 - answers[q.id]! : answers[q.id]!) * q.weight, 0); return { dimension: i, name: d.name, valid: valid.length, total: qs.length, score: valid.length >= min && weight > 0 ? Math.round(sum / (4 * weight) * 100) : null }; });
}
export function matchProfiles(scores: Score[]) {
    const valid = scores.filter(s => s.score !== null);
    if (valid.length < 10)
        return [];
    const values = valid.map(s => s.score!), mean = values.reduce((a, b) => a + b, 0) / values.length;
    const spread = Math.sqrt(values.reduce((n, v) => n + (v - mean) ** 2, 0) / values.length);
    const ranked = profiles.filter(p => p.primary !== null && scores[p.primary]?.score !== null).map(p => { const primary = scores[p.primary!]!.score!; const raw = p.secondary !== null ? scores[p.secondary]?.score : null; const secondary = raw === null || raw === undefined ? primary : p.secondaryDirection === -1 ? 100 - raw : raw; const affinity = primary * .86 + secondary * .14; return { profile: p, affinity, primary }; }).sort((a, b) => b.affinity - a.affinity || b.primary - a.primary);
    if (valid.length === 14 && spread <= 9 && Math.max(...values) - Math.min(...values) <= 20) {
        const balanced = profiles.find(p => p.primary === null)!;
        return [{ profile: balanced, affinity: mean, primary: mean }, ...ranked.slice(0, 2)];
    }
    if (!ranked.length || ranked[0].primary < 35)
        return [];
    return ranked.slice(0, 3);
}
export function interpret(mode: Mode, ids: string[], answers: Responses) { const scores = scoreResponses(mode, ids, answers); return { scores, matches: matchProfiles(scores) }; }
export function variantFor(profile: Profile, seed: number) { return profile.variants[Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) % profile.variants.length : 0]; }
export function dateLabel(value: string) { return new Date(value).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }); }
