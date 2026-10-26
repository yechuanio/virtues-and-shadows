# 十四面镜人格 · Fourteen Mirrors

**v2.0.2** · 制作与维护：[野川 yechuan](https://github.com/yechuanio)

[在线体验](https://virtues-and-shadows-98.peppyvale17.chatgpt.site) · [公开源码](https://github.com/yechuanio/virtues-and-shadows) · [更新记录](CHANGELOG.md)

210道日常情境、42/70/98题三档、十五种“心像”与五个家族。结果包含中英文名、插画、十四项倾向、发展建议与叙事性相处提示。

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
node --test tests/core.test.cjs
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

VERSION、package.json与Git发布标签统一使用语义版本。v2.0.0为本次完整升级，旧版历史由Git保留。15张WebP插画沿用已确认的绘本风格。


v2.0.1取消联系方式填写前的ChatGPT登录要求。新授权版本为2026-10-27-v2；旧名片需重新明确授权，才会向免登录加入者展示。
