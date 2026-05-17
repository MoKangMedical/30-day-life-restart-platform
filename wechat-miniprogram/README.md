# 30天重建人生体系微信小程序

这是原生微信小程序版本，目录可直接用微信开发者工具打开。

## 本机打开

```bash
npm run miniprogram:open
```

也可以手动打开微信开发者工具，选择“导入项目”，项目目录选择：

```text
/Users/linzhang/Desktop/30天重建人生体系/wechat-miniprogram
```

当前 `project.config.json` 使用 `touristappid`，适合先用测试号预览。正式上传、提审、发布需要替换为真实小程序 AppID。

## 当前搭建状态

- 原生微信小程序工程已建立在 `wechat-miniprogram/`。
- 已导入微信开发者工具并通过本地模拟器打开首页。
- JS 语法校验通过：`npm run miniprogram:check`。
- 递交前结构检查：`npm run miniprogram:submit-check`。
- 原 Web 平台构建通过：`npm run build`。
- 本机私有配置 `project.private.config.json` 已加入忽略，不作为团队交付文件。

## 已完成页面

- 今日重启：30 天进度、今日任务、精力/情绪/注意力、输出复盘、完成今日打卡。
- 打卡模式：每日打卡模板、课程作业模板、群发文案生成和复制。
- 八大系统：八个个人运行系统结构化展示。
- 体系课程：四次核心课、八个系统理论课程、语音概要播放。
- 小组场域：积分、补打卡、小组满勤、组长统计文案和小组记录。
- 平台说明：平台定位、数据隐私、健康内容边界和使用建议。

## 资源策略

小程序主包只包含代码和课程数据，MP3 走线上 HTTPS：

```text
https://newlife30.com/audio/system-courses/
```

正式发布前，需要在微信小程序后台把对应域名加入合法域名；开发者工具里可以先关闭域名校验调试。

## 后续自动化上传

如果要使用 `miniprogram-ci` 自动上传，需要提供：

- 小程序 AppID
- 微信公众平台生成的上传密钥 private key
- 版本号和版本描述

拿到这些后再接入 CI 上传脚本。

递交前完整清单见 `SUBMISSION.md`。
