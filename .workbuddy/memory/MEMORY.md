# 项目长期记忆 — Explorer Yacht

## 项目概览
探险游艇（Explorer Yacht）品牌网站，面向华人海外游艇买家。覆盖迪拜、香港、深圳、海南市场。New Yachting FZE, LLC 运营。

## 网站结构
| 页面 | 用途 | 专属 CSS |
|------|------|---------|
| index.html | 首页，含成本计算器 + 问卷 | index.css |
| portfolio.html | 游艇分类展示 | portfolio.css |
| customization.html | 定制改造中心，含视频展示 | customization.css |
| about.html | 关于我们（含 A/B 步骤表单） | about.css |
| contact.html | 联系方式 | contact.css |
| knowledge.html | 游艇知识库（含精品航线推荐版块） | knowledge.css |
| circumnavigation.html | 环球探险游艇 | series.css |
| research.html | 科考探险游艇 | series.css |
| polar.html | 极地探险游艇 | series.css |
| longrange.html | 远航探险游艇 | series.css |
| regional.html | 短距探险游艇 | series.css |
| buying-process.html | 购买流程 | buying-process.css |
| ebook.html | 电子书推广页（探险游艇行业新宠儿） | ebook.css |
| admin-login.html | 管理后台登录 | (内联) |
| admin.html | 管理后台 | (内联) |

## 公共资源
- **styles.css** — 全局样式 + 导航栏 + 页脚 + 侧边栏联系方式
- **series.css** — 系列页面共享样式 + 导航覆写
- **nav.js** — 全局导航 JavaScript

## CSS 架构规范
- 页面特定样式统一放在独立 CSS 文件中（如 index.css, customization.css），HTML 中不留内联 `<style>` 块
- 页脚样式集中在 styles.css，所有页面共享
- 导航覆写（.top-bar 隐藏 + .main-nav 毛玻璃）在 series.css 和 portfolio.css 中

## 联系信息（硬编码于各页面 footer）
- WhatsApp: +971561018837
- 微信 ID: Joeybaojunjie
- 邮箱: Build/listing/manage/charter@tanxianyouting.com

## 已完成的重要修复
- **P0:** 7个页面重复 `<title>` 标签删除
- **P0:** ~2800 行重复内联 CSS 提取到 styles.css / series.css / portfolio.css
- **P1:** ~1600 行残留页脚内联 CSS 清理，3 个文件内联块归零（contact, customization, index）
- **P0:** series.css 第566行 CSS 语法错误（多余 `}`）修复
- **P1:** buying-process.html / about.html 内联CSS 提取到 buying-process.css / about.css
- **P1:** 全 9 个 CSS 文件补全 `@media (max-width: 480px)` 断点，移动端小屏适配
- 侧边栏联系方式组件统一部署到所有 12 个页面
- 3 个无关页面（blog.html, buy.html, rent.html）已删除
- 12 个面向用户页面内联 `<style>` 块全部归零
- **P1:** Portfolio 游艇分类卡片文字可读性修复 — 增强渐变覆盖、标题金色高亮、文本阴影加持
- 电子书独立页面（ebook.html + ebook.css）创建，含3D书籍模型、章节展示、作者卡片、CTA表单
- portfolio.css / knowledge.css 中所有 ebook-* 样式已删除，知识库"购买指南"版块用独立 `.buying-guide-cta` 类替代
- 全站 12 个用户页面主导航 + 页脚均添加"电子书"链接
- **longrange.html / regional.html 页脚补全** — 从简陋版权文字升级为完整 site-footer 四栏结构
- **首页移除游艇分类5卡片模块** — index.html 中 `<section class="yacht-categories">` 已删除
- **二手游艇购买指南移动** — 从 knowledge.html 移至 about.html 经纪顾问模块下方，样式迁移至 about.css
- **ebook.html CTA 改为 Kdocs 直链** — 移除邮箱表单，"立即获取"直接跳转 https://www.kdocs.cn/l/cf14UpVftfVq
- **contact.html 移除业务邮箱模块 + 阿曼联系方式** — 含所有 SEO meta/结构化数据中的 Oman 引用清理
- **全站页脚"服务项目"→"探险游艇类别"** — 10 个 HTML 文件批量替换
- **knowledge.html 旧模块移除** — "自持力三个方面"、"特有能力"、"其他特点"三个section全部删除
- **新增精品航线推荐版块** — knowledge.html 新增 id="premium-routes" 版块，含6条航线卡片+CTA，样式在 knowledge.css
- **首页新增精品航线按钮** — hero 区四按钮排列：种类→精品航线→成本计算→调研问卷，链接 knowledge.html#premium-routes
