// ===== Supabase 設定 =====
const SUPABASE_URL = "你的SUPABASE_URL";
const SUPABASE_ANON_KEY = "你的SUPABASE_ANON_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ===== 登入 =====
async function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    document.getElementById("loginMsg").innerText =
      "帳號或密碼錯誤";
    return;
  }

  loadUser();
}

// ===== 讀取使用者 =====
async function loadUser() {

  const {
    data: { user }
  } = await supabaseClient.auth.getUser();

  if (!user) return;

  document.getElementById("loginPage")
    .classList.add("hidden");

  document.getElementById("dashboardPage")
    .classList.remove("hidden");

  document.getElementById("userInfo").innerHTML =
    `歡迎登入：${user.email}`;
}

// ===== 登出 =====
async function logout() {

  await supabaseClient.auth.signOut();

  location.reload();
}

// ===== 自動檢查登入 =====
window.onload = async () => {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (session) {
    loadUser();
  }
};
