import relationships from '../../../data/relationships.json';
import { actor, api, db, failure, knownProfile, ownMember, rate, safeMember, type Member } from '../../../lib/community';
import { CONSENT_VERSION } from '../../../lib/mirror';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
    try {
        const user = await actor(request);
        if (!user)
            return failure('请先打开名片表单并自愿加入名录后查看。', 401);
        const own = await ownMember(user.userId);
        if (!own || own.expires_at <= Date.now() || own.adult_confirmed !== 1 || own.consent_version !== CONSENT_VERSION)
            return failure('请先提交本人昵称、至少一种展示联系方式并确认当前授权。', 403);
        if (!await rate(user.userId, 'browse', 30, 600000))
            return failure('查看过于频繁，请稍等片刻再来。', 429);
        const params = new URL(request.url).searchParams;
        const kind = params.get('kind') || 'same';
        if (!['same', 'friends', 'romance', 'all'].includes(kind))
            return failure('筛选方式无效。');
        const offset = Number(params.get('offset') || 0);
        if (!Number.isInteger(offset) || offset < 0 || offset > 10000)
            return failure('页码无效。');
        let ids: string[] = [];
        if (kind === 'same')
            ids = [own.profile_id];
        if (kind === 'friends' || kind === 'romance') {
            const relation = relationships[own.profile_id as keyof typeof relationships];
            ids = relation?.[kind].recommended.map((p: {
                id: string;
            }) => p.id) || [];
        }
        if (kind === 'all' && params.get('profile')) {
            const id = params.get('profile')!;
            if (!knownProfile(id))
                return failure('心像类型无效。');
            ids = [id];
        }
        const filter = ids.length ? ` AND profile_id IN (${ids.map(() => '?').join(',')})` : '';
        const rows = await db().prepare('SELECT * FROM members WHERE owner_id<>? AND expires_at>? AND adult_confirmed=1 AND consent_version=?' + filter + ' ORDER BY updated_at DESC,id ASC LIMIT 13 OFFSET ?').bind(user.userId, Date.now(), CONSENT_VERSION, ...ids, offset).all<Member>();
        const results = rows.results || [];
        return api({ members: results.slice(0, 12).map(safeMember), nextOffset: results.length > 12 ? offset + 12 : null, kind });
    }
    catch {
        return failure('名录暂时不可用，请稍后重试。', 503);
    }
}
