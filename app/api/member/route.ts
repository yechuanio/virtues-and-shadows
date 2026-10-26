import { actor, api, body, contacts, db, failure, ownMember, rate, safeMember, sameOrigin, verifiedHeart } from '../../../lib/community';
import { CONSENT_VERSION } from '../../../lib/mirror';
export const dynamic = 'force-dynamic';
export async function GET() { try {
    const user = await actor();
    if (!user)
        return api({ signedIn: false, member: null });
    const m = await ownMember(user.userId);
    return api({ signedIn: true, member: m ? safeMember(m) : null });
}
catch {
    return failure('名录暂时不可用，请稍后重试。', 503);
} }
export async function PUT(request: Request) {
    try {
        const user = await actor();
        if (!user)
            return failure('请先登录后加入名录。', 401);
        if (!sameOrigin(request))
            return failure('请求来源不受信任。', 403);
        if (!await rate(user.userId, 'write', 12, 3600000))
            return failure('修改过于频繁，请稍后再试。', 429);
        const data = await body(request);
        if (data.publish !== true || data.adult !== true || data.ownContacts !== true || data.consentVersion !== CONSENT_VERSION)
            return failure('请确认已满18岁、仅填写本人信息，并同意向其他已加入的用户展示所选联系方式。');
        if (typeof data.nickname !== 'string')
            return failure('请填写昵称，可使用网名。');
        const nickname = data.nickname.trim();
        if (nickname.length < 1 || nickname.length > 32 || /[\u0000-\u001f\u007f]/.test(nickname))
            return failure('昵称需为1至32个字符。');
        const published = contacts(data.contacts), heart = verifiedHeart(data.heart), now = Date.now();
        const current = await ownMember(user.userId);
        const id = current?.id || crypto.randomUUID();
        await db().prepare('INSERT INTO members (owner_id,id,nickname,profile_id,family_id,contacts_json,consent_version,adult_confirmed,mode,created_at,updated_at,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET nickname=excluded.nickname,profile_id=excluded.profile_id,family_id=excluded.family_id,contacts_json=excluded.contacts_json,consent_version=excluded.consent_version,adult_confirmed=excluded.adult_confirmed,mode=excluded.mode,updated_at=excluded.updated_at,expires_at=excluded.expires_at').bind(user.userId, id, nickname, heart.profile.id, heart.profile.familyId, JSON.stringify(published), CONSENT_VERSION, 1, heart.mode, current?.created_at || now, now, now + 90 * 86400000).run();
        return api({ signedIn: true, member: safeMember((await ownMember(user.userId))!) });
    }
    catch (e) {
        if (e instanceof Error && e.message === 'DATABASE_UNAVAILABLE')
            return failure('名录暂时不可用，请稍后重试。', 503);
        return failure(e instanceof Error && e.message.length < 150 && /[\u4e00-\u9fff]/.test(e.message) ? e.message : '无法保存，请稍后重试。');
    }
}
export async function DELETE(request: Request) { try {
    const user = await actor();
    if (!user)
        return failure('请先登录。', 401);
    if (!sameOrigin(request))
        return failure('请求来源不受信任。', 403);
    await db().prepare('DELETE FROM members WHERE owner_id=?').bind(user.userId).run();
    return api({ deleted: true });
}
catch {
    return failure('暂时无法退出名录，请稍后重试。', 503);
} }
