# 十四面镜人格 · Fourteen Mirrors

**v3.2.0** · 制作与维护：[野川 yechuan](https://github.com/yechuanio)

[在线体验](https://virtues-and-shadows-98.peppyvale17.chatgpt.site) · [公开源码](https://github.com/yechuanio/virtues-and-shadows) · [更新记录](CHANGELOG.md)

210道日常情境、42/70/98题三档、十四种“心像”、一个隐藏篇章与五个家族。结果包含中英文名、插画、十四项倾向、发展建议与叙事性相处提示。

## 页面

- `/` 镜序；`/test` 入镜；`/atlas` 镜中群像；`/atlas/<id>` 人格详情。
- `/heart` 心像匣：本浏览器最近15份心像、图片收藏和打印。
- `/meet` 同频回廊：成年人自愿加入、明确授权的受保护同好名录。
- `/about` 镜笺；`/privacy` 隐私与相遇约定。

## 本地运行

需要Node.js22.13+，采用Vinext、React、Cloudflare Workers、D1与Drizzle。

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_easy_gamma_corps.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_loving_selene.sql
npm run dev -- --port 5173 --hostname 127.0.0.1
```

上面的完整迁移命令用于新建本地数据库；已有数据库只执行尚未应用的迁移，不要重复创建已有表。本地登录模拟仅用于旧版兼容检查，旧版账号兼容由Sites托管平台负责，新用户无需账号登录。数据库绑定位于`.openai/hosting.json`；复制项目部署时应使用自己的Site身份与托管配置。

## 校验

```sh
npx tsc --noEmit
npm test
# 只在本地5173预览运行时执行；脚本硬编码127.0.0.1，不能指向生产：
node tests/community-local.cjs
```

集成检查使用明确的虚构本地夹具并在结束时删除，不得用于生产迁移。

## 名录隐私边界

- 测试、图鉴和心像无需联系方式。
- 用户确认年满18岁；昵称和至少一种勾选的本人联系方式必填，授权默认不勾选。
- 只有已加入、持私密浏览器凭证与有效当前授权名片的用户可分页查看其他授权用户。没有匿名联系人接口或整库导出。
- 服务器重新计算主原型，不信任客户端的类型声明。不保存整份逐题答案，只存名录必要字段。
- 支持本人更新、90天到期停止展示、退出删除、频率限制。其他用户先前自行保存的信息无法由本站撤回。
- 无需ChatGPT或其他账号登录。服务器生成私密浏览器凭证，通过HttpOnly、SameSite=Strict Cookie保存（HTTPS下加Secure和__Host-前缀），服务器仅存哈希。旧版身份仅用于兼容已有名片，首次打开后绑定浏览器凭证。清除Cookie或换设备可能失去管理入口，请在清理前退出删除。
- `members`、`member_sessions`和`access_limits`仅存在D1，数据库导出、联系人、凭据、本地运行状态均不得提交Git。

## 如何理解

原创非标准化自述探索，未验证信效度，无人群常模或临床分界线。角色匹配、弱线索权重及相处搭配是公开可审阅的产品规则，不作诊断、等级或关系成功率承诺，不展示虚构全人群比例。

换题、情境、记忆会影响结果。正常休息、饮食享受、性欲、性取向及关系形式本身不作价值判断。所有人格同等价值。

## 版本

VERSION、package.json与Git发布标签统一使用语义版本。v3.0.0为本次完整升级，旧版历史由Git保留。15张WebP插画沿用已确认的绘本风格。


v2.0.1取消联系方式填写前的ChatGPT登录要求。新授权版本为2026-10-27-v2；旧名片需重新明确授权，才会向免登录加入者展示。

## v3.0.0 心像报告

结果顺序为十四道纹路（两张雷达图与十四条柱状图）、四特点、人格底色、对应成长建议、相近人格和交友/恋爱推荐。四特点只按有效分数选择七美德最高/最低和七宗罪最低/最高；并列按维度顺序且不重复，未显著高/低时使用收敛措辞。缺失不当作零分。

支持1200×1800家族配色PNG心像卡、完整文字TXT/复制、四段本地反馈、悬停/触控行动说明、每周小实验和真实浏览器历史对照。反馈不发服务器、不随导出；无历史时不生成虚构记录。

“昼夜织锦者”为隐藏篇章，显示在图鉴中，卡片、详情与结果均标注“隐藏稀有人格”。只有14项均有效、标准差不超过9且最高最低差不超过20，才显示“各项指标接近，没有明显突出的方向”。此规则是产品匹配条件，不是统计稀有率或更高等级。

五大家族分别提供庭院绿金、山岳灰绿、日冕赭金、镜月紫灰、云岚青雾主题，尊重系统减少动态偏好。现有名录授权与私密浏览器凭证不变。

## 建议与共创

站内 `/feedback` 将填写的建议整理成预填GitHub Issue，用户登录GitHub并确认后才公开发布到项目仓库。本站不自动创建Issue，不读取或附带逐题答案、联系方式或浏览器凭证。全站底部提供建议与共创入口，参与方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## v3.2.0 三种主导分类

七美德、七宗罪分别计算有效指标的平均分，每组至少5项有效才分类。使用未取整均分：差值绝对值≤10分为中性，超过10分由较高组决定善主导或恶主导。缺失不算零分，覆盖不足显示倾向待定。此分类与昼夜织锦者的十四项接近条件分别计算。

15个人格各有善、恶、中性三套用户提供的定稿，包含底色标题、双段正文、建议标题与建议。结果按分数选择，图鉴可切换三种；不再随机轮换A/B。旧心像依现有答案重新计算，无需改存储或重测。结果名称、PNG、TXT包含同一分类标签。构建前运行文案完整性检查，防止漏接文案。
