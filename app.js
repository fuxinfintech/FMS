// ===== Supabase 設定 =====
const SUPABASE_URL = "https://bkqznvoorilxjvvsdmak.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcXpudm9vcmlseGp2dnNkbWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjQzMzYsImV4cCI6MjA5Nzg0MDMzNn0.ORxxtnY_9Q0vOWDZsyU0Dz52ZR8m12VJHhw1aY95KM8";

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

  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("dashboardPage").classList.remove("hidden");

  document.getElementById("userInfo").innerHTML =
    `歡迎登入：${user.email}`;

  loadDashboardStats();
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
// ===== 儀表板統計 =====
async function loadDashboardStats() {

  // 總商戶數
  const { count: merchantCount } = await supabaseClient
    .from("merchants")
    .select("*", { count: "exact", head: true });

  // 今日案件數
  const today = new Date().toISOString().slice(0, 10);

  const { count: todayCaseCount } = await supabaseClient
    .from("cases")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today);

  // 待還款案件
  const { count: pendingPaymentCount } = await supabaseClient
    .from("cases")
    .select("*", { count: "exact", head: true })
    .in("case_status", ["待還款", "履約中", "展期中"]);

  // 逾期案件
  const { count: overdueCaseCount } = await supabaseClient
    .from("cases")
    .select("*", { count: "exact", head: true })
    .in("case_status", ["逾期中", "逾期展期中", "催收中"]);

  document.getElementById("totalMerchants").innerText =
    merchantCount ?? 0;

  document.getElementById("todayCases").innerText =
    todayCaseCount ?? 0;

  document.getElementById("pendingPayments").innerText =
    pendingPaymentCount ?? 0;

  document.getElementById("overdueCases").innerText =
    overdueCaseCount ?? 0;
}
