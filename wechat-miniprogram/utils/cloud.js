// Production values are intentionally kept out of source control.
// Configure these values in the release pipeline or WeChat DevTools local config.
const CLOUD_API_BASE = "";
const SUBSCRIBE_TEMPLATE_IDS = [];

function isCloudConfigured() {
  return Boolean(CLOUD_API_BASE);
}

function requestSubscribeReminder() {
  if (!SUBSCRIBE_TEMPLATE_IDS.length) {
    return Promise.reject(new Error("请先配置微信订阅消息模板 ID。"));
  }
  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: SUBSCRIBE_TEMPLATE_IDS,
      success: resolve,
      fail: reject,
    });
  });
}

function syncProgress(snapshot) {
  if (!isCloudConfigured()) return Promise.resolve({ skipped: true });
  const token = wx.getStorageSync("newlife30-cloud-token");
  if (!token) return Promise.resolve({ skipped: true, reason: "not-signed-in" });
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${CLOUD_API_BASE.replace(/\/$/, "")}/progress`,
      method: "PUT",
      header: { Authorization: `Bearer ${token}` },
      data: { snapshot },
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data);
        else reject(new Error("云端保存失败。"));
      },
      fail: reject,
    });
  });
}

module.exports = {
  isCloudConfigured,
  requestSubscribeReminder,
  syncProgress,
};
