import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const wechatAuthStartUrl = import.meta.env.VITE_WECHAT_AUTH_START_URL?.trim();

export const cloudConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase = cloudConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function requireClient() {
  if (!supabase) {
    throw new Error("云同步尚未配置。请先填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。");
  }
  return supabase;
}

function normalizeChinesePhone(phone) {
  const trimmed = String(phone ?? "").replace(/[\s-]/g, "");
  if (/^1\d{10}$/.test(trimmed)) return `+86${trimmed}`;
  return trimmed;
}

export async function getCloudSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onCloudAuthChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function sendPhoneOtp(phone) {
  const client = requireClient();
  const normalizedPhone = normalizeChinesePhone(phone);
  if (!/^\+\d{8,15}$/.test(normalizedPhone)) {
    throw new Error("请输入有效的手机号码。");
  }
  const { error } = await client.auth.signInWithOtp({ phone: normalizedPhone });
  if (error) throw error;
  return normalizedPhone;
}

export async function verifyPhoneOtp(phone, token) {
  const client = requireClient();
  const { data, error } = await client.auth.verifyOtp({
    phone: normalizeChinesePhone(phone),
    token: String(token ?? "").trim(),
    type: "sms",
  });
  if (error) throw error;
  return data.session;
}

export function startWechatLogin() {
  if (!wechatAuthStartUrl) {
    throw new Error("微信网页登录尚未配置。请设置 VITE_WECHAT_AUTH_START_URL 后启用。");
  }
  const redirect = encodeURIComponent(window.location.href);
  const joiner = wechatAuthStartUrl.includes("?") ? "&" : "?";
  window.location.assign(`${wechatAuthStartUrl}${joiner}redirect=${redirect}`);
}

export async function loadCloudProgress() {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const { data, error } = await client
    .from("user_progress")
    .select("snapshot, updated_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function saveCloudProgress(snapshot) {
  const client = requireClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const { error } = await client.from("user_progress").upsert(
    {
      user_id: userData.user.id,
      snapshot,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
  return { updatedAt: new Date().toISOString() };
}

export async function signOutCloud() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
