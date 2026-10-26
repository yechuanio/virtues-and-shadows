import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import { CONSENT_VERSION, interpret, profiles, validSession, type Session } from './mirror';
export const CONTACT_KEYS = ['email', 'qq', 'wechat', 'phone', 'github'] as const;
export function api(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Vary': 'Cookie, oai-authenticated-user-id', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, noarchive', 'Referrer-Policy': 'no-referrer' } }); }
export function failure(message: string, status = 400) { return api({ error: message }, status); }
export function db() { if (!env.DB)
    throw new Error('DATABASE_UNAVAILABLE'); return env.DB; }
export async function actor() { return getChatGPTUser(); }
export function sameOrigin(request: Request) { const origin = request.headers.get('origin'); return !!origin && origin === new URL(request.url).origin; }
export async function body(request: Request) {
    if (!request.headers.get('content-type')?.includes('application/json'))
        throw new Error('请使用页面内表单提交。');
    if (Number(request.headers.get('content-length') || 0) > 18000)
        throw new Error('提交内容过长。');
    if (!request.body)
        throw new Error('请填写完整表单。');
    const reader = request.body.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        size += value.length;
        if (size > 18000) {
            await reader.cancel();
            throw new Error('提交内容过长。');
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
}
export async function rate(owner: string, action: string, max: number, windowMs: number) {
    const bucket = Math.floor(Date.now() / windowMs), key = `${owner}:${action}:${bucket}`;
    const row = await db().prepare('INSERT INTO access_limits (key,hits,window_end) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key, (bucket + 1) * windowMs).first<{
        hits: number;
    }>();
    await db().prepare('DELETE FROM access_limits WHERE key IN (SELECT key FROM access_limits WHERE window_end < ? LIMIT 100)').bind(Date.now() - 86400000).run();
    return !!row && row.hits <= max;
}
export function contacts(input: unknown) {
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error('请选择至少一项愿意展示的联系方式。');
    const result: Record<string, string> = {};
    for (const key of CONTACT_KEYS) {
        const raw = (input as Record<string, unknown>)[key];
        if (raw === undefined || raw === '')
            continue;
        if (typeof raw !== 'string')
            throw new Error('联系方式格式不正确。');
        const value = raw.trim();
        if (!value || value.length > 254 || /[\u0000-\u001f\u007f]/.test(value))
            throw new Error('联系方式格式不正确。');
        if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            throw new Error('请检查邮箱格式。');
        if (key === 'qq' && !/^[1-9]\d{4,12}$/.test(value))
            throw new Error('请检查 QQ 号码。');
        if (key === 'wechat' && !/^[A-Za-z0-9_-]{3,64}$/.test(value))
            throw new Error('微信账号请使用字母、数字、下划线或短横线。');
        if (key === 'phone' && (!/^\+?[0-9 ()-]{7,24}$/.test(value) || !/^[0-9]{7,15}$/.test(value.replace(/[^0-9]/g, ''))))
            throw new Error('请检查手机号格式。');
        if (key === 'github' && !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value))
            throw new Error('GitHub 请填写账号名，不要填写完整网址。');
        result[key] = value;
    }
    if (!Object.keys(result).length)
        throw new Error('至少填写并勾选展示一种联系方式。');
    return result;
}
export function verifiedHeart(value: unknown) {
    if (!validSession(value))
        throw new Error('请先完成一份有效的心像测试。');
    const s = value as Session;
    if (s.ids.some(id => s.answers[id] === undefined))
        throw new Error('请先完成测试，未遇到的情景可选跳过。');
    const result = interpret(s.mode, s.ids, s.answers);
    if (result.scores.some(score => score.score === null) || !result.matches[0])
        throw new Error('当前心像信息不足，请补充有效回答后再加入名录。');
    return { profile: result.matches[0].profile, mode: s.mode };
}
export type Member = {
    owner_id: string;
    id: string;
    nickname: string;
    profile_id: string;
    family_id: string;
    contacts_json: string;
    consent_version: string;
    adult_confirmed: number;
    mode: number;
    created_at: number;
    updated_at: number;
    expires_at: number;
};
export async function ownMember(owner: string) { return db().prepare('SELECT * FROM members WHERE owner_id=?').bind(owner).first<Member>(); }
export function safeMember(m: Member) { return { id: m.id, nickname: m.nickname, profileId: m.profile_id, familyId: m.family_id, contacts: JSON.parse(m.contacts_json), consentVersion: m.consent_version, updatedAt: m.updated_at, expiresAt: m.expires_at, verified: false }; }
export function knownProfile(id: string) { return profiles.some(p => p.id === id); }
