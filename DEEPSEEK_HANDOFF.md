# newlife30 / 30天重建人生体系 DeepSeek 交接信息

更新时间：2026-07-06

用途：把本机项目、局域网/服务器目录、GitHub 接入信息一次性交给 DeepSeek 或另一个 Codex 接手。

重要边界：本文档不写入服务器密码、GitHub token、微信账号凭证或任何密钥。需要登录时，优先使用本机已经配置好的 GitHub CLI / SSH；如果换机器，请由项目 owner 单独授权，不要把密钥写进代码、GitHub、聊天记录或文档。

## 1. 本机电脑上的文件夹

本机项目根目录：

```bash
/Users/linzhang/Downloads/      OPC/30天重建人生体系
```

路径里 `OPC` 前有多个空格，进入项目必须加引号：

```bash
cd '/Users/linzhang/Downloads/      OPC/30天重建人生体系'
```

当前本机 Git 状态：

```text
branch: main
local HEAD: 385e6e2 Add user-centered iteration loops
origin/main: 1086b99 feat: 金句展示+动画计数器+滚动条+页面过渡
state: 本机 main 比 GitHub origin/main ahead 1
untracked: DEEPSEEK_HANDOFF.md
```

解释：

- 本机已经有一版用户导向/留存机制更新，commit 是 `385e6e2`。
- 这个 commit 目前还没有推送到 GitHub，也没有部署到服务器。
- 如果 DeepSeek 要基于“本机最新版本”继续做，请先确认是否执行 `git push origin main`。
- 如果 DeepSeek 只基于 GitHub 远程做，它看到的是 `1086b99`，会少掉本机最新一轮用户导向改版。

本地开发命令：

```bash
npm ci
npm run dev -- --port 5174
```

本机访问：

```text
http://localhost:5174/
```

同一局域网访问，先启动 Vite，再用本机局域网 IP：

```text
http://192.168.43.136:5174/
```

当前机器名：

```text
MacBook-Pro-2
```

常用检查命令：

```bash
npm run build
npm run miniprogram:check
npm run miniprogram:submit-check
```

## 2. 内部网络 / 服务器文件夹

线上域名：

```text
https://newlife30.cn/
https://www.newlife30.cn/
```

DNS / CNAME：

```text
public/CNAME = newlife30.cn
```

服务器入口：

```text
host: 43.128.114.201
ssh: ubuntu@43.128.114.201
server hostname: VM-4-10-ubuntu
region: 新加坡 ap-singapore
```

服务器上的 Git 仓库目录：

```bash
/var/www/newlife30/repo
```

服务器上的 Nginx 静态站点目录：

```bash
/var/www/newlife30/current
```

当前服务器版本：

```text
server repo HEAD: 1086b99
server origin: https://github.com/MoKangMedical/30-day-life-restart-platform.git
```

说明：

- 服务器当前版本和 GitHub `origin/main` 一致，都是 `1086b99`。
- 本机最新 commit `385e6e2` 尚未推到 GitHub，因此服务器也还没有这版。

服务器部署命令：

```bash
ssh ubuntu@43.128.114.201 'set -e
cd /var/www/newlife30/repo
git fetch origin main
git reset --hard origin/main
npm ci
npm run build
rsync -a --delete dist/ /var/www/newlife30/current/
sudo nginx -t
sudo systemctl reload nginx
git rev-parse --short HEAD'
```

已知服务器提示：

```text
npm audit 可能提示 3 vulnerabilities。
nginx -t 可能出现 protocol options redefined warning，但 syntax is ok / test is successful 时可以 reload。
```

## 3. GitHub 接入信息

GitHub 仓库：

```text
https://github.com/MoKangMedical/30-day-life-restart-platform
https://github.com/MoKangMedical/30-day-life-restart-platform.git
```

仓库信息：

```text
owner/org: MoKangMedical
repo: 30-day-life-restart-platform
visibility: PUBLIC
default branch: main
```

本地 remote：

```text
origin https://github.com/MoKangMedical/30-day-life-restart-platform.git (fetch)
origin https://github.com/MoKangMedical/30-day-life-restart-platform.git (push)
```

本地 Git 分支绑定：

```text
branch.main.remote = origin
branch.main.merge = refs/heads/main
```

本机 Git 用户配置：

```text
user.name = MoKangMedical
user.email = deploy@medroundtable.com
credential.helper = gh auth git-credential
```

GitHub CLI 登录状态：

```text
logged in account: MoKangMedical
git protocol: https
token scopes: gist, read:org, repo, workflow
```

说明：

- 本机已经通过 GitHub CLI 登录，DeepSeek 在同一台 Mac、同一系统用户下通常可以直接 `git pull` / `git push`。
- 不要把 `gh` token 打印、复制或写入文档。
- 如果 DeepSeek 在另一台机器运行，需要重新登录 GitHub：

```bash
gh auth login
gh auth status
```

GitHub Pages 自动部署 workflow：

```text
.github/workflows/deploy-pages.yml
```

触发条件：

```text
push 到 main
workflow_dispatch 手动触发
```

workflow 做的事情：

```text
npm ci
npm run build
upload dist
deploy GitHub Pages
```

## 4. 项目文件结构

核心网页端文件：

```text
index.html
vite.config.js
package.json
package-lock.json
src/App.jsx
src/styles.css
src/data.js
src/systemCourses.js
src/main.jsx
```

公开资源：

```text
public/CNAME
public/audio/system-courses/01-energy.mp3
public/audio/system-courses/02-rhythm.mp3
public/audio/system-courses/03-action.mp3
public/audio/system-courses/04-feedback.mp3
public/audio/system-courses/05-learning.mp3
public/audio/system-courses/06-relation.mp3
public/audio/system-courses/07-value.mp3
public/audio/system-courses/08-identity.mp3
public/brand/newlife30-brand-guidelines.md
public/marketing/platform-promo-script.md
public/materials/commitment.jpg
public/materials/dinner-guide.png
public/materials/kitchen-system.pdf
public/materials/sleep-homework.png
public/materials/sleep-score-100.jpg
public/materials/zen-courses.png
```

微信小程序目录：

```text
wechat-miniprogram/
wechat-miniprogram/app.js
wechat-miniprogram/app.json
wechat-miniprogram/app.wxss
wechat-miniprogram/project.config.json
wechat-miniprogram/sitemap.json
wechat-miniprogram/pages/dashboard/
wechat-miniprogram/pages/checkin/
wechat-miniprogram/pages/systems/
wechat-miniprogram/pages/courses/
wechat-miniprogram/pages/group/
wechat-miniprogram/pages/about/
wechat-miniprogram/utils/
wechat-miniprogram/assets/
```

脚本：

```text
scripts/check-miniprogram-submit.cjs
```

GitHub workflow / Hermes：

```text
.github/workflows/deploy-pages.yml
.hermes/plan.md
```

已追踪的 output 文件：

```text
output/product-iteration-report-2026-07-06.md
```

未进入 GitHub 但本机存在的课程/原始素材：

```text
output/commercial-launch/
output/course-analysis/
output/course-pack/
根目录下若干 png / jpg / pdf 原始截图与课程材料
```

这些文件被 `.gitignore` 排除，原因是它们属于素材、输出包或临时生成物，不是网页构建必需源码。DeepSeek 如果要继续整理课程内容，可以读取这些本机文件；如果需要纳入 GitHub，必须先由项目 owner 确认版权和体积。

## 5. 当前平台功能状态

网页端已包含：

- 高端重启舱首页首屏
- 八大个人运行系统高级图谱
- 课程研究院精品课程展示
- 每日开启仪式、锦囊、徽章、明日预告
- 用户状态入口：睡不好、没精力、节奏乱、学不进去
- 留存机制：今日唯一动作、连续天数、下一枚徽章、群内输出
- 八个系统课程与音频概要
- 睡眠/饮食评分与每日作业
- 群内打卡、小组机制、积分与补卡
- `newlife30` 高端品牌视觉规范
- 推广视频脚本与品牌手册入口

本机最新 commit `385e6e2` 新增/加强：

- “我现在卡在哪里？”用户状态入口
- “国际标杆目标”参考区
- “让用户明天还想回来”留存引擎
- `output/product-iteration-report-2026-07-06.md`

微信小程序基础版本已包含：

- 今日
- 打卡
- 系统
- 课程
- 小组
- 平台说明

## 6. 微信小程序注意事项

检查命令：

```bash
npm run miniprogram:check
npm run miniprogram:submit-check
```

打开微信开发者工具：

```bash
npm run miniprogram:open
```

当前 `wechat-miniprogram/project.config.json`：

```text
appid: touristappid
urlCheck: false
```

正式上传前必须做：

- 把 `appid` 替换成真实小程序 AppID。
- 登录微信开发者工具。
- 在微信公众平台配置 request/download/audio 合法域名。
- 打开域名校验后重新测试。
- 完成小程序隐私保护指引。

## 7. DeepSeek 建议接手流程

如果在本机接手：

```bash
cd '/Users/linzhang/Downloads/      OPC/30天重建人生体系'
git status --short --branch
npm ci
npm run dev -- --port 5174
```

如果从 GitHub 重新克隆：

```bash
git clone https://github.com/MoKangMedical/30-day-life-restart-platform.git
cd 30-day-life-restart-platform
npm ci
npm run dev -- --port 5174
```

如果要把本机最新版本同步到 GitHub：

```bash
git status
git add src/App.jsx src/styles.css output/product-iteration-report-2026-07-06.md
git commit -m "Add user-centered iteration loops" # 如果 commit 还不存在才执行
git push origin main
```

当前本机 commit 已存在，所以通常只需要：

```bash
git push origin main
```

推送后部署服务器：

```bash
ssh ubuntu@43.128.114.201 'set -e
cd /var/www/newlife30/repo
git fetch origin main
git reset --hard origin/main
npm ci
npm run build
rsync -a --delete dist/ /var/www/newlife30/current/
sudo nginx -t
sudo systemctl reload nginx
git rev-parse --short HEAD'
```

修改后至少验证：

```bash
npm run build
npm run miniprogram:check
npm run miniprogram:submit-check
```

网页关键路径验证：

```text
首页能看到“我现在卡在哪里？”
点击“睡不好”能到“身心能量每日评分”
首页能看到“让用户明天还想回来”
点击“继续学习”能到“NEWLIFE30 INSTITUTE”
点击“为什么练”能到“newlife30 高端品牌视觉规范”
移动端没有横向溢出
```

## 8. 交接包建议

推荐交接包应包含：

```text
源码文件
public/ 公开素材
wechat-miniprogram/ 小程序源码
output/ 课程分析和商业化材料
根目录原始 jpg/png/pdf 课程素材
DEEPSEEK_HANDOFF.md
```

推荐排除：

```text
.git/
node_modules/
dist/
.playwright-mcp/
tmp/
logs/
.env
.env.*
```

原因：

- `.git/`、`node_modules/`、`dist/` 可重新生成或重新拉取。
- 日志和临时文件对接手没价值。
- `.env` 和密钥绝不能放入交接包。

## 9. 需要 DeepSeek 继续确认的问题

1. 是否先把本机 commit `385e6e2` 推送到 GitHub。
2. 是否把服务器从 `1086b99` 部署到最新 commit。
3. 是否把 `output/course-analysis/` 和根目录原始 PDF/图片整理成正式课程内容。
4. 是否申请/配置正式微信小程序 AppID。
5. 是否把真实宣传视频嵌入首页。
6. 是否补充用户账号、云端数据、社群排行榜等后端能力。
