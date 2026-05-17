const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const miniRoot = path.join(root, "wechat-miniprogram");
const appJsonPath = path.join(miniRoot, "app.json");
const projectConfigPath = path.join(miniRoot, "project.config.json");
const dataPath = path.join(miniRoot, "utils", "data.js");

const errors = [];
const warnings = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(root, file)} 不是合法 JSON：${error.message}`);
    return null;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function sizeOf(file) {
  return fs.existsSync(file) ? fs.statSync(file).size : 0;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(file) : [file];
  });
}

const appJson = readJson(appJsonPath);
const projectConfig = readJson(projectConfigPath);

if (appJson) {
  const pages = appJson.pages || [];
  if (!pages.includes("pages/about/index")) {
    warnings.push("建议保留 pages/about/index，用于说明平台定位、隐私边界和健康内容边界。");
  }

  pages.forEach((pagePath) => {
    ["js", "json", "wxml", "wxss"].forEach((ext) => {
      const relativePath = `wechat-miniprogram/${pagePath}.${ext}`;
      if (!exists(relativePath)) {
        errors.push(`页面文件缺失：${relativePath}`);
      }
    });
  });

  const tabItems = (appJson.tabBar && appJson.tabBar.list) || [];
  if (tabItems.length !== 5) {
    warnings.push(`当前底部 Tab 数量为 ${tabItems.length}，正式版建议保持 3-5 个核心入口。`);
  }
  tabItems.forEach((item) => {
    ["iconPath", "selectedIconPath"].forEach((key) => {
      if (!item[key]) {
        errors.push(`Tab ${item.text || item.pagePath} 缺少 ${key}`);
        return;
      }
      const icon = path.join(miniRoot, item[key]);
      if (!fs.existsSync(icon)) {
        errors.push(`Tab 图标不存在：wechat-miniprogram/${item[key]}`);
      } else if (sizeOf(icon) > 40 * 1024) {
        errors.push(`Tab 图标超过 40KB：wechat-miniprogram/${item[key]}`);
      }
    });
  });
}

if (projectConfig) {
  if (!projectConfig.appid || projectConfig.appid === "touristappid") {
    warnings.push("project.config.json 仍是 touristappid；正式上传前必须替换为真实小程序 AppID。");
  }
  if (projectConfig.setting && projectConfig.setting.urlCheck === false) {
    warnings.push("开发配置关闭了 urlCheck；正式联调时请在微信后台配置 request/download/audio 合法域名后再打开域名校验测试。");
  }
}

if (fs.existsSync(dataPath)) {
  const dataSource = fs.readFileSync(dataPath, "utf8");
  const audioMatches = Array.from(dataSource.matchAll(/padStart\(2, "0"\)-\$\{system\.id\}\.mp3|audioBase/g));
  if (audioMatches.length === 0) {
    warnings.push("未检测到课程音频配置，请确认语音概要入口是否仍需要。");
  }
  [
    "01-energy.mp3",
    "02-rhythm.mp3",
    "03-action.mp3",
    "04-feedback.mp3",
    "05-learning.mp3",
    "06-relation.mp3",
    "07-value.mp3",
    "08-identity.mp3",
  ].forEach((fileName) => {
    const audioFile = path.join(root, "public", "audio", "system-courses", fileName);
    if (!fs.existsSync(audioFile)) {
      warnings.push(`本地缺少课程音频：public/audio/system-courses/${fileName}`);
    }
  });
}

const miniFiles = walkFiles(miniRoot);
const miniSize = miniFiles.reduce((total, file) => total + sizeOf(file), 0);
if (miniSize > 2 * 1024 * 1024) {
  warnings.push(`小程序主包约 ${(miniSize / 1024 / 1024).toFixed(2)}MB，接近或超过常见主包限制，请拆分资源或移到 CDN。`);
}

const sourceFiles = miniFiles.filter((file) => /\.(js|json|wxml|wxss)$/.test(file));
sourceFiles.forEach((file) => {
  const source = fs.readFileSync(file, "utf8");
  if (/http:\/\//.test(source)) {
    errors.push(`检测到非 HTTPS 地址：${path.relative(root, file)}`);
  }
});

console.log(`小程序主包文件体积：${(miniSize / 1024).toFixed(1)}KB`);

if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((warning) => console.log(`- ${warning}`));
}

if (errors.length) {
  console.error("\nErrors:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("\n递交前结构检查通过。");
