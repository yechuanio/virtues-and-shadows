import templates from '../data/report-features.json';
import { type Score, type Profile, type Session, interpret } from './mirror';

export type Feature = typeof templates[number] & { score: number; label: string; explanation: string };
export type Heart = { session: Session; completed: string };
export const isHidden = (profile: Profile) => profile.primary === null;
export function fourFeatures(scores: Score[]): Feature[] {
  const available = scores.filter(s => s.score !== null);
  const select = (kind: 'virtue' | 'sin', high: boolean) => available.filter(s => kind === 'virtue' ? s.dimension < 7 : s.dimension >= 7).sort((a,b) => (high ? b.score! - a.score! : a.score! - b.score!) || a.dimension - b.dimension);
  const used = new Set<number>();
  const specs = [['virtue','virtueHigh',true,'美德 · 高分'],['virtue','virtueLow',false,'美德 · 低分'],['sin','sinLow',false,'七宗罪 · 低分'],['sin','sinHigh',true,'七宗罪 · 高分']] as const;
  return specs.flatMap(([kind,role,high,label]) => {
    const score = select(kind, high).find(s => !used.has(s.dimension));
    if (!score) return [];
    used.add(score.dimension);
    const template = templates.find(t => t.dimension === score.dimension && t.role === role)!;
    const value = score.score!;
    // Relative extremes must not turn middling scores into strong trait claims.
    const clear = high ? value >= 65 : value <= 35;
    const explanation = clear ? template.analysis : `这一项在本次${kind === 'virtue' ? '美德' : '七宗罪'}得分中相对${high ? '靠前' : '靠后'}，但${high ? '没有明显偏高' : '没有明显偏低'}。${template.analysis.replace(/你可能/g,'某些情境下，你可能').replace('是本次较突出的倾向','是可以留意的倾向')}这些描述宜作为核对线索，不代表强烈或固定的特征。`;
    return [{ ...template, score:value, label, explanation }];
  });
}
export function previousHeart(history: Heart[], current: Heart): Heart | undefined {
  const when = Date.parse(current.completed);
  return history.filter(h => h.session.id !== current.session.id && Date.parse(h.completed) <= when).sort((a,b) => Date.parse(b.completed) - Date.parse(a.completed))[0];
}
export function comparison(previous: Heart, current: Heart) {
  const before = interpret(previous.session.mode,previous.session.ids,previous.session.answers).scores;
  const after = interpret(current.session.mode,current.session.ids,current.session.answers).scores;
  return after.map((s,i) => ({...s,before:before[i].score,delta:s.score === null || before[i].score === null ? null : s.score-before[i].score!}));
}
