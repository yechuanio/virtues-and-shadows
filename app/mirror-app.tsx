'use client';
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { CONSENT_VERSION, VERSION, MODE_INFO, profiles, families, dimensions, profileById, familyById, makeSession, replaceQuestion, validSession, interpret, dateLabel, questionById, type Profile, type Session, type Mode, type Score } from '../lib/mirror';
import PersonaBranches from './persona-branches';
import FeedbackPage from './feedback';
import Disclaimer from './disclaimer';
import HeartReport from './heart-report';
import relationshipData from '../data/relationships.json';
type Relation = {
    recommended: {
        id: string;
        reason: string;
    }[];
    caution: {
        id: string;
        reason: string;
    }[];
};
const relations = relationshipData as unknown as Record<string, {
    friends: Relation;
    romance: Relation;
}>;
const STORE = 'fourteen-mirrors-v2';
type Heart = {
    session: Session;
    completed: string;
};
type Member = {
    id: string;
    nickname: string;
    profileId: string;
    familyId: string;
    contacts: Record<string, string>;
    updatedAt: number;
    expiresAt: number;
    consentVersion: string;
};
type ApiReply = {
    error?: string;
    signedIn: boolean;
    member: Member | null;
    members: Member[];
    nextOffset: number | null;
    deleted?: boolean;
};
const contactLabels: Record<string, string> = { email: '邮箱', qq: 'QQ', wechat: '微信', phone: '手机号', github: 'GitHub' };
function palette(id: string): CSSProperties { const f = familyById(id); return { '--family': f.palette.primary, '--family-ink': f.palette.ink, '--family-paper': f.palette.paper, '--family-accent': f.palette.accent } as CSSProperties; }
function Portrait({ profile, className = '', eager = false }: {
    profile: Profile;
    className?: string;
    eager?: boolean;
}) { return <img className={'portrait ' + className} src={profile.image} alt={profile.cn + '，' + familyById(profile.familyId).name + '人格插画'} width={1086} height={1448} loading={eager ? 'eager' : 'lazy'}/>; }
function FamilyTag({ id }: {
    id: string;
}) { const f = familyById(id); return <span className="family-tag" style={palette(id)}><i />{f.name}</span>; }
function ProfileCard({ profile, compact = false }: {
    profile: Profile;
    compact?: boolean;
}) { return <a className={'profile-card ' + (compact ? 'compact' : '')} href={'/atlas/' + profile.id} style={palette(profile.familyId)}><div className="profile-image"><Portrait profile={profile}/><span className="card-arrow" aria-hidden="true">↗</span></div><div className="profile-caption"><FamilyTag id={profile.familyId}/>{profile.primary === null && <span className="hidden-personality-badge">✧ 隐藏稀有人格</span>}<h3>{profile.cn}</h3><span className="english">{profile.en}</span><p className="profile-positioning">{profile.positioning}</p>{!compact && <p>{profile.intro}</p>}</div></a>; }
function Recommendations({ profile }: {
    profile: Profile;
}) { const [mode, setMode] = useState<'friends' | 'romance'>('friends'); const r = relations[profile.id]?.[mode]; if (!r)
    return null; return <section className="relationship-section"><div className="section-head"><div><span className="eyebrow">RESONANCE, NOT DESTINY</span><h2>与谁，照见另一面。</h2></div><div className="segmented"><button className={mode === 'friends' ? 'active' : ''} onClick={() => setMode('friends')}>交友同频</button><button className={mode === 'romance' ? 'active' : ''} onClick={() => setMode('romance')}>恋爱相处</button></div></div><div className="relation-grid">{r.recommended.map(item => { const p = profileById(item.id)!; return <a href={'/atlas/' + p.id} key={p.id} className="relation-card" style={palette(p.familyId)}><Portrait profile={p}/><div><span className="eyebrow">值得认识</span><h3>{p.cn}</h3><span className="english">{p.en}</span><p className="profile-positioning">{p.positioning}</p><p>{item.reason}</p></div></a>; })}{r.caution.map(item => { const p = profileById(item.id)!; return <a href={'/atlas/' + p.id} key={p.id} className="relation-card caution" style={palette(p.familyId)}><Portrait profile={p}/><div><span className="eyebrow">需要更多磨合 · 不优先推荐</span><h3>{p.cn}</h3><span className="english">{p.en}</span><p className="profile-positioning">{p.positioning}</p><p>{item.reason}</p></div></a>; })}</div></section>; }
function Radar({ scores, kind }: {
    scores: Score[];
    kind: 'virtue' | 'shadow';
}) { const ds = scores.slice(kind === 'virtue' ? 0 : 7, kind === 'virtue' ? 7 : 14), cx = 200, cy = 173, r = 105; const point = (i: number, rr: number) => [cx + Math.cos(-Math.PI / 2 + i * Math.PI * 2 / 7) * rr, cy + Math.sin(-Math.PI / 2 + i * Math.PI * 2 / 7) * rr]; const poly = (rr: number) => ds.map((_, i) => point(i, rr).join(',')).join(' '); const color = kind === 'virtue' ? '#55725c' : '#a05f4f'; return <svg viewBox="0 0 400 345" role="img" aria-label={kind === 'virtue' ? '七美德倾向雷达图' : '七宗罪相关行为倾向雷达图'}><title>{ds.map(s => s.name + ':' + (s.score ?? '信息不足')).join('；')}</title>{[25, 50, 75, 100].map(v => <g key={v}><polygon points={poly(r * v / 100)} fill="none" stroke="#d9ddd2"/><text x={cx + 5} y={cy - r * v / 100 - 2} fontSize="9" fill="#72796c">{v}</text></g>)}{ds.map((s, i) => { const p = point(i, r), l = point(i, 136); return <g key={s.dimension}><line x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#d9ddd2"/><text x={l[0]} y={l[1] - 2} textAnchor="middle" fontSize="12" fill="#34473e">{s.name}</text><text x={l[0]} y={l[1] + 15} textAnchor="middle" fontSize="11" fill={color}>{s.score ?? '不足'}</text></g>; })}{ds.every(s => s.score !== null) ? <polygon points={ds.map((s, i) => point(i, r * s.score! / 100).join(',')).join(' ')} fill={color} fillOpacity=".16" stroke={color} strokeWidth="2"/> : ds.map((s, i) => { const n = ds[(i + 1) % 7]; if (s.score === null || n.score === null)
    return null; const a = point(i, r * s.score / 100), b = point((i + 1) % 7, r * n.score / 100); return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth="2"/>; })}{ds.map((s, i) => { if (s.score === null)
    return null; const p = point(i, r * s.score / 100); return <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color}/>; })}</svg>; }
export default function MirrorApp({ view, detailId }: {
    view: string;
    detailId: string;
}) {
    const [ready, setReady] = useState(false), [session, setSession] = useState<Session | null>(null), [history, setHistory] = useState<Heart[]>([]), [selectedHeart, setSelectedHeart] = useState(''), [notice, setNotice] = useState(''), [storageOK, setStorageOK] = useState(true), [familyFilter, setFamilyFilter] = useState('all'), [search, setSearch] = useState('');
    const [auth, setAuth] = useState<{
        signedIn: boolean;
        member: Member | null;
    } | null>(null), [authLoading, setAuthLoading] = useState(false), [apiMessage, setApiMessage] = useState(''), [busy, setBusy] = useState(false), [retry, setRetry] = useState(0);
    const [nickname, setNickname] = useState(''), [contactValues, setContactValues] = useState<Record<string, string>>({}), [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({}), [adult, setAdult] = useState(false), [consent, setConsent] = useState(false), [ownContact, setOwnContact] = useState(false);
    const [directoryKind, setDirectoryKind] = useState('same'), [directoryProfile, setDirectoryProfile] = useState(''), [directory, setDirectory] = useState<Member[]>([]), [offset, setOffset] = useState(0), [nextOffset, setNextOffset] = useState<number | null>(null), [directoryLoading, setDirectoryLoading] = useState(false), [directoryError, setDirectoryError] = useState('');
    useEffect(() => { try {
        const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
        if (validSession(raw.session) && Array.isArray(raw.session.used) && raw.session.used.every((id: unknown) => typeof id === 'string') && Number.isInteger(raw.session.index) && raw.session.index >= 0 && raw.session.index < raw.session.mode)
            setSession(raw.session);
        if (Array.isArray(raw.history))
            setHistory(raw.history.filter((h: Heart) => validSession(h?.session) && typeof h.completed === 'string').slice(0, 15));
    }
    catch {
        setStorageOK(false);
    } const query = new URLSearchParams(window.location.search); setSelectedHeart(query.get('id') || ''); if (families.some(f => f.id === query.get('family')))
        setFamilyFilter(query.get('family')!); setReady(true); }, []);
    useEffect(() => { if (!ready)
        return; try {
        localStorage.setItem(STORE, JSON.stringify({ session, history }));
    }
    catch {
        setStorageOK(false);
    } }, [session, history, ready]);
    useEffect(() => { if (view !== 'meet')
        return; let live = true; setAuthLoading(true); fetch('/api/member', { cache: 'no-store' }).then(async (r) => { const data = await r.json() as ApiReply; if (!r.ok)
        throw Error(data.error || '无法打开名录。'); if (!live)
        return; setAuth(data); if (data.member) {
        setNickname(data.member.nickname);
        setContactValues(data.member.contacts);
        setVisibleFields(Object.fromEntries(Object.keys(data.member.contacts).map(k => [k, true])));
    } setApiMessage(''); }).catch(e => { if (live)
        setApiMessage(e.message); }).finally(() => { if (live)
        setAuthLoading(false); }); return () => { live = false; }; }, [view, retry]);
    const member = auth?.member;
    const activeMember = !!member && member.expiresAt > Date.now() && member.consentVersion === CONSENT_VERSION;
    useEffect(() => { if (view !== 'meet' || !activeMember)
        return; let live = true; setDirectoryLoading(true); setDirectoryError(''); const params = new URLSearchParams({ kind: directoryKind, offset: String(offset) }); if (directoryKind === 'all' && directoryProfile)
        params.set('profile', directoryProfile); fetch('/api/directory?' + params, { cache: 'no-store' }).then(async (r) => { const data = await r.json() as ApiReply; if (!r.ok)
        throw Error(data.error || '无法获取名录。'); if (live) {
        setDirectory(data.members);
        setNextOffset(data.nextOffset);
    } }).catch(e => { if (live) {
        setDirectory([]);
        setDirectoryError(e.message);
    } }).finally(() => { if (live)
        setDirectoryLoading(false); }); return () => { live = false; }; }, [view, activeMember, member?.id, member?.profileId, directoryKind, directoryProfile, offset, retry]);
    const heart = history.find(h => h.session.id === selectedHeart) || history[0];
    const result = useMemo(() => heart ? interpret(heart.session.mode, heart.session.ids, heart.session.answers) : null, [heart]);
    const main = result?.matches[0]?.profile;
    const detail = view === 'atlas' && detailId ? profileById(detailId) : undefined;
    const themed = view === 'heart' || view === 'meet' ? main : detail;
    const themeId = themed?.familyId || (view === 'atlas' && familyFilter !== 'all' ? familyFilter : '');
    function saveSession(next: Session) { setSession(next); setNotice(''); }
    function begin(mode: Mode) { if (session && !window.confirm('开始新的测试会替换尚未完成的进度，已有心像仍会保留。是否继续？'))
        return; saveSession(makeSession(mode, crypto.getRandomValues(new Uint32Array(1))[0])); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function answer(value: number | null) { if (!session)
        return; saveSession({ ...session, answers: { ...session.answers, [session.ids[session.index]]: value } }); }
    function move(delta: number) { if (!session)
        return; const next = Math.max(0, Math.min(session.mode - 1, session.index + delta)); saveSession({ ...session, index: next }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    function complete() { if (!session)
        return; const missing = session.ids.findIndex(id => session.answers[id] === undefined); if (missing >= 0) {
        saveSession({ ...session, index: missing });
        setNotice('还有未作答的情景；没有可参考经历时可以跳过。');
        return;
    } const h = { session, completed: new Date().toISOString() }; setHistory([h, ...history.filter(x => x.session.id !== session.id)].slice(0, 15)); setSession(null); try {
        localStorage.setItem(STORE, JSON.stringify({ session: null, history: [h, ...history.filter(x => x.session.id !== session.id)].slice(0, 15) }));
    }
    catch { } window.location.assign('/heart?id=' + encodeURIComponent(h.session.id)); }
    async function join(e: FormEvent) { e.preventDefault(); setApiMessage(''); if (!heart && !member) {
        setApiMessage('请先完成一份心像测试。');
        return;
    } const contacts = Object.fromEntries(Object.entries(contactValues).filter(([k, v]) => visibleFields[k] && v.trim()).map(([k, v]) => [k, v.trim()])); if (!Object.keys(contacts).length) {
        setApiMessage('至少填写并勾选展示一种联系方式。');
        return;
    } if (!adult || !consent || !ownContact) {
        setApiMessage('请阅读并完成下方三项确认。');
        return;
    } setBusy(true); try {
        const r = await fetch('/api/member', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, contacts, adult, publish: consent, ownContacts: ownContact, consentVersion: CONSENT_VERSION, heart: heart?.session }) });
        const data = await r.json() as ApiReply;
        if (!r.ok)
            throw Error(data.error || '未能保存。');
        setAuth(data);
        setConsent(false);
        setApiMessage('已保存。只有你勾选的联系方式会向其他已加入用户展示，可随时修改或退出。');
        setRetry(v => v + 1);
    }
    catch (e) {
        setApiMessage(e instanceof Error ? e.message : '保存失败，请重试。');
    }
    finally {
        setBusy(false);
    } }
    async function leave() { if (!window.confirm('退出后，你的名录记录和展示联系方式会从服务器删除，你也将停止查看名录。确认退出？'))
        return; setBusy(true); try {
        const r = await fetch('/api/member', { method: 'DELETE' });
        const d = await r.json() as ApiReply;
        if (!r.ok)
            throw Error(d.error);
        setAuth({ signedIn: true, member: null });
        setDirectory([]);
        setContactValues({});
        setVisibleFields({});
        setConsent(false);
        setApiMessage('已退出，服务器上的名录记录已删除。别人此前自行保存的信息无法由本站撤回。');setRetry(v=>v+1);
    }
    catch (e) {
        setApiMessage(e instanceof Error ? e.message : '暂时无法退出，请重试。');
    }
    finally {
        setBusy(false);
    } }
    const visibleProfiles = profiles.filter(p => (familyFilter === 'all' || p.familyId === familyFilter) && (!search || `${p.cn} ${p.en} ${p.intro}`.toLowerCase().includes(search.toLowerCase())));
    return <div className={'site ' + (themeId ? 'themed' : '')} style={themeId ? palette(themeId) : undefined} data-family={themeId || 'neutral'}><header className="site-header"><a href="/" className="brand" aria-label="十四面镜人格首页"><span className="mirror-mark" aria-hidden="true">✳</span><span>十四面镜<small>FOURTEEN MIRRORS</small></span></a><nav aria-label="主导航">{[['/', '镜序', 'home'], ['/test', '入镜', 'test'], ['/atlas', '镜中群像', 'atlas'], ['/heart', '心像匣', 'heart'], ['/meet', '同频回廊', 'meet']].map(([href, label, key]) => <a key={key} href={href} aria-current={view === key ? 'page' : undefined}>{label}</a>)}</nav><a className="header-author" href="https://github.com/yechuanio" target="_blank" rel="noopener noreferrer">野川 yechuan ↗</a></header>
 <main>
 {view === 'home' && <><section className="home-hero"><div className="hero-text"><span className="eyebrow light">A QUIET ATLAS OF YOUR INNER WORLD</span><h1>你从哪一面，<br />照见自己。</h1><p>一次日常选择，一道未曾留意的纹路。<br />走过十四种倾向，遇见属于此刻的心像。</p><div className="hero-actions"><a href="/test" className="button gold">开始入镜 <span>↗</span></a><a href="/atlas" className="hero-link">先翻开人格图鉴 →</a></div><div className="hero-facts"><span><b>210</b>道情境题库</span><span><b>14</b>种心像与隐藏篇章</span><span><b>5</b>个视觉家族</span></div></div><div className="hero-gallery" aria-label="人格原型插画"><Portrait profile={profileById('lantern-guide')!} eager className="hero-side"/><Portrait profile={profileById('starlit-builder')!} eager className="hero-main"/><Portrait profile={profileById('ember-vanguard')!} eager className="hero-side"/></div><span className="hero-edition">THE MIRROR COLLECTION / VOL. 02</span></section><div className="page-shell"><section className="opening-note"><span className="eyebrow">十四种倾向，另有隐藏篇章</span><h2>给复杂的自己，<br className="mobile-only"/>留一幅有细节的画像。</h2><p>从具体生活里的反应出发，看看自己怎样等待、行动、靠近与选择。心像是一份此刻的自述轮廓，允许多面，也允许变化。</p><div className="three-notes"><div><b>01 / 选择探索的长度</b><p>42、70 或 98 题，按自己的时间进入。遇不到的场景可以跳过，也可以换题。</p></div><div><b>02 / 看见你的心像</b><p>主要人格、相邻原型、十四项纹路，以及配套的描述与发展建议。</p></div><div><b>03 / 在同频处相遇</b><p>先了解相处提示；愿意分享本人联系方式的成年用户，可以自愿加入同好名录。</p></div></div></section><section><div className="section-head"><div><span className="eyebrow">FIVE HOUSES, EQUAL WORTH</span><h2>五处风景，各有归处。</h2></div><a href="/atlas" className="text-link">浏览全部心像 ↗</a></div><div className="family-overview">{families.map(f => <a key={f.id} href={'/atlas?family=' + f.id} style={palette(f.id)}><span className="family-symbol" aria-hidden="true">{f.id === 'lantern-court' ? '❧' : f.id === 'mountain-bastion' ? '△' : f.id === 'solar-citadel' ? '☼' : f.id === 'moonlit-cove' ? '☾' : '≈'}</span><h3>{f.name}</h3><p>{f.keywords}</p></a>)}</div></section><section className="home-preview"><div className="section-head"><div><span className="eyebrow">A GLIMPSE INTO THE ATLAS</span><h2>有些自己，还未相逢。</h2></div><a href="/atlas" className="text-link">翻开镜中群像 →</a></div><div className="profile-grid preview-grid">{['valley-listener', 'golden-sower', 'mirrorlake-seeker', 'gilded-starkeeper'].map(id => <ProfileCard key={id} profile={profileById(id)!} compact/>)}</div></section></div></>}
 {view === 'test' && <div className="page-shell narrow">{!ready ? <p className="loading">正在展开镜页…</p> : !session ? <><div className="page-heading"><span className="eyebrow">ENTER THE MIRROR</span><h1>选一种长度，<br />给自己一点时间。</h1><p>回想最近三个月，按最接近实际经历的程度选择。无需先决定“我是哪一种人”。</p></div><div className="mode-grid">{MODE_INFO.map(m => <button className="mode-card" key={m.count} onClick={() => begin(m.count)}><span className="eyebrow">{m.caption}</span><h2>{m.name}</h2><strong>{m.count}<small>题</small></strong><p>{m.detail}</p><span className="mode-time">{m.time} ↗</span></button>)}</div><div className="paper-note"><h3>把回答交给具体的生活。</h3><p>五档符合程度，每题一个选择。没有可参考的经历，或不愿回答，可选“跳过”；“换一题”会更换同一方向的不同场景，不计分。</p><p>题库有换题上限，备用题用完会提示。休息、疾病或现实条件的限制，本身不代表任何人格高低。你的作答只保存在本浏览器；加入名录时才会把本人的昵称、所选联系方式及服务器核验后的主原型保存到服务器。</p></div></> : <><div className="test-top"><div><span className="eyebrow">{MODE_INFO.find(m => m.count === session.mode)?.name} / 日常的镜面</span><p>第 <b>{session.index + 1}</b> / {session.mode} 题</p></div><button className="text-button" onClick={() => { window.location.assign('/'); }}>暂停并保存 ↗</button></div><div className="progress-track" role="progressbar" aria-label="作答进度" aria-valuemin={0} aria-valuemax={session.mode} aria-valuenow={session.ids.filter(id => session.answers[id] !== undefined).length}><i style={{ width: 100 * session.ids.filter(id => session.answers[id] !== undefined).length / session.mode + '%' }}/></div><fieldset className="question-scene" key={session.ids[session.index]}><legend><span className="question-counter">SCENE {String(session.index + 1).padStart(2, '0')}</span><span>{questionById(session.ids[session.index])?.text}</span></legend><p className="question-hint">这段反应与你最近三个月的实际经历，有多符合？</p><div className="degree-options">{['很不符合', '不太符合', '一半符合', '比较符合', '非常符合'].map((label, i) => <label key={i}><input type="radio" name="degree" value={i} checked={session.answers[session.ids[session.index]] === i} onChange={() => answer(i)}/><span><b>{String(i + 1).padStart(2, '0')}</b>{label}</span></label>)}</div><div className="question-tools"><button className={'text-button ' + (session.answers[session.ids[session.index]] === null ? 'chosen' : '')} onClick={() => answer(null)}>跳过 · 没有参考经历</button><button className="text-button" onClick={() => { const s = replaceQuestion(session); if (s)
        saveSession(s);
    else
        setNotice('这个方向的备用题已用完，可以保留本题或选择跳过。'); }}>换一面镜 ↻</button></div></fieldset><p className="status" role="status">{notice}</p><div className="test-navigation"><button className="button secondary" disabled={session.index === 0} onClick={() => move(-1)}>← 上一题</button><button className="button" disabled={session.answers[session.ids[session.index]] === undefined} onClick={() => session.index === session.mode - 1 ? complete() : move(1)}>{session.index === session.mode - 1 ? '生成我的心像 ↗' : '下一题 →'}</button></div><p className="note">已选择 {session.ids.filter(id => session.answers[id] !== undefined).length} / {session.mode} 题，进度保存在此浏览器。换题不会改变题量或推断换题动机。</p><details className="jump-details"><summary>查看进度与跳转</summary><div className="question-jumps">{session.ids.map((id, i) => <button key={id} className={(session.answers[id] !== undefined ? 'answered ' : '') + (i === session.index ? 'current' : '')} aria-label={'第' + (i + 1) + '题' + (session.answers[id] !== undefined ? '，已选' : '，未选')} onClick={() => saveSession({ ...session, index: i })}>{i + 1}</button>)}</div></details><button className="text-button danger" onClick={() => { if (window.confirm('清除尚未完成的这次进度？已有心像会保留。'))
        setSession(null); }}>放下这次进度</button></>} {!storageOK && <p className="status">浏览器未能保存进度，请保持页面打开，并在完成后下载心像。</p>}</div>}
 {view === 'atlas' && !detail && <div className="page-shell"><div className="page-heading atlas-heading"><span className="eyebrow">THE PERSONALITY ATLAS</span><h1>镜中群像</h1><p>五个家族，十四种心像与隐藏篇章。每一面都有自己的纹路，也有继续生长的方向。</p></div><div className="atlas-controls"><div className="filter-tabs"><button className={familyFilter === 'all' ? 'active' : ''} onClick={() => setFamilyFilter('all')}>全部家族</button>{families.map(f => <button className={familyFilter === f.id ? 'active' : ''} key={f.id} onClick={() => setFamilyFilter(f.id)}>{f.name}</button>)}</div><input className="search-input" type="search" aria-label="搜索人格" placeholder="搜索名字或特点…" value={search} onChange={e => setSearch(e.target.value)}/></div>{familyFilter !== 'all' && <p className="family-intro">{familyById(familyFilter).mood}</p>}<div className="profile-grid">{visibleProfiles.map(p => <ProfileCard key={p.id} profile={p}/>)}</div>{!visibleProfiles.length && <p className="empty-state">这页还没有这样的名字，换个关键词看看。</p>}</div>}
 {detail && <div className="page-shell"><a href="/atlas" className="back-link">← 返回镜中群像</a><section className="profile-detail"><div className="detail-art"><Portrait profile={detail} eager/></div><div className="detail-copy"><FamilyTag id={detail.familyId}/><span className="eyebrow">{familyById(detail.familyId).english}</span><h1>{detail.cn}</h1><p className="profile-english">{detail.en}</p><p className="profile-positioning">{detail.positioning}</p><p className="detail-intro">{detail.intro}</p>{detail.primary === null && <aside className="balanced-notice"><span>✧ 隐藏稀有人格</span><b>各项指标接近，没有明显突出的方向。</b></aside>}<PersonaBranches key={detail.id} profile={detail}/><a href="/test" className="button">探索我的心像 ↗</a></div></section><Recommendations profile={detail}/></div>}
 {view === 'heart' && <div className="page-shell">{!ready ? <p className="loading">正在打开你的心像匣…</p> : !heart ? <section className="empty-state"><span className="eyebrow">YOUR MIRROR ARCHIVE</span><h1>心像匣，还留着空白。</h1><p>完成一次探索，你的心像便会保存在此浏览器中。换设备或清除浏览器数据后，不会自动迁移。</p><a href="/test" className="button">开始入镜 ↗</a><a href="/atlas" className="text-link">先看人格图鉴 →</a></section> : <><div className="archive-top"><div><span className="eyebrow">YOUR HEARTSCAPE / 心像</span><p>{dateLabel(heart.completed)} · {heart.session.mode} 题 · 有效 {heart.session.ids.filter(id => Number.isInteger(heart.session.answers[id])).length} 题</p></div><label className="archive-select">心像匣<select aria-label="选择已保存心像" value={heart.session.id} onChange={e => setSelectedHeart(e.target.value)}>{history.map(h => <option value={h.session.id} key={h.session.id}>{dateLabel(h.completed)} · {h.session.mode}题</option>)}</select></label></div>{main && result ? <HeartReport key={heart.session.id} heart={heart} history={history} result={result}/> : <div className="empty-state"><h1>这一幅心像，还需要更多线索。</h1><p>至少十个方向需要达到有效题数，才能尝试匹配原型。每方向最低有效题数：轻量2题、标准3题、完整4题。你可以修改跳过的情景，或重新探索。</p><button className="button" onClick={() => { setSession({ ...heart.session, index: 0 }); try {
        localStorage.setItem(STORE, JSON.stringify({ session: { ...heart.session, index: 0 }, history }));
    }
    catch { } window.location.assign('/test'); }}>补充这次回答 →</button></div>}<details className="method-details"><summary>心像怎样形成 · 计分与局限</summary><p>五档符合程度记 0–4 分，反向题倒序计分。每个方向按题目权重计算均分，再除以4、乘以100。存在明显情境混淆的题目仅作为半权重弱线索；跳过不计入分母。</p><p>每方向最低有效题数为轻量2题、标准3题、完整4题。主要原型以主导方向86%、辅助方向14%的主题接近值排序；至少十个方向有效且首选主导分不低于35才显示突出型。十四方向全部有效且标准差不超过9时，以“昼夜织锦者”表示本次分布接近。以上为产品探索规则，未经信效度或人群常模验证。</p><p>换题和情境差异会影响结果。未显示的方向不能视为0分；轻量档线索较少。不存在“道德总分”、真实全人群占比或关系成功率。正常休息、饮食享受、性欲、性取向和关系形式本身不作价值判断。</p></details><div className="archive-actions"><a href="/test" className="button secondary">再照见一次 ↗</a><button className="text-button" onClick={() => { const ids = heart.session.ids; const first = ids.findIndex(id => heart.session.answers[id] === null); const s = { ...heart.session, index: first >= 0 ? first : 0 }; setSession(s); try {
        localStorage.setItem(STORE, JSON.stringify({ session: s, history }));
    }
    catch { } window.location.assign('/test'); }}>修改这份心像的回答</button><button className="text-button danger" onClick={() => { if (window.confirm('从本浏览器删除这份心像？服务器上的名录需在同频回廊单独退出。')) {
        setHistory(history.filter(h => h.session.id !== heart.session.id));
        setSelectedHeart('');
    } }}>删除本地心像</button></div></>}</div>}
 {view === 'meet' && <div className="page-shell"><div className="page-heading"><span className="eyebrow">THE RESONANCE GALLERY</span><h1>同频回廊</h1><p>先看见彼此的特点，再决定是否靠近。这里仅展示自愿加入、授权分享本人联系方式的成年用户。</p></div><div className="privacy-banner"><b>相遇由双方决定。</b><span>不加入也可以完成测试、收藏心像和阅读全部图鉴。联系方式由用户自行填写，本站未验证真实性；加入者可能复制或转发，请谨慎选择展示内容。</span><a href="/privacy">查看隐私与相遇约定 ↗</a></div>{authLoading ? <p className="loading">正在确认名录权限…</p> : !auth ? <div className="paper-card"><p className="status" role="alert">{apiMessage || '暂时无法连接名录。'}</p><button className="button secondary" onClick={() => setRetry(v => v + 1)}>重试</button></div> : <><section className="member-layout"><div className="member-intro"><span className="eyebrow">YOUR CALLING CARD</span><h2>{member ? '你在回廊里的名片' : '留一张自愿相识的名片。'}</h2><p>昵称必填，可用网名；邮箱、QQ、微信、手机号、GitHub 至少选择一种填写并勾选展示。</p>{member && <div className="member-summary"><FamilyTag id={member.familyId}/><h3>{member.nickname}</h3><p>{profileById(member.profileId)?.cn}</p><p className="profile-positioning">{profileById(member.profileId)?.positioning}</p><p className="small">展示至 {dateLabel(new Date(member.expiresAt).toISOString())}，到期自动停止展示；重新保存可续期90天。</p><button className="button secondary danger" disabled={busy} onClick={leave}>退出并删除我的名录记录</button></div>}<div className="paper-note"><b>心像与名片分别保管</b><p>心像逐题回答只保存在你的浏览器。加入时由服务器核验回答并计算主原型，仅保存名录所需的类型、本人昵称及所选联系方式，不保存整份答案。</p><p>无需账号登录，本浏览器会自动保存私密管理凭证。清除Cookie、使用无痕模式或换设备可能失去原名片管理入口；在清理前请先退出删除，共用设备上请谨慎加入。</p></div>{member && member.consentVersion!==CONSENT_VERSION && <p className="paper-note">名录现已免登录。请重新确认本页展示授权，旧授权名片在确认前不会向新规则下的加入者展示。</p>}{!heart && !member && <p><a href="/test" className="text-link">先完成一次心像测试 →</a></p>}</div><form className="member-form" onSubmit={join}><label className="field-label">昵称 / 网名 <span>必填</span><input required maxLength={32} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="让同好怎样称呼你" autoComplete="nickname"/></label><p className="small muted">只有勾选“展示此项”的内容会提交并保存；至少勾选并填写一项。</p>{Object.entries(contactLabels).map(([key, label]) => <div className="contact-field" key={key}><label className="field-label">{label}<input type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} value={contactValues[key] || ''} onChange={e => setContactValues({ ...contactValues, [key]: e.target.value })} maxLength={key === 'email' ? 254 : 64} placeholder={key === 'github' ? '账号名，如 yechuanio' : key === 'wechat' ? '微信号，不是昵称' : label} autoComplete="off"/></label><label className="check-label"><input type="checkbox" checked={!!visibleFields[key]} onChange={e => setVisibleFields({ ...visibleFields, [key]: e.target.checked })}/>展示此项</label></div>)}<div className="consent-box"><label><input type="checkbox" required checked={adult} onChange={e => setAdult(e.target.checked)}/><span>我确认自己已满18岁。</span></label><label><input type="checkbox" required checked={ownContact} onChange={e => setOwnContact(e.target.checked)}/><span>所填联系方式属于本人，不冒用、发布他人的联系方式。</span></label><label><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/><span>我已阅读<a href="/privacy" target="_blank" rel="noopener">隐私与相遇约定</a>，自愿将昵称、主心像及勾选的联系方式向其他已加入名录并确认授权的成年用户展示，并知道可随时退出删除。</span></label></div><p className="small muted">本次名片使用：{main?.cn || (member ? profileById(member.profileId)?.cn : '') || '请先完成有效心像'}。如有效回答不足，服务器会提示补充。</p><button className="button" disabled={busy || (!heart && !member)} type="submit">{busy ? '正在保存…' : member ? '更新名片并确认授权' : '加入名录，查看同好 →'}</button><p className="status" role="status">{apiMessage}</p></form></section>{activeMember && <section className="directory-section"><div className="section-head"><div><span className="eyebrow">PEOPLE, NOT LABELS</span><h2>在回廊里相遇</h2></div><button className="text-button" onClick={() => setRetry(v => v + 1)}>刷新 ↻</button></div><div className="directory-controls"><div className="filter-tabs">{[['same', '同型心像'], ['friends', '交友推荐'], ['romance', '恋爱推荐'], ['all', '全部已加入用户']].map(([id, label]) => <button className={directoryKind === id ? 'active' : ''} onClick={() => { setDirectoryKind(id); setOffset(0); }} key={id}>{label}</button>)}</div>{directoryKind === 'all' && <select aria-label="按心像类型筛选" value={directoryProfile} onChange={e => { setDirectoryProfile(e.target.value); setOffset(0); }}><option value="">全部心像</option>{profiles.map(p => <option value={p.id} key={p.id}>{p.cn}</option>)}</select>}</div><p className="note">推荐仅按你名片上的主原型与叙事性搭配建议筛选，不代表双方已经匹配、同意联系或适合交往。请先礼貌确认对方的交流意愿。</p>{directoryLoading ? <p className="loading">正在翻开这一页…</p> : directoryError ? <p className="status" role="alert">{directoryError}</p> : !directory.length ? <div className="empty-state small-empty"><h3>这里还很安静。</h3><p>还没有符合当前筛选、已授权展示的其他用户。可以换个筛选，或过段时间再来。</p></div> : <div className="directory-grid">{directory.map(m => { const p = profileById(m.profileId)!; return <article className="person-card" key={m.id} style={palette(m.familyId)}><div><Portrait profile={p}/><div><FamilyTag id={m.familyId}/><h3>{m.nickname}</h3><a href={'/atlas/' + p.id}>{p.cn} ↗</a><p className="profile-positioning">{p.positioning}</p></div></div><details><summary>查看本人授权的联系方式</summary><dl>{Object.entries(m.contacts).map(([key, value]) => <div key={key}><dt>{contactLabels[key]}</dt><dd>{key === 'github' ? <a href={'https://github.com/' + encodeURIComponent(value)} target="_blank" rel="noopener noreferrer">{value} ↗</a> : value}</dd></div>)}</dl><p className="note">用户自填，未经身份或联系方式验证。</p></details></article>; })}</div>}<div className="directory-pagination"><button className="button secondary" disabled={offset === 0 || directoryLoading} onClick={() => setOffset(Math.max(0, offset - 12))}>← 上一页</button><span>第 {Math.floor(offset / 12) + 1} 页</span><button className="button secondary" disabled={nextOffset === null || directoryLoading} onClick={() => setOffset(nextOffset!)}>下一页 →</button></div></section>}</>}</div>}
 {view === 'feedback' && <FeedbackPage/>}
 {view === 'disclaimer' && <Disclaimer/>}
 {view === 'about' && <div className="page-shell prose"><span className="eyebrow">NOTES BESIDE THE MIRROR</span><h1>镜笺</h1><p className="lead">每一种心像，都从具体生活里开始。</p><h2>十四面镜，十五种心像</h2><p>“十四面”指七美德与七宗罪相关的十四个观察方向；“心像”是这些倾向在本次回答里形成的象征性画像。十四种突出型，加上表示分布接近的昼夜织锦者，共十五种原型。</p><h2>如何阅读这份画像</h2><p>它是一份原创、非标准化自述探索，未进行信效度验证，没有人群常模。结果会受题目情境、记忆、自我期待及换题影响。心像不是固定身份、心理诊断或价值等级；不展示虚构的全人群占比。</p><h2>同频，也需要真实相处</h2><p>交友与恋爱搭配是按原型叙事设计的沟通提示，没有经过关系预测验证。推荐并不保证成功；需磨合也不意味着现实中的两个人不能相处。双方意愿、行为与边界始终优先。</p><h2>关于制作</h2><p>制作与维护：野川 yechuan。插画采用已确认的古典奇幻绘本风格，十五种人格保持同等画面分量，五大家族仅用于视觉与叙事归组。</p><p><a href="https://github.com/yechuanio/virtues-and-shadows" target="_blank" rel="noopener noreferrer">GitHub 公开源码 ↗</a> · 当前版本 v{VERSION}</p><a href="/test" className="button">从一次日常选择开始 →</a></div>}
 {view === 'privacy' && <div className="page-shell prose"><span className="eyebrow">PRIVACY & MUTUAL CONSENT</span><h1>隐私与相遇约定</h1><p className="lead">你决定是否相遇，也决定展示多少。</p><h2>无需联系方式的部分</h2><p>自测、人格图鉴、心像描述、相处提示及图片下载均可在不加入名录的情况下使用。进度和最近15份心像保存于当前浏览器，不自动跨设备同步；删除浏览器数据会清除它们。</p><h2>加入名录时</h2><p>仅限自报年满18岁的用户。无需任何账号登录。本浏览器自动保存仅用于管理本人名片的私密凭证；凭证通过HttpOnly Cookie保存，服务器仅存哈希。旧版已登录用户的已有名片会兼容绑定到浏览器凭证。你需填写昵称，并从邮箱、QQ、微信、手机号、GitHub 中至少填写且勾选一种本人联系方式，再明确授权向其他已加入名录并确认授权的用户展示。</p><p>服务器会用提交的本次回答核验并计算主原型；仅修改已有名片而不提交新答案时沿用此前核验的主原型。不保存整份逐题答案。保存项为浏览器凭证哈希、名录归属标识、名录ID、昵称、主原型与家族、所选联系方式、测试档位、同意版本与时间、更新及到期时间。联系方式不写入网站源码、公开Git仓库或浏览器持久存储。</p><h2>谁能看见</h2><p>本人可以读取和管理自己的名片。其他用户必须先自愿加入、持本人私密浏览器凭证并保持有效授权名片，才能分页查看名录。未加入或未授权的访问者不能通过名录接口获取联系方式。查询设有频率限制，不提供整库导出。浏览器管理凭证最长保存一年，持续使用时可续期；清除Cookie会失去该凭证。为限制滥用，服务器保存短期访问计数，边缘网络地址可用时仅使用其哈希作为限流标识。</p><h2>撤回、到期与限制</h2><p>可在持有私密管理凭证的浏览器中更新展示字段或点击“退出并删除我的名录记录”。清除Cookie或换设备可能失去管理入口；请在清理前先退出删除。退出后，服务器删除你的名片，你也停止查看名录；一次名片有效期90天，到期不再展示。别人此前自行复制或转发的信息无法由本站撤回。</p><h2>先确认，再联系</h2><p>名片由用户自行填写，本站未验证其成年声明、身份或联系方式归属。只发布本人的信息，尊重拒绝，不骚扰、不冒用、不批量收集。切勿仅凭人格推荐相信陌生人、转账或提供额外私密资料。</p><p>配对建议属于创作性相处提示，没有关系成功率统计。网站使用一般托管服务运行，主机可能保留必要的技术访问日志；本应用不主动记录逐题答案或联系方式到日志。</p><p>授权版本：{CONSENT_VERSION} · 网站版本：v{VERSION}</p><a href="/meet" className="button secondary">返回同频回廊 →</a></div>}
 </main>{view !== 'feedback' && <section className="site-collaboration"><div><span className="eyebrow">LET THE MIRROR GROW</span><h2>让下一面镜，更接近你。</h2><p>把建议留给站长野川 yechuan，或到 GitHub 一起完善题目、文案和体验。</p></div><div className="actions"><a className="button" href={'/feedback?from='+encodeURIComponent(view==='home'?'/':'/'+view+(detailId?'/'+detailId:''))}>给站长提建议 →</a><a className="button secondary" href="https://github.com/yechuanio/virtues-and-shadows" target="_blank" rel="noopener noreferrer">GitHub 参与共创 ↗</a></div></section>}<footer className="site-footer"><div><a href="/" className="footer-brand">十四面镜人格</a><p>让每一种心像，都有自己的纹路。</p></div><div><a href="/feedback">提建议与共创</a><a href="/about">镜笺</a><a href="/privacy">隐私与相遇约定</a><a href="https://github.com/yechuanio" target="_blank" rel="noopener noreferrer">野川 yechuan ↗</a><a href="https://github.com/yechuanio/virtues-and-shadows" target="_blank" rel="noopener noreferrer">公开源码 ↗</a><span>v{VERSION}</span></div><div className="footer-note legal-summary"><p>结果仅供自我观察，不是心理诊断或道德评级；分数不代表人群百分位，关系推荐不保证适配。</p><a className="button secondary" href="/disclaimer">查看完整声明 ↗</a></div></footer></div>;
}
