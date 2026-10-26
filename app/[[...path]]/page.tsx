import MirrorApp from '../mirror-app';
import { notFound } from 'next/navigation';
import { profileById } from '../../lib/mirror';
const titles: Record<string, string> = { home: '镜序', test: '入镜', atlas: '镜中群像', heart: '心像匣', meet: '同频回廊', about: '镜笺', privacy: '隐私与相遇约定' };
export async function generateMetadata({ params }: {
    params: Promise<{
        path?: string[];
    }>;
}) { const { path = [] } = await params; return { title: `${path[0] === 'atlas' && path[1] ? profileById(path[1])?.cn || '镜中群像' : titles[path[0] || 'home'] || '镜序'} · 十四面镜人格` }; }
export default async function Page({ params }: {
    params: Promise<{
        path?: string[];
    }>;
}) { const { path = [] } = await params; const view = path[0] || 'home'; if (!titles[view] || path.length > 2 || (path.length === 2 && (view !== 'atlas' || !profileById(path[1]))))
    notFound(); return <MirrorApp view={view} detailId={path[1] || ''}/>; }
