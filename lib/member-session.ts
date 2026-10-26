import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
const YEAR = 365 * 86400000;
export type MemberActor = {
    userId: string;
    keyHash: string | null;
};
function store() { if (!env.DB)
    throw new Error('DATABASE_UNAVAILABLE'); return env.DB; }
function cookieName(request: Request) { return new URL(request.url).protocol === 'https:' ? '__Host-mirror_member' : 'mirror_member_local'; }
function readToken(request: Request) { const name = cookieName(request) + '='; const value = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith(name))?.slice(name.length); return value && /^[a-f0-9]{64}$/.test(value) ? value : null; }
async function hash(value: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(n => n.toString(16).padStart(2, '0')).join(''); }
function newToken() { return [...crypto.getRandomValues(new Uint8Array(32))].map(n => n.toString(16).padStart(2, '0')).join(''); }
function cookie(request: Request, token: string) { return `${cookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${YEAR / 1000}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`; }
async function browserActor(request: Request) { const token = readToken(request); if (!token)
    return null; const keyHash = await hash(token); const row = await store().prepare('SELECT owner_id,expires_at FROM member_sessions WHERE key_hash=? AND expires_at>?').bind(keyHash, Date.now()).first<{
    owner_id: string;
    expires_at: number;
}>(); return row ? { userId: row.owner_id, keyHash, expiresAt: row.expires_at, token } : null; }
export async function resolveMemberActor(request: Request): Promise<MemberActor | null> {
    const browser = await browserActor(request);
    if (browser)
        return { userId: browser.userId, keyHash: browser.keyHash };
    // Optional compatibility with an already-authenticated v2.0.0 client; no redirect.
    const legacy = await getChatGPTUser();
    return legacy ? { userId: legacy.userId, keyHash: null } : null;
}
export async function openMemberSession(request: Request) {
    if (request.headers.get('sec-fetch-site') === 'cross-site')
        throw new Error('请在本站页面打开名片表单。');
    const existing = await browserActor(request);
    if (existing) {
        if (existing.expiresAt < Date.now() + YEAR / 2) {
            await store().prepare('UPDATE member_sessions SET expires_at=? WHERE key_hash=?').bind(Date.now() + YEAR, existing.keyHash).run();
            return { user: existing, setCookie: cookie(request, existing.token) };
        }
        return { user: existing, setCookie: null };
    }
    const address = request.headers.get('cf-connecting-ip');
    if (address && /^[a-fA-F0-9:.]{3,64}$/.test(address)) {
        const bucket = Math.floor(Date.now() / 3600000), key = 'member-session:' + await hash(address) + ':' + bucket;
        const n = await store().prepare('INSERT INTO access_limits (key,hits,window_end) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key, (bucket + 1) * 3600000).first<{
            hits: number;
        }>();
        if (!n || n.hits > 300)
            throw new Error('创建名片凭证过于频繁，请稍后重试。');
    }
    const legacy = await getChatGPTUser();
    const token = newToken(), keyHash = await hash(token), userId = legacy?.userId || 'browser:' + crypto.randomUUID(), now = Date.now();
    await store().prepare('INSERT INTO member_sessions (key_hash,owner_id,created_at,expires_at) VALUES (?,?,?,?)').bind(keyHash, userId, now, now + YEAR).run();
    // Bounded housekeeping; never log or return credential values in JSON.
    await store().prepare('DELETE FROM member_sessions WHERE key_hash IN (SELECT key_hash FROM member_sessions WHERE expires_at<? LIMIT 100)').bind(now).run();
    return { user: { userId, keyHash }, setCookie: cookie(request, token) };
}
