export const GITHUB_REPOSITORY = 'https://github.com/yechuanio/virtues-and-shadows';
export const FEEDBACK_KINDS = ['题目与文案', '功能建议', '使用问题', '界面与体验', '其他想法'] as const;
export type FeedbackDraft = { kind: string; title: string; content: string; page: string };

export function feedbackIssueUrl(draft: FeedbackDraft, version: string): string {
  const kind = FEEDBACK_KINDS.includes(draft.kind as typeof FEEDBACK_KINDS[number]) ? draft.kind : '其他想法';
  const title = draft.title.trim().slice(0,80), content = draft.content.trim().slice(0,1600), page = draft.page.trim().slice(0,160);
  if (!title || content.length < 5) throw Error('请填写标题和至少5个字的建议内容。');
  const body = ['## 建议类型',kind,'','## 想对站长说',content,'','## 相关页面',page || '未填写','','## 网站版本','v'+version].join('\n');
  const url = new URL(GITHUB_REPOSITORY+'/issues/new');
  url.searchParams.set('title','['+kind+'] '+title);
  url.searchParams.set('body',body);
  return url.toString();
}
