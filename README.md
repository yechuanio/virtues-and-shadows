# 十四面镜人格 · Fourteen Mirrors

**v2.0.0** · 制作与维护：[野川 yechuan](https://github.com/yechuanio)

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
npm run dev -- --port 5173 --hostname 127.0.0.1
```

本地登录模拟仅用于本地开发，生产登录由Sites托管平台负责。数据库绑定位于`.openai/hosting.json`；复制项目部署时应使用自己的Site身份与托管配置。

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
- 只有已登录、已加入、持有效当前授权名片的用户可分页查看其他授权用户。没有匿名联系人接口或整库导出。
- 服务器重新计算主原型，不信任客户端的类型声明。不保存整份逐题答案，只存名录必要字段。
- 支持本人更新、90天到期停止展示、退出删除、频率限制。其他用户先前自行保存的信息无法由本站撤回。
- Sites稳定站点内用户ID作为记录归属依据，登录邮箱不会自动作为展示联系方式。
- `members`和`access_limits`仅存在D1，数据库导出、联系人、凭据、本地运行状态均不得提交Git。

## 如何理解

原创非标准化自述探索，未验证信效度，无人群常模或临床分界线。角色匹配、弱线索权重及相处搭配是公开可审阅的产品规则，不作诊断、等级或关系成功率承诺，不展示虚构全人群比例。

换题、情境、记忆会影响结果。正常休息、饮食享受、性欲、性取向及关系形式本身不作价值判断。所有人格同等价值。

## 版本

VERSION、package.json与Git发布标签统一使用语义版本。v2.0.0为本次完整升级，旧版历史由Git保留。15张WebP插画沿用已确认的绘本风格。
