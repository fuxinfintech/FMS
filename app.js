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

function showPage(page) {
  document.getElementById("dashboardSection")?.classList.add("hidden");
  document.getElementById("customersSection")?.classList.add("hidden");
  document.getElementById("casesSection")?.classList.add("hidden");

  if (page === "dashboard") {
    document.getElementById("dashboardSection")?.classList.remove("hidden");
  }

  if (page === "customers") {
    document.getElementById("customersSection")?.classList.remove("hidden");
    loadCustomers();
  }

  if (page === "cases") {
    document.getElementById("casesSection")?.classList.remove("hidden");
    loadCaseCustomers();
    loadCases();
  }
}

}
  }
}
async function addCustomer() {

  const name =
    document.getElementById("customerName").value;

  const phone =
    document.getElementById("customerPhone").value;

  const idNumber =
    document.getElementById("customerIdNumber").value;

  const birthday =
    document.getElementById("customerBirthday").value;

  const address =
    document.getElementById("customerAddress").value;

  const note =
    document.getElementById("customerNote").value;

  if (!name) {
    alert("請輸入姓名");
    return;
  }

  const { error } =
    await supabaseClient
      .from("customers")
      .insert([
        {
          name,
          phone,
          id_number: idNumber,
          birthday: birthday || null,
          address,
          note
        }
      ]);

  if (error) {
    console.error(error);
    document.getElementById("customerMsg").innerText =
      "新增失敗";
    return;
  }

  document.getElementById("customerMsg").innerText =
    "新增成功";

  loadCustomers();
}
async function loadCustomers() {

  const { data, error } =
    await supabaseClient
      .from("customers")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {
    console.error(error);
    return;
  }

  const tbody =
    document.getElementById("customersTable");

  tbody.innerHTML = "";

  if (!data.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          尚無資料
        </td>
      </tr>
    `;

    return;
  }

  data.forEach(row => {

    tbody.innerHTML += `
      <tr>
        <td>${row.name ?? ""}</td>
        <td>${row.phone ?? ""}</td>
        <td>${row.id_number ?? ""}</td>
        <td>${row.birthday ?? ""}</td>
        <td>${row.address ?? ""}</td>
        <td>${new Date(row.created_at)
          .toLocaleString()}</td>
      </tr>
    `;
  });
}
async function loadCaseCustomers(){

const { data } =
await supabaseClient
.from("customers")
.select("*")
.order("name");

const select =
document.getElementById("caseCustomer");

select.innerHTML =
'<option value="">選擇客戶</option>';

data.forEach(customer=>{

select.innerHTML += `
<option value="${customer.id}">
${customer.name}
</option>
`;

});

}
function calculateDueDate(startDate, days) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + Number(days) - 1);
  return date.toISOString().slice(0, 10);
}

async function addCase() {
  const customerId = document.getElementById("caseCustomer").value;
  const amount = document.getElementById("caseAmount").value;
  const actualReceived = document.getElementById("caseActualReceived").value;
  const days = document.getElementById("caseDays").value || 7;
  const startDate = document.getElementById("caseStartDate").value;
  const extensionFee = document.getElementById("caseExtensionFee").value;

  if (!customerId) {
    alert("請選擇客戶");
    return;
  }

  if (!amount) {
    alert("請輸入申請金額");
    return;
  }

  if (!startDate) {
    alert("請選擇起租日");
    return;
  }

  const dueDate = calculateDueDate(startDate, days);

  const { error } = await supabaseClient
    .from("cases")
    .insert([
      {
        customer_id: customerId,
        amount: Number(amount),
        actual_received: Number(actualReceived || 0),
        days: Number(days),
        start_date: startDate,
        due_date: dueDate,
        extension_fee: Number(extensionFee || 0),
        case_status: "審核中"
      }
    ]);

  if (error) {
    console.error(error);
    document.getElementById("caseMsg").innerText = "新增失敗";
    return;
  }

  document.getElementById("caseMsg").innerText = "新增成功";

  loadCases();
  loadDashboardStats();
}
async function loadCases() {
  const { data, error } = await supabaseClient
    .from("cases")
    .select(`
      *,
      customers (
        name,
        phone
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("casesTable");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">尚無案件</td>
      </tr>
    `;
    return;
  }

  data.forEach(row => {
    tbody.innerHTML += `
      <tr>
        <td>${row.customers?.name ?? ""}</td>
        <td>${row.amount ?? 0}</td>
        <td>${row.actual_received ?? 0}</td>
        <td>${row.days ?? 7}</td>
        <td>${row.due_date ?? ""}</td>
        <td>${row.case_status ?? ""}</td>
      </tr>
    `;
  });
}
