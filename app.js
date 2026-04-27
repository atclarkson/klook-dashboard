const DB_NAME = "klookCommissionDashboard";
const DB_VERSION = 1;

let db = null;
let chartInstance = null;
let refundImpactSort = {
  field: "payment",
  direction: "desc",
};

// Constants
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");

const summary = document.getElementById("summary");
const details = document.getElementById("details");

const rowsFoundEl = document.getElementById("rowsFound");
const netCommissionEl = document.getElementById("netCommission");
const paymentRowsEl = document.getElementById("paymentRows");
const refundRowsEl = document.getElementById("refundRows");
const fileNameEl = document.getElementById("fileName");
const dateRangeEl = document.getElementById("dateRange");

const exportBackupBtn = document.getElementById("exportBackupBtn");
const importBackupBtn = document.getElementById("importBackupBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const backupInput = document.getElementById("backupInput");

const filters = document.getElementById("filters");
const dateRangeFilter = document.getElementById("dateRangeFilter");
const trendGrouping = document.getElementById("trendGrouping");
const hideIncompletePeriods = document.getElementById("hideIncompletePeriods");
const customDateFields = document.getElementById("customDateFields");
const customStartDate = document.getElementById("customStartDate");
const customEndDate = document.getElementById("customEndDate");

const dailyReport = document.getElementById("dailyReport");
const dailyReportTitle = document.getElementById("dailyReportTitle");
const dailyReportTotal = document.getElementById("dailyReportTotal");
const dailyReportBookings = document.getElementById("dailyReportBookings");
const dailyReportAverage = document.getElementById("dailyReportAverage");
const dailyReportTable = document.querySelector("#dailyReportTable tbody");

const monthlySummary = document.getElementById("monthlySummary");
const monthlySummaryGrid = document.getElementById("monthlySummaryGrid");

initApp();

async function initApp() {
  db = await openDatabase();
  await refreshDashboardFromStoredData();
}

// Event Listeners
dropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (file) {
    await parseCsvFile(file);
  }
});

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", async (event) => {
  event.preventDefault();
  dropZone.classList.remove("drag-over");

  const file = event.dataTransfer.files[0];

  if (file) {
    await parseCsvFile(file);
  }
});

exportBackupBtn.addEventListener("click", exportBackup);

importBackupBtn.addEventListener("click", () => {
  backupInput.click();
});

backupInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (file) {
    await importBackup(file);
  }
});

clearDataBtn.addEventListener("click", async () => {
  const confirmed = confirm(
    "Clear all saved dashboard data? This cannot be undone unless you have exported a backup.",
  );

  if (!confirmed) {
    return;
  }

  await clearAllData();
  location.reload();
});

dateRangeFilter.addEventListener("change", () => {
  customDateFields.classList.toggle(
    "hidden",
    dateRangeFilter.value !== "custom",
  );

  refreshDashboardFromStoredData();
});

customStartDate.addEventListener("change", refreshDashboardFromStoredData);
customEndDate.addEventListener("change", refreshDashboardFromStoredData);
trendGrouping.addEventListener("change", refreshDashboardFromStoredData);
hideIncompletePeriods.addEventListener(
  "change",
  refreshDashboardFromStoredData,
);

document.querySelectorAll("#refundImpact th[data-sort]").forEach((header) => {
  header.addEventListener("click", () => {
    const field = header.dataset.sort;

    if (refundImpactSort.field === field) {
      refundImpactSort.direction =
        refundImpactSort.direction === "asc" ? "desc" : "asc";
    } else {
      refundImpactSort.field = field;
      refundImpactSort.direction = field === "name" ? "asc" : "desc";
    }

    refreshDashboardFromStoredData();
  });
});

// Core Functions
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains("transactions")) {
        const store = database.createObjectStore("transactions", {
          keyPath: "id",
        });

        store.createIndex("actionDate", "actionDate");
        store.createIndex("actionType", "actionType");
        store.createIndex("activityName", "activityName");
        store.createIndex("destination", "destination");
      }

      if (!database.objectStoreNames.contains("imports")) {
        database.createObjectStore("imports", {
          keyPath: "id",
        });
      }
    };
  });
}

function parseCsvFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await importRows(file.name, results.data);
          await refreshDashboardFromStoredData();
          resolve();
        } catch (error) {
          alert(`Import error: ${error.message}`);
          reject(error);
        }
      },
      error: (error) => {
        alert(`CSV parse error: ${error.message}`);
        reject(error);
      },
    });
  });
}

async function importRows(fileName, rows) {
  const existingIds = await getAllTransactionIds();
  const transactions = rows.map((row) => normalizeRow(fileName, row));

  let rowsAdded = 0;
  let duplicateRowsSkipped = 0;
  let paymentRows = 0;
  let refundRows = 0;
  let amendmentRows = 0;
  let netCommissionUsd = 0;

  const transaction = db.transaction(["transactions", "imports"], "readwrite");
  const transactionStore = transaction.objectStore("transactions");
  const importStore = transaction.objectStore("imports");

  for (const item of transactions) {
    if (!item.id) {
      continue;
    }

    if (existingIds.has(item.id)) {
      duplicateRowsSkipped += 1;
      continue;
    }

    existingIds.add(item.id);
    transactionStore.add(item);
    rowsAdded += 1;

    if (item.actionType === "Payment") {
      paymentRows += 1;
    } else if (item.actionType === "Refund") {
      refundRows += 1;
    } else if (item.actionType === "Amendment") {
      amendmentRows += 1;
    }

    netCommissionUsd += item.commissionAmountUsd;
  }

  const importedAt = new Date().toISOString();

  importStore.add({
    id: `import-${Date.now()}`,
    fileName,
    importedAt,
    rowsFound: rows.length,
    rowsAdded,
    duplicateRowsSkipped,
    paymentRows,
    refundRows,
    amendmentRows,
    netCommissionUsd,
  });

  await waitForTransaction(transaction);

  fileNameEl.textContent = `Imported: ${fileName} | New rows: ${rowsAdded.toLocaleString()} | Duplicates skipped: ${duplicateRowsSkipped.toLocaleString()}`;
}

function normalizeRow(fileName, row) {
  const actionDateRaw = getField(row, ["Action Date"]);
  const actionDate = formatIsoDate(parseKlookDate(actionDateRaw));
  const actionType = getField(row, ["Action"]);
  const commissionAmountUsd = parseMoney(getField(row, ["Commission Amount"]));

  const orderId = getField(row, ["Order ID"]);
  const ticketId = getField(row, ["Ticket ID"]);
  const bookingNumber = getField(row, ["Booking Number"]);

  const id = createDedupeKey([
    ticketId,
    orderId,
    bookingNumber,
    actionDate,
    actionType,
    commissionAmountUsd,
  ]);

  return {
    id,
    sourceFileName: fileName,
    importedAt: new Date().toISOString(),

    actionDate,
    actionType,

    orderId,
    ticketId,
    bookingNumber,

    activityName: getField(row, ["Activity Name"]),
    destination: getField(row, ["Destination"]),
    platform: getField(row, ["Platform"]),
    userCountry: getField(row, ["User Country"]),
    promoCode: getField(row, ["Promo Code"]),
    trackingBase: getField(row, ["Tracking Base"]),

    commissionAmountUsd,
    raw: row,
  };
}

async function refreshDashboardFromStoredData() {
  const allTransactions = await getAllTransactions();
  const transactions = filterTransactionsByDateRange(allTransactions);

  if (!allTransactions.length) {
    return;
  }

  let netCommission = 0;
  let paymentRows = 0;
  let refundRows = 0;
  const actionDates = [];

  transactions.forEach((row) => {
    netCommission += row.commissionAmountUsd;

    if (row.actionType === "Payment") {
      paymentRows += 1;
    }

    if (row.actionType === "Refund") {
      refundRows += 1;
    }

    if (row.actionDate) {
      actionDates.push(row.actionDate);
    }
  });

  rowsFoundEl.textContent = transactions.length.toLocaleString();
  netCommissionEl.textContent = formatUsd(netCommission);
  paymentRowsEl.textContent = paymentRows.toLocaleString();
  refundRowsEl.textContent = refundRows.toLocaleString();
  dateRangeEl.textContent = `Date range: ${getDateRangeText(actionDates)}`;

  summary.classList.remove("hidden");
  details.classList.remove("hidden");
  filters.classList.remove("hidden");

  if (!fileNameEl.textContent) {
    fileNameEl.textContent = "Stored dashboard data loaded.";
  }

  const trend = buildCommissionTrend(
    transactions,
    trendGrouping.value,
    hideIncompletePeriods.checked,
  );
  renderChart(trend);

  renderTable("topActivities", buildTopList(transactions, "activityName"));
  renderTable("topDestinations", buildTopList(transactions, "destination"));
  renderRefundImpactTable(buildRefundImpact(transactions));
  renderDailyReport(transactions);
  renderMonthlySummary(transactions);
}

function getAllTransactionIds() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readonly");
    const store = transaction.objectStore("transactions");
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(new Set(request.result));
    request.onerror = () => reject(request.error);
  });
}

function getAllTransactions() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("transactions", "readonly");
    const store = transaction.objectStore("transactions");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function waitForTransaction(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function getField(row, possibleNames) {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return String(row[name]).trim();
    }
  }

  return "";
}

function parseMoney(value) {
  if (!value) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/[A-Z]{3}/gi, "")
    .replace(/[$,]/g, "")
    .trim();

  const parsed = Number.parseFloat(cleaned);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

function parseKlookDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  if (/^\d{8}$/.test(text)) {
    const year = Number(text.slice(0, 4));
    const month = Number(text.slice(4, 6)) - 1;
    const day = Number(text.slice(6, 8));

    return new Date(year, month, day);
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatIsoDate(date) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRangeText(dates) {
  const sortedDates = dates
    .map(parseKlookDate)
    .filter((date) => date !== null)
    .sort((a, b) => a - b);

  if (!sortedDates.length) {
    return "Unknown";
  }

  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];

  return `${formatDate(firstDate)} to ${formatDate(lastDate)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatUsd(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function createDedupeKey(parts) {
  return parts
    .map((part) =>
      String(part || "")
        .trim()
        .toLowerCase(),
    )
    .join("|");
}

function buildCommissionByDate(transactions) {
  const map = {};

  transactions.forEach((t) => {
    if (!t.actionDate) return;

    if (!map[t.actionDate]) {
      map[t.actionDate] = 0;
    }

    map[t.actionDate] += t.commissionAmountUsd;
  });

  const sortedDates = Object.keys(map).sort();

  return {
    labels: sortedDates,
    values: sortedDates.map((d) => map[d]),
  };
}

function renderChart(data) {
  const ctx = document.getElementById("commissionChart");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets: [
        {
          label: "Commission",
          data: data.values,
          borderColor: "#ff5b00",
          backgroundColor: "rgba(255,91,0,0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "$" + value,
          },
        },
      },
    },
  });
}

function buildTopList(transactions, field, limit = 8) {
  const map = {};

  transactions.forEach((t) => {
    const key = t[field] || "Unknown";

    if (!map[key]) {
      map[key] = 0;
    }

    map[key] += t.commissionAmountUsd;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function renderTable(elementId, data) {
  const tbody = document.querySelector(`#${elementId} tbody`);
  tbody.innerHTML = "";

  data.forEach(([name, value]) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${name}</td>
      <td>${formatUsd(value)}</td>
    `;

    tbody.appendChild(row);
  });
}

async function exportBackup() {
  const transactions = await getAllTransactions();
  const imports = await getAllImports();

  const backup = {
    app: "klook-commission-dashboard",
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    imports,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `klook-dashboard-backup-${formatIsoDate(new Date())}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function getAllImports() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("imports", "readonly");
    const store = transaction.objectStore("imports");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function importBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);

  if (
    backup.app !== "klook-commission-dashboard" ||
    !Array.isArray(backup.transactions)
  ) {
    alert("This does not look like a valid dashboard backup file.");
    return;
  }

  const existingIds = await getAllTransactionIds();

  let rowsAdded = 0;
  let duplicatesSkipped = 0;

  const transaction = db.transaction(["transactions", "imports"], "readwrite");
  const transactionStore = transaction.objectStore("transactions");
  const importStore = transaction.objectStore("imports");

  backup.transactions.forEach((item) => {
    if (existingIds.has(item.id)) {
      duplicatesSkipped += 1;
      return;
    }

    existingIds.add(item.id);
    transactionStore.add(item);
    rowsAdded += 1;
  });

  if (Array.isArray(backup.imports)) {
    backup.imports.forEach((item) => {
      importStore.put(item);
    });
  }

  await waitForTransaction(transaction);
  await refreshDashboardFromStoredData();

  fileNameEl.textContent = `Backup imported: ${rowsAdded.toLocaleString()} rows added | ${duplicatesSkipped.toLocaleString()} duplicates skipped`;
}

function clearAllData() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ["transactions", "imports"],
      "readwrite",
    );

    transaction.objectStore("transactions").clear();
    transaction.objectStore("imports").clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function filterTransactionsByDateRange(transactions) {
  const value = dateRangeFilter.value;

  if (value === "all") {
    return transactions;
  }

  const sortedDates = transactions
    .map((transaction) => parseKlookDate(transaction.actionDate))
    .filter((date) => date !== null)
    .sort((a, b) => b - a);

  if (!sortedDates.length) {
    return transactions;
  }

  const latestDate = sortedDates[0];

  let startDate = null;
  let endDate = latestDate;

  if (value === "7" || value === "30" || value === "90") {
    const days = Number(value);
    startDate = new Date(latestDate);
    startDate.setDate(startDate.getDate() - days + 1);
  }

  if (value === "month-current") {
    startDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
    endDate = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);
  }

  if (value === "month-previous") {
    startDate = new Date(
      latestDate.getFullYear(),
      latestDate.getMonth() - 1,
      1,
    );
    endDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 0);
  }

  if (value === "custom") {
    if (!customStartDate.value || !customEndDate.value) {
      return transactions;
    }

    startDate = parseKlookDate(customStartDate.value);
    endDate = parseKlookDate(customEndDate.value);
  }

  if (!startDate || !endDate) {
    return transactions;
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return transactions.filter((transaction) => {
    const actionDate = parseKlookDate(transaction.actionDate);

    if (!actionDate) {
      return false;
    }

    return actionDate >= startDate && actionDate <= endDate;
  });
}

function buildCommissionTrend(transactions, grouping, hideIncomplete) {
  const map = {};
  const allDates = transactions
    .map((transaction) => parseKlookDate(transaction.actionDate))
    .filter((date) => date !== null)
    .sort((a, b) => a - b);

  if (!allDates.length) {
    return {
      labels: [],
      values: [],
    };
  }

  const minDate = allDates[0];
  const maxDate = allDates[allDates.length - 1];

  transactions.forEach((transaction) => {
    if (!transaction.actionDate) {
      return;
    }

    const date = parseKlookDate(transaction.actionDate);

    if (!date) {
      return;
    }

    const trendItem = getTrendItem(date, grouping);

    if (
      hideIncomplete &&
      isIncompletePeriod(
        trendItem.startDate,
        trendItem.endDate,
        minDate,
        maxDate,
      )
    ) {
      return;
    }

    if (!map[trendItem.sortKey]) {
      map[trendItem.sortKey] = {
        label: trendItem.label,
        value: 0,
      };
    }

    map[trendItem.sortKey].value += transaction.commissionAmountUsd;
  });

  const sortedItems = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => item);

  return {
    labels: sortedItems.map((item) => item.label),
    values: sortedItems.map((item) => item.value),
  };
}

function getTrendItem(date, grouping) {
  if (grouping === "monthly") {
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      sortKey,
      label: sortKey,
      startDate,
      endDate,
    };
  }

  if (grouping === "weekly") {
    const startDate = getWeekStartDate(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const sortKey = formatIsoDate(startDate);

    return {
      sortKey,
      label: `Week of ${formatDate(startDate)}`,
      startDate,
      endDate,
    };
  }

  const startDate = new Date(date);
  const endDate = new Date(date);

  return {
    sortKey: formatIsoDate(date),
    label: formatIsoDate(date),
    startDate,
    endDate,
  };
}

function getWeekStartDate(date) {
  const tempDate = new Date(date);
  const day = tempDate.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  tempDate.setDate(tempDate.getDate() + diffToMonday);
  tempDate.setHours(0, 0, 0, 0);

  return tempDate;
}

function isIncompletePeriod(periodStart, periodEnd, dataStart, dataEnd) {
  return periodStart < dataStart || periodEnd > dataEnd;
}

function buildRefundImpact(transactions, limit = 25) {
  const map = {};

  transactions.forEach((t) => {
    const key = t.activityName || "Unknown";

    if (!map[key]) {
      map[key] = {
        payment: 0,
        refund: 0,
        paymentCount: 0,
        refundCount: 0,
      };
    }

    if (t.actionType === "Payment") {
      map[key].payment += t.commissionAmountUsd;
      map[key].paymentCount += 1;
    }

    if (t.actionType === "Refund") {
      map[key].refund += t.commissionAmountUsd;
      map[key].refundCount += 1;
    }
  });

  return Object.entries(map).map(([name, data]) => {
    const net = data.payment + data.refund;
    const refundRate =
      data.paymentCount > 0 ? data.refundCount / data.paymentCount : 0;

    return {
      name,
      payment: data.payment,
      paymentCount: data.paymentCount,
      refund: data.refund,
      refundCount: data.refundCount,
      net,
      refundRate,
    };
  });
}

function renderRefundImpactTable(data) {
  const tbody = document.querySelector("#refundImpact tbody");
  tbody.innerHTML = "";

  const sortedData = [...data].sort((a, b) => {
    const field = refundImpactSort.field;
    const direction = refundImpactSort.direction === "asc" ? 1 : -1;

    if (field === "name") {
      return a.name.localeCompare(b.name) * direction;
    }

    return (a[field] - b[field]) * direction;
  });

  sortedData.slice(0, 25).forEach((row) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${formatUsd(row.payment)}</td>
      <td>${row.paymentCount.toLocaleString()}</td>
      <td style="color: #dc2626">${formatUsd(row.refund)}</td>
      <td>${row.refundCount.toLocaleString()}</td>
      <td>${formatUsd(row.net)}</td>
      <td data-high="${row.refundRate > 0.2 && row.refundCount >= 3}">
        ${(row.refundRate * 100).toFixed(1)}%
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function renderDailyReport(transactions) {
  const payments = transactions.filter((t) => t.actionType === "Payment");
  const map = {};

  payments.forEach((transaction) => {
    if (!transaction.actionDate) {
      return;
    }

    if (!map[transaction.actionDate]) {
      map[transaction.actionDate] = {
        commission: 0,
        bookings: 0,
      };
    }

    map[transaction.actionDate].commission += transaction.commissionAmountUsd;
    map[transaction.actionDate].bookings += 1;
  });

  const allDays = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      commission: data.commission,
      bookings: data.bookings,
    }));

  const days = allDays.slice(-14);

  if (!days.length) {
    dailyReport.classList.add("hidden");
    return;
  }

  const total = days.reduce((sum, day) => sum + day.commission, 0);
  const totalBookings = days.reduce((sum, day) => sum + day.bookings, 0);
  const average = total / days.length;

  const firstDate = parseKlookDate(days[0].date);
  const lastDate = parseKlookDate(days[days.length - 1].date);

  dailyReportTitle.textContent = `Last 14 Active Days — ${formatDate(firstDate)} through ${formatDate(lastDate)}`;

  dailyReportTotal.textContent = `Total: ${formatUsd(total)}`;
  dailyReportBookings.textContent = `${totalBookings.toLocaleString()} payment bookings`;
  dailyReportAverage.textContent = `Daily average: ${formatUsd(average)}/day`;

  dailyReportTable.innerHTML = "";

  const reversedDays = [...days].reverse();

  reversedDays.forEach((day) => {
    const row = document.createElement("tr");

    row.innerHTML = `
    <td>${formatShortDate(day.date)}</td>
    <td>${formatUsd(day.commission)}</td>
    <td>${day.bookings.toLocaleString()}</td>
  `;

    dailyReportTable.appendChild(row);
  });

  dailyReport.classList.remove("hidden");
}

function formatShortDate(value) {
  const date = parseKlookDate(value);

  if (!date) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function renderMonthlySummary(transactions) {
  const map = {};

  transactions.forEach((transaction) => {
    const date = parseKlookDate(transaction.actionDate);

    if (!date) {
      return;
    }

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!map[key]) {
      map[key] = {
        paymentCommission: 0,
        refundCommission: 0,
        amendmentCommission: 0,
        netCommission: 0,
        paymentCount: 0,
        refundCount: 0,
        amendmentCount: 0,
      };
    }

    map[key].netCommission += transaction.commissionAmountUsd;

    if (transaction.actionType === "Payment") {
      map[key].paymentCommission += transaction.commissionAmountUsd;
      map[key].paymentCount += 1;
    }

    if (transaction.actionType === "Refund") {
      map[key].refundCommission += transaction.commissionAmountUsd;
      map[key].refundCount += 1;
    }

    if (transaction.actionType === "Amendment") {
      map[key].amendmentCommission += transaction.commissionAmountUsd;
      map[key].amendmentCount += 1;
    }
  });

  const months = Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  monthlySummaryGrid.innerHTML = "";

  months.forEach(([monthKey, data]) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const averageBooking =
      data.paymentCount > 0 ? data.netCommission / data.paymentCount : 0;

    const card = document.createElement("div");
    card.className = "monthly-card";

    card.innerHTML = `
      <span>${formatMonthLabel(date)}</span>
      <strong>${formatUsd(data.netCommission)}</strong>
      <small>${data.paymentCount.toLocaleString()} payment bookings</small>
      <small>${data.refundCount.toLocaleString()} refunds (${formatUsd(data.refundCommission)})</small>
      <small>${formatUsd(averageBooking)} net avg / booking</small>
    `;

    monthlySummaryGrid.appendChild(card);
  });

  monthlySummary.classList.toggle("hidden", months.length === 0);
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}
