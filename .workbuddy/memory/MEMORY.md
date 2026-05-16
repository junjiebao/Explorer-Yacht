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
| knowledge.html | 游艇知识库 | knowledge.css |
| circumnavigation.html | 环球探险游艇 | series.css |
| research.html | 科考探险游艇 | series.css |
| polar.html | 极地探险游艇 | series.css |
| longrange.html | 远航探险游艇 | series.css |
| regional.html | 短距探险游艇 | series.css |
| buying-process.html | 购买流程 | buying-process.css |
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
