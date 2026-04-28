const DB_NAME = "klookCommissionDashboard";
const DB_VERSION = 2;
// Bump APP_VERSION for user-facing releases.
// Bump DATA_SCHEMA_VERSION only when stored IndexedDB data becomes incompatible.
const APP_VERSION = "2.1.1";
const DATA_SCHEMA_VERSION = 2;

let db = null;
let chartInstance = null;
let activityCategoryChartInstance = null;
let selectedTrendMetric = "netCommission";
let selectedCountryMapMetric = "commission";
let selectedActivityCategoryMetric = "commission";
let selectedPayoutMetric = "commission";
let activeDashboardView = "overview";
let refundImpactSort = {
  field: "payment",
  direction: "desc",
};
let unpaidBookingsSort = {
  field: "ageDays",
  direction: "desc",
};

// Constants
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const importSection = document.getElementById("importSection");

const summary = document.getElementById("summary");
const details = document.getElementById("details");
const compatibilityNotice = document.getElementById("compatibilityNotice");
const compatibilityMessage = document.getElementById("compatibilityMessage");
const analyticsSection = document.querySelector(".analytics");

const netCommissionEl = document.getElementById("netCommission");
const paymentRowsEl = document.getElementById("paymentRows");
const avgCommissionPerBookingEl = document.getElementById(
  "avgCommissionPerBooking",
);
const refundRowsEl = document.getElementById("refundRows");
const fileNameEl = document.getElementById("fileName");
const dateRangeEl = document.getElementById("dateRange");
const billingStatusEl = document.getElementById("billingStatus");

const exportBackupBtn = document.getElementById("exportBackupBtn");
const importBackupBtn = document.getElementById("importBackupBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const backupInput = document.getElementById("backupInput");
const aboutBtn = document.getElementById("aboutBtn");
const aboutModal = document.getElementById("aboutModal");
const closeAboutBtn = document.getElementById("closeAboutBtn");
const appVersionBadge = document.getElementById("appVersionBadge");
const aboutAppVersion = document.getElementById("aboutAppVersion");
const aboutSchemaVersion = document.getElementById("aboutSchemaVersion");

const filters = document.getElementById("filters");
const viewTabs = document.getElementById("viewTabs");
const viewTabButtons = document.querySelectorAll("[data-view]");
const dateRangeFilter = document.getElementById("dateRangeFilter");
const trendGrouping = document.getElementById("trendGrouping");
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
const demographicsSection = document.getElementById("demographics");
const payoutsSection = document.getElementById("payoutsSection");
const unpaidAgeFilter = document.getElementById("unpaidAgeFilter");
const payoutTotalBookings = document.getElementById("payoutTotalBookings");
const payoutPaidBookings = document.getElementById("payoutPaidBookings");
const payoutUnpaidBookings = document.getElementById("payoutUnpaidBookings");
const payoutAdjustedBookings = document.getElementById("payoutAdjustedBookings");
const payoutLatestMonth = document.getElementById("payoutLatestMonth");
const payoutTotalLabel = document.getElementById("payoutTotalLabel");
const payoutTotalMeta = document.getElementById("payoutTotalMeta");
const payoutPaidLabel = document.getElementById("payoutPaidLabel");
const payoutPaidMeta = document.getElementById("payoutPaidMeta");
const payoutUnpaidLabel = document.getElementById("payoutUnpaidLabel");
const payoutUnpaidMeta = document.getElementById("payoutUnpaidMeta");
const payoutAdjustedLabel = document.getElementById("payoutAdjustedLabel");
const payoutMetricButtons = document.querySelectorAll("[data-payout-metric]");
const countryReachValue = document.getElementById("countryReachValue");
const topCountryValue = document.getElementById("topCountryValue");
const topCountryMeta = document.getElementById("topCountryMeta");
const promoBookingShareValue = document.getElementById("promoBookingShareValue");
const codeBasedShareValue = document.getElementById("codeBasedShareValue");
const userCountryMap = document.getElementById("userCountryMap");
const mapMetricButtons = document.querySelectorAll("[data-map-metric]");
const categoryMetricButtons = document.querySelectorAll(
  "[data-category-metric]",
);
const activityCategorySubtitle = document.getElementById(
  "activityCategorySubtitle",
);
const activityCategoryMetricColumn = document.getElementById(
  "activityCategoryMetricColumn",
);
const activityCategorySecondaryColumn = document.getElementById(
  "activityCategorySecondaryColumn",
);

const comparisonMode = document.getElementById("comparisonMode");
const netCommissionCompareEl = document.getElementById("netCommissionCompare");
const paymentRowsCompareEl = document.getElementById("paymentRowsCompare");
const avgCommissionPerBookingCompareEl = document.getElementById(
  "avgCommissionPerBookingCompare",
);
const refundRowsCompareEl = document.getElementById("refundRowsCompare");
const trendChartTitle = document.getElementById("trendChartTitle");
const kpiCards = document.querySelectorAll(".kpi-card");

initApp();

async function initApp() {
  hydrateVersionUi();
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
aboutBtn.addEventListener("click", openAboutModal);
closeAboutBtn.addEventListener("click", closeAboutModal);

importBackupBtn.addEventListener("click", () => {
  backupInput.click();
});

aboutModal.addEventListener("click", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
    closeAboutModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !aboutModal.classList.contains("hidden")) {
    closeAboutModal();
  }
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

document
  .querySelectorAll("#unpaidBookingsTable th[data-sort]")
  .forEach((header) => {
    header.addEventListener("click", () => {
      const field = header.dataset.sort;

      if (unpaidBookingsSort.field === field) {
        unpaidBookingsSort.direction =
          unpaidBookingsSort.direction === "asc" ? "desc" : "asc";
      } else {
        unpaidBookingsSort.field = field;
        unpaidBookingsSort.direction =
          field === "bookingNumber" ||
          field === "activityName" ||
          field === "destination" ||
          field === "payScheme" ||
          field === "status"
            ? "asc"
            : "desc";
      }

      refreshDashboardFromStoredData();
    });
  });

comparisonMode.addEventListener("change", refreshDashboardFromStoredData);
unpaidAgeFilter.addEventListener("change", refreshDashboardFromStoredData);

viewTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextView = button.dataset.view;

    if (!nextView || nextView === activeDashboardView) {
      return;
    }

    activeDashboardView = nextView;
    syncDashboardView();
  });
});

payoutMetricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextMetric = button.dataset.payoutMetric;

    if (!nextMetric || nextMetric === selectedPayoutMetric) {
      return;
    }

    selectedPayoutMetric = nextMetric;
    syncPayoutMetricToggle();
    refreshDashboardFromStoredData();
  });
});

mapMetricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { mapMetric } = button.dataset;

    if (!mapMetric || selectedCountryMapMetric === mapMetric) {
      return;
    }

    selectedCountryMapMetric = mapMetric;
    syncCountryMapMetricToggle();
    refreshDashboardFromStoredData();
  });
});

categoryMetricButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { categoryMetric } = button.dataset;

    if (!categoryMetric || selectedActivityCategoryMetric === categoryMetric) {
      return;
    }

    selectedActivityCategoryMetric = categoryMetric;
    syncActivityCategoryMetricToggle();
    refreshDashboardFromStoredData();
  });
});

kpiCards.forEach((card) => {
  const activateCard = () => {
    const { metric } = card.dataset;

    if (!metric || selectedTrendMetric === metric) {
      return;
    }

    selectedTrendMetric = metric;
    syncActiveKpiCard();
    refreshDashboardFromStoredData();
  };

  card.addEventListener("click", activateCard);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    activateCard();
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

      if (!database.objectStoreNames.contains("billingReports")) {
        const billingStore = database.createObjectStore("billingReports", {
          keyPath: "id",
        });

        billingStore.createIndex("reportMonth", "reportMonth");
        billingStore.createIndex("orderId", "orderId");
        billingStore.createIndex("ticketId", "ticketId");
        billingStore.createIndex("bookingNumber", "bookingNumber");
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
          const storedTransactions = await getAllTransactions();

          if (hasIncompatibleStoredData(storedTransactions)) {
            throw new Error(
              "Stored data is from an older dashboard version. Clear data and re-import all CSV files before adding new data.",
            );
          }

          const rows = results.data;

          if (isBillingReportRows(rows)) {
            await importBillingRows(file.name, rows);
          } else if (isTicketReportRows(rows)) {
            await importRows(file.name, rows);
          } else {
            throw new Error(
              "Unsupported CSV format. This file does not look like a ticket report or billing report export.",
            );
          }

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
    importType: "ticket",
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

async function importBillingRows(fileName, rows) {
  const existingIds = await getAllBillingReportIds();
  const billingRows = rows.map((row) => normalizeBillingRow(fileName, row));

  let rowsAdded = 0;
  let duplicateRowsSkipped = 0;

  const transaction = db.transaction(["billingReports", "imports"], "readwrite");
  const billingStore = transaction.objectStore("billingReports");
  const importStore = transaction.objectStore("imports");

  for (const item of billingRows) {
    if (!item.id) {
      continue;
    }

    if (existingIds.has(item.id)) {
      duplicateRowsSkipped += 1;
      continue;
    }

    existingIds.add(item.id);
    billingStore.add(item);
    rowsAdded += 1;
  }

  importStore.add({
    id: `billing-import-${Date.now()}`,
    fileName,
    importedAt: new Date().toISOString(),
    importType: "billing",
    reportMonth: getBillingReportMonth(rows),
    rowsFound: rows.length,
    rowsAdded,
    duplicateRowsSkipped,
  });

  await waitForTransaction(transaction);

  const reportMonth = getBillingReportMonth(rows) || "Unknown month";
  fileNameEl.textContent =
    `Billing imported: ${fileName} | Month: ${reportMonth} | ` +
    `New rows: ${rowsAdded.toLocaleString()} | Duplicates skipped: ${duplicateRowsSkipped.toLocaleString()}`;
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
    schemaVersion: DATA_SCHEMA_VERSION,
    id,
    sourceFileName: fileName,
    importedAt: new Date().toISOString(),

    actionDate,
    actionType,

    orderId,
    ticketId,
    bookingNumber,

    actionTime: getField(row, ["Action Time"]),
    participationDate: formatIsoDate(
      parseKlookDate(getField(row, ["Participation Date"])),
    ),
    participationTime: getField(row, ["Participation Time"]),
    participants: getField(row, ["Participants"]),
    salesAmount: parseMoney(getField(row, ["Sales Amount"])),
    salesCurrency: parseCurrencyCode(getField(row, ["Sales Amount"])),
    commissionRate: getField(row, ["Commission Rate"]),

    trackingBase: getField(row, ["Tracking base", "Tracking Base"]),
    aid: getField(row, ["AID"]),
    adid: getField(row, ["ADID"]),
    adTagging: getField(row, ["AD Tagging"]),
    websiteName: getField(row, ["Website Name(English)"]),
    partnerParams: getField(row, ["Partner Params"]),
    activityId: getField(row, ["Activity ID"]),
    activityName: getField(row, ["Activity Name"]),
    destination: getField(row, ["Destination"]),
    packageName: getField(row, ["Package Name"]),
    activityCategory: getField(row, ["Activity Category"]),
    platform: getField(row, ["Platform"]),
    userCountry: getField(row, ["User country", "User Country"]),
    promoCodeType: getField(row, ["Promo Code Type"]),
    kreatorPromoCode: getField(row, ["Kreator Promo Code", "Promo Code"]),
    supplyCategory01: getField(row, ["Supply Category 01"]),
    supplyCategory02: getField(row, ["Supply Category 02"]),
    supplyCategory03: getField(row, ["Supply Category 03"]),
    productType: getField(row, ["Product Type"]),

    commissionAmountUsd,
    raw: row,
  };
}

function normalizeBillingRow(fileName, row) {
  const reportMonth = getField(row, ["Report Month"]);
  const orderId = getField(row, ["Order ID"]);
  const ticketId = getField(row, ["Ticket ID"]);
  const bookingNumber = getField(row, ["Booking Number"]);
  const action = getField(row, ["Action"]);
  const payableCommissionUsd = parseMoney(getField(row, ["Payable Commission Amt"]));

  const id = createDedupeKey([
    fileName,
    reportMonth,
    orderId,
    ticketId,
    bookingNumber,
    action,
    payableCommissionUsd,
  ]);

  return {
    id,
    sourceFileName: fileName,
    importedAt: new Date().toISOString(),
    reportType: getField(row, ["Report Type"]),
    reportMonth,
    userId: getField(row, ["User ID"]),
    affiliateId: getField(row, ["Affiliate ID"]),
    affiliateName: getField(row, ["Affiliate Name"]),
    orderId,
    ticketId,
    bookingNumber,
    trackingBase: getField(row, ["Tracking base", "Tracking Base"]),
    payScheme: getField(row, ["Pay Scheme"]),
    bookDate: formatIsoDate(parseKlookDate(getField(row, ["Book Date"]))),
    bookTime: getField(row, ["Book Time"]),
    participationDate: formatIsoDate(
      parseKlookDate(getField(row, ["Participation Date"])),
    ),
    action,
    ticketStatus: getField(row, ["Ticket Status"]),
    refundDate: formatIsoDate(parseKlookDate(getField(row, ["Refund Date"]))),
    salesAmount: parseMoney(getField(row, ["Sales Amount"])),
    salesCurrency: parseCurrencyCode(getField(row, ["Sales Amount"])),
    salesAmountUsd: parseMoney(getField(row, ["Sales Amount(USD)"])),
    refundedSalesAmount: parseMoney(getField(row, ["Refunded Sales Amount"])),
    refundedSalesCurrency: parseCurrencyCode(
      getField(row, ["Refunded Sales Amount"]),
    ),
    refundedSalesAmountUsd: parseMoney(
      getField(row, ["Refunded Sales Amount(USD)"]),
    ),
    promoCodeType: getField(row, ["Promo Code Type"]),
    kreatorPromoCode: getField(row, ["Kreator Promo Code"]),
    commissionableSalesAmount: parseMoney(
      getField(row, ["Commissionable Sales Amount"]),
    ),
    commissionableSalesCurrency: parseCurrencyCode(
      getField(row, ["Commissionable Sales Amount"]),
    ),
    commissionableSalesAmountUsd: parseMoney(
      getField(row, ["Commissionable Sales Amount(USD)"]),
    ),
    commissionRate: getField(row, ["Commission Rate"]),
    commissionAmountBillingCurrency: parseMoney(
      getField(row, ["Commission Amount(Billing Currency)"]),
    ),
    commissionBillingCurrency: parseCurrencyCode(
      getField(row, ["Commission Amount(Billing Currency)"]),
    ),
    bonusRate: getField(row, ["Bonus Rate"]),
    bonusCommissionAmountBillingCurrency: parseMoney(
      getField(row, ["Bonus Commission Amount(Billing Currency)"]),
    ),
    payableCommissionAmt: payableCommissionUsd,
    payableCommissionCurrency: parseCurrencyCode(
      getField(row, ["Payable Commission Amt"]),
    ),
    partnerParams: getField(row, ["Partner Params"]),
    activityId: getField(row, ["Activity ID"]),
    activityName: getField(row, ["Activity Name"]),
    activityCategory: getField(row, ["Activity Category"]),
    destination: getField(row, ["Destination"]),
    platform: getField(row, ["Platform"]),
    userCountry: getField(row, ["User Country", "User country"]),
    supplyCategory01: getField(row, ["Supply Category 01"]),
    supplyCategory02: getField(row, ["Supply Category 02"]),
    supplyCategory03: getField(row, ["Supply Category 03"]),
    productType: getField(row, ["Product Type"]),
    adid: getField(row, ["ADID"]),
    adTagging: getField(row, ["AD Tagging"]),
    raw: row,
  };
}

function isTicketReportRows(rows) {
  const firstRow = rows.find((row) => row && Object.keys(row).length > 0) || {};

  return (
    hasHeader(firstRow, "Action Date") &&
    hasHeader(firstRow, "Commission Amount") &&
    hasHeader(firstRow, "Activity Name")
  );
}

function isBillingReportRows(rows) {
  const firstRow = rows.find((row) => row && Object.keys(row).length > 0) || {};

  return (
    hasHeader(firstRow, "Report Month") &&
    hasHeader(firstRow, "Payable Commission Amt") &&
    getField(firstRow, ["Report Type"]) === "Billing"
  );
}

function hasHeader(row, headerName) {
  return Object.prototype.hasOwnProperty.call(row, headerName);
}

function getBillingReportMonth(rows) {
  const firstRow = rows.find((row) => row && Object.keys(row).length > 0);
  return firstRow ? getField(firstRow, ["Report Month"]) : "";
}

async function refreshDashboardFromStoredData() {
  const allTransactions = await getAllTransactions();
  const imports = await getAllImports();
  const billingReports = await getAllBillingReports();

  if (!allTransactions.length) {
    activeDashboardView = "import";
    hideCompatibilityNotice();
    hideDashboardSections();
    return;
  }

  if (hasIncompatibleStoredData(allTransactions)) {
    activeDashboardView = "import";
    showCompatibilityNotice();
    hideDashboardSections();
    return;
  }

  hideCompatibilityNotice();
  details.dataset.hasData = "true";
  const selectedRange = getSelectedDateRange(allTransactions);
  const transactions = filterTransactionsByDateRange(allTransactions);
  const comparisonTransactions =
    comparisonMode.value === "previous" && selectedRange
      ? filterTransactionsByExplicitRange(
          allTransactions,
          selectedRange.previousStartDate,
          selectedRange.previousEndDate,
        )
      : [];

  const currentMetrics = calculateMetrics(transactions);
  const comparisonMetrics = calculateMetrics(comparisonTransactions);
  const payoutStatus = buildPayoutStatus(allTransactions, billingReports);
  const payoutViewData = buildPayoutViewData(allTransactions, payoutStatus);

  const netCommission = currentMetrics.netCommission;
  const paymentRows = currentMetrics.paymentRows;
  const avgCommissionPerBooking = currentMetrics.avgCommissionPerBooking;
  const refundRows = currentMetrics.refundRows;
  const actionDates = currentMetrics.actionDates;

  netCommissionEl.textContent = formatUsd(netCommission);
  paymentRowsEl.textContent = paymentRows.toLocaleString();
  avgCommissionPerBookingEl.textContent = formatUsd(avgCommissionPerBooking);
  refundRowsEl.textContent = refundRows.toLocaleString();
  dateRangeEl.textContent = `Date range: ${getDateRangeText(actionDates)}`;
  billingStatusEl.textContent = getLatestBillingStatusText(imports, payoutStatus);

  renderKpiComparison(
    netCommissionCompareEl,
    currentMetrics.netCommission,
    comparisonMetrics.netCommission,
    "commission",
  );

  renderKpiComparison(
    paymentRowsCompareEl,
    currentMetrics.paymentRows,
    comparisonMetrics.paymentRows,
    "bookings",
  );

  renderKpiComparison(
    avgCommissionPerBookingCompareEl,
    currentMetrics.avgCommissionPerBooking,
    comparisonMetrics.avgCommissionPerBooking,
    "avgCommissionPerBooking",
  );

  renderKpiComparison(
    refundRowsCompareEl,
    currentMetrics.refundRows,
    comparisonMetrics.refundRows,
    "refunds",
  );

  setSectionVisibility(analyticsSection, true);
  setSectionVisibility(summary, true);
  setSectionVisibility(details, true);
  setSectionVisibility(filters, true);
  setSectionVisibility(viewTabs, true);
  setSectionVisibility(importSection, true);

  if (!fileNameEl.textContent) {
    fileNameEl.textContent = "Stored dashboard data loaded.";
  }

  const trendConfig = getTrendMetricConfig(selectedTrendMetric);
  const trend = buildMetricTrend(
    transactions,
    trendGrouping.value,
    trendConfig,
  );

  const comparisonTrend =
    comparisonMode.value === "previous"
      ? buildMetricTrend(
          comparisonTransactions,
          trendGrouping.value,
          trendConfig,
        )
      : null;

  syncActiveKpiCard();
  renderChart(trend, comparisonTrend, trendConfig);

  renderTable("topActivities", buildTopList(transactions, "activityName"));
  renderTable("topDestinations", buildTopList(transactions, "destination"));
  renderActivityCategories(buildActivityCategoryBreakdown(transactions));
  renderRefundImpactTable(buildRefundImpact(transactions));
  renderDailyReport(allTransactions);
  renderMonthlySummary(allTransactions, []);
  renderDemographics(buildDemographics(transactions));
  renderPayouts(payoutViewData, imports);
  syncDashboardView();
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

function parseCurrencyCode(value) {
  if (!value) {
    return "";
  }

  const match = String(value).trim().match(/^([A-Z]{3})\b/i);
  return match ? match[1].toUpperCase() : "";
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

function renderChart(data, comparisonData = null, trendConfig) {
  const ctx = document.getElementById("commissionChart");
  trendChartTitle.textContent = `${trendConfig.label} Trend`;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const datasets = [
    {
      label: "Current Period",
      data: data.values,
      borderColor: trendConfig.borderColor,
      backgroundColor: trendConfig.backgroundColor,
      tension: 0.3,
      fill: true,
    },
  ];

  if (comparisonData && comparisonData.values.length) {
    datasets.push({
      label: "Previous Period",
      data: comparisonData.values,
      borderColor: "#4d40ca",
      backgroundColor: "rgba(77,64,202,0.04)",
      borderDash: [6, 6],
      tension: 0.3,
      fill: false,
    });
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.labels,
      datasets,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: datasets.length > 1,
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${trendConfig.formatValue(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => trendConfig.formatValue(value),
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
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

function buildActivityCategoryBreakdown(transactions) {
  const map = {};
  let totalBookings = 0;
  let totalCommission = 0;

  transactions.forEach((transaction) => {
    const category = normalizeDimensionValue(
      transaction.activityCategory,
      "Unknown",
    );

    if (!map[category]) {
      map[category] = {
        name: category,
        bookings: 0,
        netCommission: 0,
      };
    }

    map[category].netCommission += transaction.commissionAmountUsd;
    totalCommission += transaction.commissionAmountUsd;

    if (transaction.actionType === "Payment") {
      map[category].bookings += 1;
      totalBookings += 1;
    }
  });

  const rows = Object.values(map)
    .map((item) => ({
      ...item,
    }))
    .filter((item) => item.bookings > 0)
    .sort((a, b) => {
      if (b.bookings !== a.bookings) {
        return b.bookings - a.bookings;
      }

      return b.netCommission - a.netCommission;
    });

  return {
    totalBookings,
    totalCommission,
    rows,
  };
}

function renderActivityCategories(data) {
  const rows = getActivityCategoryRowsForMetric(
    data.rows,
    data.totalBookings,
    data.totalCommission,
    selectedActivityCategoryMetric,
  );

  renderActivityCategoryTable(rows, selectedActivityCategoryMetric);
  renderActivityCategoryChart(rows, selectedActivityCategoryMetric);
  syncActivityCategoryMetricToggle();
}

function getActivityCategoryRowsForMetric(
  rows,
  totalBookings,
  totalCommission,
  metric,
) {
  return rows
    .map((row) => {
      const metricValue =
        metric === "bookings" ? row.bookings : row.netCommission;
      const shareBase =
        metric === "bookings" ? totalBookings : Math.abs(totalCommission);
      const share = shareBase > 0 ? metricValue / shareBase : 0;

      return {
        ...row,
        metricValue,
        share,
      };
    })
    .sort((a, b) => b.metricValue - a.metricValue);
}

function renderActivityCategoryTable(rows, metric) {
  const tbody = document.querySelector("#activityCategoryTable tbody");
  tbody.innerHTML = "";
  activityCategoryMetricColumn.textContent =
    metric === "bookings" ? "Bookings" : "Net Commission";
  activityCategorySecondaryColumn.textContent =
    metric === "bookings" ? "Net Commission" : "Bookings";

  activityCategorySubtitle.textContent =
    metric === "bookings"
      ? "Booking share by activity category in the current filter range"
      : "Commission share by activity category in the current filter range";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-row">No category data in this range.</td></tr>';
    return;
  }

  rows.slice(0, 12).forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${metric === "bookings" ? row.bookings.toLocaleString() : formatUsd(row.netCommission)}</td>
      <td>${metric === "bookings" ? formatUsd(row.netCommission) : row.bookings.toLocaleString()}</td>
      <td>${formatPercentage(row.share)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderActivityCategoryChart(rows, metric) {
  const ctx = document.getElementById("activityCategoryChart");

  if (!ctx) {
    return;
  }

  if (activityCategoryChartInstance) {
    activityCategoryChartInstance.destroy();
  }

  const topRows = rows.slice(0, 8);

  if (!topRows.length) {
    const context = ctx.getContext("2d");
    if (context) {
      context.clearRect(0, 0, ctx.width, ctx.height);
    }
    return;
  }

  activityCategoryChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: topRows.map((row) => row.name),
      datasets: [
        {
          data: topRows.map((row) => row.metricValue),
          backgroundColor: [
            "#ff5b00",
            "#00cbd0",
            "#4d40ca",
            "#ffc200",
            "#f97316",
            "#0ea5e9",
            "#16a34a",
            "#a855f7",
          ],
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            boxWidth: 12,
            usePointStyle: true,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const row = topRows[context.dataIndex];
              const valueLabel =
                metric === "bookings"
                  ? `${row.bookings.toLocaleString()} bookings`
                  : formatUsd(row.netCommission);
              return `${row.name}: ${valueLabel} (${formatPercentage(row.share)})`;
            },
          },
        },
      },
    },
  });
}

function renderDemographics(data) {
  const topCountry = data.userCountries[0];
  const promoShare = data.totalBookings
    ? data.promoCodeBookings / data.totalBookings
    : 0;
  const codeBasedShare = data.totalBookings
    ? data.codeBasedBookings / data.totalBookings
    : 0;

  countryReachValue.textContent = data.countryReach.toLocaleString();
  topCountryValue.textContent = topCountry ? topCountry.name : "-";
  topCountryMeta.textContent = topCountry
    ? `${topCountry.bookings.toLocaleString()} bookings`
    : "0 bookings";
  promoBookingShareValue.textContent = formatPercentage(promoShare);
  codeBasedShareValue.textContent = formatPercentage(codeBasedShare);

  renderCountryTable(data.userCountries);
  renderPromoCodeTable(data.promoCodes);
  renderCountryRankingTable(data.countryRanking);
  renderCountryMap(data.countryRanking, selectedCountryMapMetric);
  renderSimpleMixTable("trackingBaseTable", data.trackingBase, "share");
  renderSimpleMixTable("platformTable", data.platforms, "share");
  renderCurrencyTable(data.salesCurrencies);
  syncCountryMapMetricToggle();

  demographicsSection.classList.remove("hidden");
}

async function exportBackup() {
  const transactions = await getAllTransactions();
  const billingReports = await getAllBillingReports();
  const imports = await getAllImports();

  const backup = {
    app: "klook-commission-dashboard",
    version: APP_VERSION,
    schemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    transactions,
    billingReports,
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

function getAllBillingReports() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("billingReports", "readonly");
    const store = transaction.objectStore("billingReports");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getLatestBillingStatusText(imports, payoutStatus = null) {
  const latestBillingImport = getLatestBillingImport(imports);

  if (!latestBillingImport) {
    return "Billing reports: none imported yet";
  }

  const reportMonth = latestBillingImport.reportMonth || "Unknown month";
  if (!payoutStatus) {
    return `Latest billing month imported: ${reportMonth}`;
  }

  const { paidOutBookings, totalPaymentBookings, deductionAdjustedBookings } =
    payoutStatus.summary;

  return (
    `Latest billing month imported: ${reportMonth} | ` +
    `Paid bookings matched: ${paidOutBookings.toLocaleString()} / ${totalPaymentBookings.toLocaleString()}`
    + (deductionAdjustedBookings > 0
      ? ` | Adjusted by deductions: ${deductionAdjustedBookings.toLocaleString()}`
      : "")
  );
}

function getLatestBillingImport(imports) {
  return [...imports]
    .filter(
      (item) =>
        item.importType === "billing" ||
        String(item.id || "").startsWith("billing-import-"),
    )
    .sort((a, b) => {
      const left = String(a.importedAt || "");
      const right = String(b.importedAt || "");
      return right.localeCompare(left);
    })[0];
}

function buildPayoutStatus(transactions, billingReports) {
  const bookingSummaries = buildBookingPayoutSummaries(transactions);
  const billingLookup = buildBillingLookup(billingReports);
  const byBookingKey = {};

  let matchedPaymentBookings = 0;
  let paidOutBookings = 0;
  let unpaidBookings = 0;
  let deductionAdjustedBookings = 0;
  let totalPaymentCommissionUsd = 0;
  let paidOutCommissionUsd = 0;
  let unpaidCommissionUsd = 0;
  let deductionAdjustedCommissionUsd = 0;

  bookingSummaries.forEach((booking) => {
    const match = findBillingMatch(booking, billingLookup);
    const billingRows = match.rows;
    const billRows = billingRows.filter((row) => row.action === "Bill");
    const deductionRows = billingRows.filter(
      (row) => row.action === "Deduction",
    );
    const paidMonths = [
      ...new Set(billRows.map((row) => row.reportMonth).filter(Boolean)),
    ].sort();
    const latestPaidReportMonth = paidMonths.length
      ? paidMonths[paidMonths.length - 1]
      : "";
    const totalPayableCommissionAmt = billingRows.reduce(
      (sum, row) => sum + (row.payableCommissionAmt || 0),
      0,
    );
    const deductionPayableCommissionAmt = deductionRows.reduce(
      (sum, row) => sum + (row.payableCommissionAmt || 0),
      0,
    );

    const outstandingCommissionUsd = Math.max(booking.netCommissionUsd, 0);
    totalPaymentCommissionUsd += outstandingCommissionUsd;

    let status = "unpaid";

    if (billRows.length > 0 && deductionRows.length > 0) {
      status = "paid_adjusted";
    } else if (billRows.length > 0) {
      status = "paid";
    } else if (deductionRows.length > 0) {
      status = "deduction_only";
    } else if (outstandingCommissionUsd <= 0) {
      status = "cleared_refund";
    }

    if (billingRows.length > 0) {
      matchedPaymentBookings += 1;
    }

    if (status === "unpaid") {
      unpaidBookings += 1;
    }

    if (billRows.length > 0) {
      paidOutBookings += 1;
      paidOutCommissionUsd += totalPayableCommissionAmt;
    }

    if (deductionRows.length > 0) {
      deductionAdjustedBookings += 1;
      deductionAdjustedCommissionUsd += deductionPayableCommissionAmt;
    }

    if (status === "unpaid") {
      unpaidCommissionUsd += outstandingCommissionUsd;
    }

    byBookingKey[booking.key] = {
      status,
      matchSource: match.source,
      billingRows,
      billRows,
      deductionRows,
      paidMonths,
      latestPaidReportMonth,
      totalPayableCommissionAmt,
      outstandingCommissionUsd,
      payScheme: billingRows[0]?.payScheme || "",
      ticketStatus: billingRows[0]?.ticketStatus || "",
    };
  });

  return {
    byBookingKey,
    bookingSummaries,
    summary: {
      totalPaymentBookings: bookingSummaries.length,
      matchedPaymentBookings,
      paidOutBookings,
      unpaidBookings,
      deductionAdjustedBookings,
      totalPaymentCommissionUsd,
      paidOutCommissionUsd,
      unpaidCommissionUsd,
      deductionAdjustedCommissionUsd,
    },
  };
}

function buildBookingPayoutSummaries(transactions) {
  const bookings = new Map();

  transactions.forEach((transaction) => {
    const bookingKey = getTransactionBookingKey(transaction);

    if (!bookings.has(bookingKey)) {
      bookings.set(bookingKey, {
        key: bookingKey,
        ticketId: String(transaction.ticketId || "").trim(),
        bookingNumber: String(transaction.bookingNumber || "").trim(),
        orderId: String(transaction.orderId || "").trim(),
        bookedDate: "",
        participationDate: "",
        activityName: transaction.activityName || "Unknown",
        destination: transaction.destination || "Unknown",
        paymentCount: 0,
        refundCount: 0,
        amendmentCount: 0,
        paymentCommissionUsd: 0,
        netCommissionUsd: 0,
      });
    }

    const booking = bookings.get(bookingKey);

    if (transaction.activityName) {
      booking.activityName = transaction.activityName;
    }

    if (transaction.destination) {
      booking.destination = transaction.destination;
    }

    if (
      transaction.participationDate &&
      (!booking.participationDate ||
        transaction.participationDate < booking.participationDate)
    ) {
      booking.participationDate = transaction.participationDate;
    }

    booking.netCommissionUsd += transaction.commissionAmountUsd;

    if (transaction.actionType === "Payment") {
      booking.paymentCount += 1;
      booking.paymentCommissionUsd += transaction.commissionAmountUsd;

      if (
        transaction.actionDate &&
        (!booking.bookedDate || transaction.actionDate < booking.bookedDate)
      ) {
        booking.bookedDate = transaction.actionDate;
      }
    } else if (!booking.bookedDate && transaction.actionDate) {
      booking.bookedDate = transaction.actionDate;
    }

    if (transaction.actionType === "Refund") {
      booking.refundCount += 1;
    }

    if (transaction.actionType === "Amendment") {
      booking.amendmentCount += 1;
    }
  });

  return [...bookings.values()].filter((booking) => booking.paymentCount > 0);
}

function getTransactionBookingKey(transaction) {
  const ticketId = String(transaction.ticketId || "").trim();
  const bookingNumber = String(transaction.bookingNumber || "").trim();
  const orderId = String(transaction.orderId || "").trim();

  if (ticketId) {
    return `ticket:${ticketId}`;
  }

  if (bookingNumber) {
    return `booking:${bookingNumber}`;
  }

  if (orderId) {
    return `order:${orderId}`;
  }

  return `row:${transaction.id}`;
}

function buildPayoutViewData(transactions, payoutStatus) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const unpaidRows = payoutStatus.bookingSummaries
    .map((booking) => {
      const payout = payoutStatus.byBookingKey[booking.key] || {
        status: "unpaid",
        payScheme: "",
      };
      const bookedDate = parseKlookDate(booking.bookedDate);
      const ageDays = bookedDate ? getInclusiveDayCount(bookedDate, today) - 1 : 0;

      return {
        id: booking.key,
        bookingNumber:
          booking.bookingNumber || booking.ticketId || booking.orderId || "-",
        bookedDate: booking.bookedDate,
        participationDate: booking.participationDate,
        ageDays,
        activityName: booking.activityName || "Unknown",
        destination: booking.destination || "Unknown",
        commissionAmountUsd: Math.max(booking.netCommissionUsd, 0),
        payScheme: payout.payScheme || "Unknown",
        status: payout.status,
      };
    })
    .filter((row) => row.status === "unpaid");

  const filteredUnpaidRows = filterUnpaidRowsByAge(
    unpaidRows,
    unpaidAgeFilter.value,
  );

  return {
    summary: payoutStatus.summary,
    latestBillingImport: null,
    unpaidRows,
    filteredUnpaidRows,
  };
}

function filterUnpaidRowsByAge(rows, ageFilter) {
  const sortRows = (items) => sortUnpaidRows(items);

  if (ageFilter === "all") {
    return sortRows(rows);
  }

  const threshold = Number(ageFilter);

  if (!Number.isFinite(threshold)) {
    return sortRows(rows);
  }

  return sortRows(rows.filter((row) => row.ageDays > threshold));
}

function sortUnpaidRows(rows) {
  const { field, direction } = unpaidBookingsSort;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    if (field === "bookedDate" || field === "participationDate") {
      const leftTime = parseKlookDate(left.bookedDate)?.getTime() || 0;
      const rightTime = parseKlookDate(right.bookedDate)?.getTime() || 0;
      if (field === "participationDate") {
        const leftParticipationTime =
          parseKlookDate(left.participationDate)?.getTime() || 0;
        const rightParticipationTime =
          parseKlookDate(right.participationDate)?.getTime() || 0;
        return (leftParticipationTime - rightParticipationTime) * multiplier;
      }
      return (leftTime - rightTime) * multiplier;
    }

    if (field === "ageDays" || field === "commissionAmountUsd") {
      return (left[field] - right[field]) * multiplier;
    }

    const leftValue = String(left[field] || "").toLowerCase();
    const rightValue = String(right[field] || "").toLowerCase();
    return leftValue.localeCompare(rightValue) * multiplier;
  });
}

function renderPayouts(data, imports) {
  const latestBillingImport = getLatestBillingImport(imports);
  const isCommissionMetric = selectedPayoutMetric === "commission";

  payoutTotalLabel.textContent = isCommissionMetric
    ? "Total Net Commission"
    : "Total Payment Bookings";
  payoutPaidLabel.textContent = isCommissionMetric ? "Paid Out" : "Paid Out";
  payoutUnpaidLabel.textContent = isCommissionMetric ? "Outstanding" : "Unpaid";
  payoutAdjustedLabel.textContent = isCommissionMetric ? "Deductions" : "Adjusted";

  payoutTotalBookings.textContent = isCommissionMetric
    ? formatUsd(data.summary.totalPaymentCommissionUsd)
    : data.summary.totalPaymentBookings.toLocaleString();
  payoutPaidBookings.textContent = isCommissionMetric
    ? formatUsd(data.summary.paidOutCommissionUsd)
    : data.summary.paidOutBookings.toLocaleString();
  payoutUnpaidBookings.textContent = isCommissionMetric
    ? formatUsd(data.summary.unpaidCommissionUsd)
    : data.summary.unpaidBookings.toLocaleString();
  payoutAdjustedBookings.textContent = isCommissionMetric
    ? formatUsd(data.summary.deductionAdjustedCommissionUsd)
    : data.summary.deductionAdjustedBookings.toLocaleString();

  payoutTotalMeta.textContent = isCommissionMetric
    ? `${data.summary.totalPaymentBookings.toLocaleString()} payment bookings`
    : "Imported payment bookings";
  payoutPaidMeta.textContent = isCommissionMetric
    ? `${data.summary.paidOutBookings.toLocaleString()} bookings matched to billing`
    : "Matched to billing report rows";
  payoutUnpaidMeta.textContent = isCommissionMetric
    ? `${data.summary.unpaidBookings.toLocaleString()} bookings not yet matched`
    : "Not yet matched to any billing row";
  payoutLatestMonth.textContent = latestBillingImport
    ? `Latest month: ${latestBillingImport.reportMonth || "Unknown"}`
    : "Latest month: none";

  renderUnpaidBookingsTable(data.filteredUnpaidRows);
  syncPayoutMetricToggle();
}

function renderUnpaidBookingsTable(rows) {
  const tbody = document.querySelector("#unpaidBookingsTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="empty-row">No unpaid bookings in this filter.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.bookingNumber}</td>
      <td>${row.bookedDate ? formatShortDate(row.bookedDate) : "-"}</td>
      <td>${row.participationDate ? formatShortDate(row.participationDate) : "-"}</td>
      <td>${row.ageDays.toLocaleString()}d</td>
      <td>${row.activityName}</td>
      <td>${row.destination}</td>
      <td>${formatUsd(row.commissionAmountUsd)}</td>
      <td>${row.payScheme}</td>
      <td>${formatPayoutStatus(row.status)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function formatPayoutStatus(status) {
  const labels = {
    unpaid: "Unpaid",
    paid: "Paid",
    paid_adjusted: "Paid + Adjusted",
    deduction_only: "Deduction Only",
    cleared_refund: "Refund Cleared",
  };

  return labels[status] || status;
}

function buildBillingLookup(billingReports) {
  const lookup = {
    byTicketId: new Map(),
    byOrderId: new Map(),
    byBookingNumber: new Map(),
  };

  billingReports.forEach((row) => {
    addBillingLookupEntry(lookup.byTicketId, row.ticketId, row);
    addBillingLookupEntry(lookup.byOrderId, row.orderId, row);
    addBillingLookupEntry(lookup.byBookingNumber, row.bookingNumber, row);
  });

  return lookup;
}

function addBillingLookupEntry(map, key, row) {
  const normalizedKey = String(key || "").trim();

  if (!normalizedKey) {
    return;
  }

  if (!map.has(normalizedKey)) {
    map.set(normalizedKey, []);
  }

  map.get(normalizedKey).push(row);
}

function findBillingMatch(transaction, billingLookup) {
  const ticketId = String(transaction.ticketId || "").trim();
  const orderId = String(transaction.orderId || "").trim();
  const bookingNumber = String(transaction.bookingNumber || "").trim();

  if (ticketId && billingLookup.byTicketId.has(ticketId)) {
    return {
      source: "ticketId",
      rows: billingLookup.byTicketId.get(ticketId),
    };
  }

  if (bookingNumber && billingLookup.byBookingNumber.has(bookingNumber)) {
    return {
      source: "bookingNumber",
      rows: billingLookup.byBookingNumber.get(bookingNumber),
    };
  }

  const orderRows = orderId ? billingLookup.byOrderId.get(orderId) || [] : [];

  if (!ticketId && !bookingNumber && orderRows.length === 1) {
    return {
      source: "orderId",
      rows: orderRows,
    };
  }

  return {
    source: "",
    rows: [],
  };
}

async function importBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);
  const storedTransactions = await getAllTransactions();

  if (
    backup.app !== "klook-commission-dashboard" ||
    !Array.isArray(backup.transactions)
  ) {
    alert("This does not look like a valid dashboard backup file.");
    return;
  }

  if (hasIncompatibleStoredData(storedTransactions)) {
    alert(
      "Stored data is from an older dashboard version. Clear data and re-import all CSV files before importing a backup.",
    );
    return;
  }

  if (hasIncompatibleStoredData(backup.transactions)) {
    alert(
      "This backup is from an older dashboard version. Re-import your original CSV exports instead.",
    );
    return;
  }

  const existingIds = await getAllTransactionIds();
  const existingBillingIds = await getAllBillingReportIds();

  let rowsAdded = 0;
  let duplicatesSkipped = 0;
  let billingRowsAdded = 0;
  let billingDuplicatesSkipped = 0;

  const transaction = db.transaction(
    ["transactions", "billingReports", "imports"],
    "readwrite",
  );
  const transactionStore = transaction.objectStore("transactions");
  const billingStore = transaction.objectStore("billingReports");
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

  if (Array.isArray(backup.billingReports)) {
    backup.billingReports.forEach((item) => {
      if (existingBillingIds.has(item.id)) {
        billingDuplicatesSkipped += 1;
        return;
      }

      existingBillingIds.add(item.id);
      billingStore.add(item);
      billingRowsAdded += 1;
    });
  }

  if (Array.isArray(backup.imports)) {
    backup.imports.forEach((item) => {
      importStore.put(item);
    });
  }

  await waitForTransaction(transaction);
  await refreshDashboardFromStoredData();

  fileNameEl.textContent =
    `Backup imported: ${rowsAdded.toLocaleString()} transaction rows added, ` +
    `${billingRowsAdded.toLocaleString()} billing rows added | ` +
    `${(duplicatesSkipped + billingDuplicatesSkipped).toLocaleString()} duplicates skipped`;
}

function clearAllData() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ["transactions", "billingReports", "imports"],
      "readwrite",
    );

    transaction.objectStore("transactions").clear();
    transaction.objectStore("billingReports").clear();
    transaction.objectStore("imports").clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function getAllBillingReportIds() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("billingReports", "readonly");
    const store = transaction.objectStore("billingReports");
    const request = store.getAllKeys();

    request.onsuccess = () => resolve(new Set(request.result));
    request.onerror = () => reject(request.error);
  });
}

function hasIncompatibleStoredData(transactions) {
  return transactions.some((transaction) => !isCompatibleTransaction(transaction));
}

function isCompatibleTransaction(transaction) {
  const requiredFields = [
    "schemaVersion",
    "trackingBase",
    "promoCodeType",
    "kreatorPromoCode",
    "salesCurrency",
    "salesAmount",
    "websiteName",
  ];

  return (
    transaction?.schemaVersion === DATA_SCHEMA_VERSION &&
    requiredFields.every((field) =>
      Object.prototype.hasOwnProperty.call(transaction, field),
    )
  );
}

function hideDashboardSections() {
  details.dataset.hasData = details.textContent.trim() ? "true" : "false";
  dailyReport.dataset.hasData = "false";
  monthlySummary.dataset.hasData = "false";

  setSectionVisibility(importSection, true);
  setSectionVisibility(summary, false);
  setSectionVisibility(details, false);
  setSectionVisibility(filters, false);
  setSectionVisibility(viewTabs, true);
  setSectionVisibility(analyticsSection, false);
  setSectionVisibility(dailyReport, false);
  setSectionVisibility(monthlySummary, false);
  setSectionVisibility(demographicsSection, false);
  setSectionVisibility(payoutsSection, false);
  syncDashboardView();
}

function showCompatibilityNotice() {
  compatibilityMessage.textContent =
    "Stored dashboard data is from an older version and does not include the demographics fields used by this release.";
  compatibilityNotice.classList.remove("hidden");
}

function hideCompatibilityNotice() {
  compatibilityNotice.classList.add("hidden");
}

function openAboutModal() {
  aboutModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeAboutModal() {
  aboutModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function hydrateVersionUi() {
  appVersionBadge.textContent = `v${APP_VERSION}`;
  aboutAppVersion.textContent = `v${APP_VERSION}`;
  aboutSchemaVersion.textContent = String(DATA_SCHEMA_VERSION);
}

function syncDashboardView() {
  const isImport = activeDashboardView === "import";
  const isOverview = activeDashboardView === "overview";
  const isBookings = activeDashboardView === "bookings";
  const isPayouts = activeDashboardView === "payouts";

  setSectionVisibility(importSection, isImport);
  setSectionVisibility(
    details,
    isImport && details.dataset.hasData === "true",
  );
  setSectionVisibility(filters, isBookings);
  setSectionVisibility(summary, isBookings);
  setSectionVisibility(analyticsSection, isBookings);
  setSectionVisibility(
    dailyReport,
    isOverview && dailyReport.dataset.hasData === "true",
  );
  setSectionVisibility(
    monthlySummary,
    isOverview && monthlySummary.dataset.hasData === "true",
  );
  setSectionVisibility(demographicsSection, isBookings);
  setSectionVisibility(payoutsSection, isPayouts);

  viewTabButtons.forEach((button) => {
    const isActive = button.dataset.view === activeDashboardView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setSectionVisibility(element, isVisible) {
  element.classList.toggle("hidden", !isVisible);

  if (isVisible) {
    element.removeAttribute("hidden");
  } else {
    element.setAttribute("hidden", "");
  }
}

function filterTransactionsByDateRange(transactions) {
  const selectedRange = getSelectedDateRange(transactions);

  if (!selectedRange) {
    return transactions;
  }

  return filterTransactionsByExplicitRange(
    transactions,
    selectedRange.startDate,
    selectedRange.endDate,
  );
}

function getSelectedDateRange(transactions) {
  const value = dateRangeFilter.value;

  if (value === "all") {
    return null;
  }

  const sortedDates = transactions
    .map((transaction) => parseKlookDate(transaction.actionDate))
    .filter((date) => date !== null)
    .sort((a, b) => b - a);

  if (!sortedDates.length) {
    return null;
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
      return null;
    }

    startDate = parseKlookDate(customStartDate.value);
    endDate = parseKlookDate(customEndDate.value);
  }

  if (!startDate || !endDate) {
    return null;
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const periodDays = getInclusiveDayCount(startDate, endDate);

  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  previousEndDate.setHours(23, 59, 59, 999);

  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - periodDays + 1);
  previousStartDate.setHours(0, 0, 0, 0);

  return {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
  };
}

function filterTransactionsByExplicitRange(transactions, startDate, endDate) {
  return transactions.filter((transaction) => {
    const actionDate = parseKlookDate(transaction.actionDate);

    if (!actionDate) {
      return false;
    }

    return actionDate >= startDate && actionDate <= endDate;
  });
}

function getInclusiveDayCount(startDate, endDate) {
  const oneDayMs = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return Math.round((end - start) / oneDayMs) + 1;
}

function buildMetricTrend(transactions, grouping, trendConfig) {
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

    if (!map[trendItem.sortKey]) {
      map[trendItem.sortKey] = {
        label: trendItem.label,
        startDate: trendItem.startDate,
        endDate: trendItem.endDate,
        aggregate: trendConfig.createAggregate(),
      };
    }

    trendConfig.accumulate(map[trendItem.sortKey].aggregate, transaction);
  });

  const sortedItems = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, item]) => item);

  const visibleItems = getVisibleTrendItems(
    sortedItems,
    grouping,
    minDate,
    maxDate,
  );

  return {
    labels: visibleItems.map((item) => item.label),
    values: visibleItems.map((item) => trendConfig.finalize(item.aggregate)),
  };
}

function getVisibleTrendItems(items, grouping, minDate, maxDate) {
  if (grouping === "daily") {
    return items;
  }

  const completeItems = items.filter(
    (item) =>
      !isIncompletePeriod(item.startDate, item.endDate, minDate, maxDate),
  );

  return completeItems.length > 0 ? completeItems : items;
}

function getTrendMetricConfig(metric) {
  const metricConfig = {
    netCommission: {
      label: "Net Commission",
      borderColor: "#ff5b00",
      backgroundColor: "rgba(255,91,0,0.1)",
      createAggregate: () => ({ total: 0 }),
      accumulate: (aggregate, transaction) => {
        aggregate.total += transaction.commissionAmountUsd;
      },
      finalize: (aggregate) => aggregate.total,
      formatValue: (value) => formatUsd(value),
    },
    bookings: {
      label: "Bookings",
      borderColor: "#00cbd0",
      backgroundColor: "rgba(0,203,208,0.1)",
      createAggregate: () => ({ count: 0 }),
      accumulate: (aggregate, transaction) => {
        if (transaction.actionType === "Payment") {
          aggregate.count += 1;
        }
      },
      finalize: (aggregate) => aggregate.count,
      formatValue: (value) => Number(value).toLocaleString(),
    },
    avgCommissionPerBooking: {
      label: "Avg Commission / Booking",
      borderColor: "#4d40ca",
      backgroundColor: "rgba(77,64,202,0.08)",
      createAggregate: () => ({ commission: 0, bookings: 0 }),
      accumulate: (aggregate, transaction) => {
        if (transaction.actionType === "Payment") {
          aggregate.commission += transaction.commissionAmountUsd;
          aggregate.bookings += 1;
        }
      },
      finalize: (aggregate) =>
        aggregate.bookings > 0
          ? aggregate.commission / aggregate.bookings
          : 0,
      formatValue: (value) => formatUsd(value),
    },
    refunds: {
      label: "Refunds",
      borderColor: "#f59e0b",
      backgroundColor: "rgba(245,158,11,0.12)",
      createAggregate: () => ({ count: 0 }),
      accumulate: (aggregate, transaction) => {
        if (transaction.actionType === "Refund") {
          aggregate.count += 1;
        }
      },
      finalize: (aggregate) => aggregate.count,
      formatValue: (value) => Number(value).toLocaleString(),
    },
  };

  return metricConfig[metric] || metricConfig.netCommission;
}

function syncActiveKpiCard() {
  kpiCards.forEach((card) => {
    const isActive = card.dataset.metric === selectedTrendMetric;
    card.classList.toggle("active", isActive);
    card.setAttribute("aria-pressed", String(isActive));
  });
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

  const days = allDays.slice(-30);

  if (!days.length) {
    dailyReport.dataset.hasData = "false";
    setSectionVisibility(dailyReport, false);
    return;
  }

  const total = days.reduce((sum, day) => sum + day.commission, 0);
  const totalBookings = days.reduce((sum, day) => sum + day.bookings, 0);
  const average = total / days.length;

  const firstDate = parseKlookDate(days[0].date);
  const lastDate = parseKlookDate(days[days.length - 1].date);

  dailyReportTitle.textContent = `Last 30 Active Days — ${formatDate(firstDate)} through ${formatDate(lastDate)}`;

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

  dailyReport.dataset.hasData = "true";
  setSectionVisibility(dailyReport, activeDashboardView === "overview");
}

function formatShortDate(value) {
  const date = parseKlookDate(value);

  if (!date) {
    return value;
  }

  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
  const day = date.getDate();
  const year = date.getFullYear();

  return `${day}${month}${year}`;
}

function renderMonthlySummary(transactions, comparisonTransactions = []) {
  const map = buildMonthlySummaryMap(transactions);
  const comparisonMap = buildMonthlySummaryMap(comparisonTransactions);

  const months = Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12);

  monthlySummaryGrid.innerHTML = "";

  months.forEach(([monthKey, data]) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    const averageBooking =
      data.paymentCount > 0 ? data.netCommission / data.paymentCount : 0;

    const comparisonTotal = Object.values(comparisonMap).reduce(
      (sum, item) => sum + item.netCommission,
      0,
    );

    const comparisonHtml =
      comparisonMode.value === "previous" && comparisonTotal !== 0
        ? `<small class="${getComparisonClass(data.netCommission, comparisonTotal)}">
            ${formatPercentChange(data.netCommission, comparisonTotal)} vs previous period
          </small>`
        : "";

    const card = document.createElement("div");
    card.className = "monthly-card";

    card.innerHTML = `
      <span>${formatMonthLabel(date)}</span>
      <strong>${formatUsd(data.netCommission)}</strong>
      ${comparisonHtml}
      <small>${data.paymentCount.toLocaleString()} payment bookings</small>
      <small>${data.refundCount.toLocaleString()} refunds (${formatUsd(data.refundCommission)})</small>
      <small>${formatUsd(averageBooking)} net avg / booking</small>
    `;

    monthlySummaryGrid.appendChild(card);
  });

  monthlySummary.dataset.hasData = months.length > 0 ? "true" : "false";
  setSectionVisibility(
    monthlySummary,
    months.length > 0 && activeDashboardView === "overview",
  );
}

function buildMonthlySummaryMap(transactions) {
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

  return map;
}

function formatPercentChange(currentValue, previousValue) {
  if (previousValue === 0) {
    return "No previous data";
  }

  const percent =
    ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const sign = percent >= 0 ? "+" : "";

  return `${sign}${percent.toFixed(1)}%`;
}

function getComparisonClass(currentValue, previousValue) {
  if (currentValue >= previousValue) {
    return "comparison-positive";
  }

  return "comparison-negative";
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildDemographics(transactions) {
  const countryMap = {};
  const promoMap = {};
  const trackingBaseMap = {};
  const platformMap = {};
  const salesCurrencyMap = {};

  let totalBookings = 0;
  let promoCodeBookings = 0;
  let codeBasedBookings = 0;

  transactions.forEach((transaction) => {
    const countryCode = normalizeCountryCode(transaction.userCountry);
    const country = countryCode || "Unknown";
    const promoCode = normalizeDimensionValue(
      transaction.kreatorPromoCode,
      "No Code",
    );
    const trackingBase = normalizeTrackingBase(transaction.trackingBase);
    const platform = normalizeDimensionValue(transaction.platform, "Unknown");
    const salesCurrency = normalizeDimensionValue(
      transaction.salesCurrency,
      "Unknown",
    );

    if (transaction.actionType === "Payment") {
      totalBookings += 1;

      if (!countryMap[country]) {
        countryMap[country] = {
          code: countryCode,
          name: formatCountryName(countryCode || country),
          bookings: 0,
          netCommission: 0,
          refundCount: 0,
        };
      }

      countryMap[country].bookings += 1;
      countryMap[country].netCommission += transaction.commissionAmountUsd;

      if (!trackingBaseMap[trackingBase]) {
        trackingBaseMap[trackingBase] = { name: trackingBase, bookings: 0 };
      }

      trackingBaseMap[trackingBase].bookings += 1;

      if (!platformMap[platform]) {
        platformMap[platform] = { name: platform, bookings: 0 };
      }

      platformMap[platform].bookings += 1;

      if (!salesCurrencyMap[salesCurrency]) {
        salesCurrencyMap[salesCurrency] = {
          name: salesCurrency,
          bookings: 0,
          salesAmount: 0,
        };
      }

      salesCurrencyMap[salesCurrency].bookings += 1;
      salesCurrencyMap[salesCurrency].salesAmount += transaction.salesAmount || 0;

      if (promoCode !== "No Code") {
        promoCodeBookings += 1;

        if (!promoMap[promoCode]) {
          promoMap[promoCode] = {
            name: promoCode,
            bookings: 0,
            netCommission: 0,
          };
        }

        promoMap[promoCode].bookings += 1;
        promoMap[promoCode].netCommission += transaction.commissionAmountUsd;
      }

      if (trackingBase === "Code-Based") {
        codeBasedBookings += 1;
      }
    }

    if (transaction.actionType === "Refund") {
      if (!countryMap[country]) {
        countryMap[country] = {
          code: countryCode,
          name: formatCountryName(countryCode || country),
          bookings: 0,
          netCommission: 0,
          refundCount: 0,
        };
      }

      countryMap[country].netCommission += transaction.commissionAmountUsd;
      countryMap[country].refundCount += 1;

      if (promoCode !== "No Code") {
        if (!promoMap[promoCode]) {
          promoMap[promoCode] = {
            name: promoCode,
            bookings: 0,
            netCommission: 0,
          };
        }

        promoMap[promoCode].netCommission += transaction.commissionAmountUsd;
      }
    }
  });

  const userCountries = Object.values(countryMap)
    .map((item) => ({
      ...item,
      avgCommissionPerBooking:
        item.bookings > 0 ? item.netCommission / item.bookings : 0,
      refundRate: item.bookings > 0 ? item.refundCount / item.bookings : 0,
    }))
    .sort((a, b) => {
      if (b.bookings !== a.bookings) {
        return b.bookings - a.bookings;
      }

      return b.netCommission - a.netCommission;
    })
    .slice(0, 12);

  const countryRanking = Object.values(countryMap)
    .map((item) => ({
      ...item,
      avgCommissionPerBooking:
        item.bookings > 0 ? item.netCommission / item.bookings : 0,
      refundRate: item.bookings > 0 ? item.refundCount / item.bookings : 0,
    }))
    .filter((item) => item.bookings > 0)
    .sort((a, b) => {
      if (selectedCountryMapMetric === "bookings") {
        return b.bookings - a.bookings;
      }

      return b.netCommission - a.netCommission;
    })
    .slice(0, 12);

  const promoCodes = Object.values(promoMap)
    .map((item) => ({
      ...item,
      share: totalBookings > 0 ? item.bookings / totalBookings : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10);

  return {
    countryReach: Object.values(countryMap).filter(
      (item) => item.name !== "Unknown" && item.bookings > 0,
    ).length,
    totalBookings,
    promoCodeBookings,
    codeBasedBookings,
    userCountries,
    countryRanking,
    promoCodes,
    trackingBase: buildShareList(trackingBaseMap, totalBookings),
    platforms: buildShareList(platformMap, totalBookings),
    salesCurrencies: Object.values(salesCurrencyMap)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 8),
  };
}

function buildShareList(map, totalBookings) {
  return Object.values(map)
    .map((item) => ({
      ...item,
      share: totalBookings > 0 ? item.bookings / totalBookings : 0,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);
}

function renderCountryTable(rows) {
  const tbody = document.querySelector("#userCountryTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-row">No country data in this range.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.bookings.toLocaleString()}</td>
      <td>${formatUsd(row.netCommission)}</td>
      <td>${formatUsd(row.avgCommissionPerBooking)}</td>
      <td>${formatPercentage(row.refundRate)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCountryRankingTable(rows) {
  const tbody = document.querySelector("#countryRankingTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-row">No ranked country data in this range.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.bookings.toLocaleString()}</td>
      <td>${formatUsd(row.netCommission)}</td>
      <td>${formatUsd(row.avgCommissionPerBooking)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPromoCodeTable(rows) {
  const tbody = document.querySelector("#promoCodeTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="empty-row">No promo code usage in this range.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.bookings.toLocaleString()}</td>
      <td>${formatUsd(row.netCommission)}</td>
      <td>${formatPercentage(row.share)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSimpleMixTable(elementId, rows, valueField) {
  const tbody = document.querySelector(`#${elementId} tbody`);
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-row">No data in this range.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.bookings.toLocaleString()}</td>
      <td>${valueField === "share" ? formatPercentage(row.share) : row[valueField]}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCurrencyTable(rows) {
  const tbody = document.querySelector("#salesCurrencyTable tbody");
  tbody.innerHTML = "";

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="3" class="empty-row">No currency data in this range.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.bookings.toLocaleString()}</td>
      <td>${formatCurrencyBucketTotal(row.name, row.salesAmount)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCountryMap(rows, metric) {
  if (!userCountryMap || typeof Plotly === "undefined") {
    return;
  }

  const mappedRows = rows.filter((row) => row.code && row.code.length === 2);
  const metricLabel =
    metric === "bookings" ? "Bookings" : "Net Commission";
  const values = mappedRows.map((row) =>
    metric === "bookings" ? row.bookings : row.netCommission,
  );

  if (!mappedRows.length) {
    userCountryMap.innerHTML =
      '<div class="map-empty-state">No mappable country data in this range.</div>';
    return;
  }

  Plotly.react(
    userCountryMap,
    [
      {
        type: "choropleth",
        locationmode: "ISO-3",
        locations: mappedRows.map((row) => toIso3CountryCode(row.code)),
        z: values,
        text: mappedRows.map((row) => row.name),
        colorscale:
          metric === "bookings"
            ? [
                [0, "#d9f3f4"],
                [0.45, "#7ad8db"],
                [1, "#00aeb4"],
              ]
            : [
                [0, "#ffe2d2"],
                [0.45, "#ff9b67"],
                [1, "#ff5b00"],
              ],
        marker: {
          line: {
            color: "#ffffff",
            width: 0.6,
          },
        },
        showscale: false,
        hovertemplate:
          "<b>%{text}</b><br>" +
          `${metricLabel}: %{customdata[0]}<br>` +
          "Bookings: %{customdata[1]}<br>" +
          "Avg / Booking: %{customdata[2]}<extra></extra>",
        customdata: mappedRows.map((row) => [
          metric === "bookings"
            ? row.bookings.toLocaleString()
            : formatUsd(row.netCommission),
          row.bookings.toLocaleString(),
          formatUsd(row.avgCommissionPerBooking),
        ]),
      },
    ],
    {
      margin: { t: 0, r: 12, b: 0, l: 12 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      geo: {
        projection: { type: "natural earth", scale: 0.98 },
        fitbounds: false,
        showframe: false,
        showcoastlines: false,
        showcountries: true,
        countrycolor: "#ffffff",
        showland: true,
        landcolor: "#eef2f6",
        bgcolor: "rgba(0,0,0,0)",
        domain: {
          x: [0.02, 0.98],
          y: [0.05, 0.96],
        },
      },
    },
    {
      responsive: true,
      displayModeBar: false,
    },
  );
}

function normalizeDimensionValue(value, fallback = "Unknown") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function normalizeCountryCode(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "";
}

function formatCountryName(value) {
  if (!value || value === "Unknown") {
    return "Unknown";
  }

  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(value) || value;
  } catch {
    return value;
  }
}

function toIso3CountryCode(code) {
  const isoMap = {
    AU: "AUS",
    BR: "BRA",
    CA: "CAN",
    CN: "CHN",
    DE: "DEU",
    ES: "ESP",
    FR: "FRA",
    GB: "GBR",
    HK: "HKG",
    ID: "IDN",
    IN: "IND",
    IT: "ITA",
    JP: "JPN",
    KR: "KOR",
    MO: "MAC",
    MX: "MEX",
    MY: "MYS",
    NL: "NLD",
    NZ: "NZL",
    PH: "PHL",
    SG: "SGP",
    TH: "THA",
    TW: "TWN",
    US: "USA",
    VN: "VNM",
  };

  return isoMap[code] || code;
}

function syncCountryMapMetricToggle() {
  mapMetricButtons.forEach((button) => {
    const isActive = button.dataset.mapMetric === selectedCountryMapMetric;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncPayoutMetricToggle() {
  payoutMetricButtons.forEach((button) => {
    const isActive = button.dataset.payoutMetric === selectedPayoutMetric;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncActivityCategoryMetricToggle() {
  categoryMetricButtons.forEach((button) => {
    const isActive =
      button.dataset.categoryMetric === selectedActivityCategoryMetric;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function normalizeTrackingBase(value) {
  const normalized = normalizeDimensionValue(value, "Unknown");

  if (normalized.toLowerCase() === "code-based") {
    return "Code-Based";
  }

  return normalized;
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrencyBucketTotal(currency, amount) {
  if (!currency || currency === "Unknown") {
    return amount.toFixed(2);
  }

  return `${currency} ${amount.toFixed(2)}`;
}

function calculateMetrics(transactions) {
  const metrics = {
    netCommission: 0,
    paymentRows: 0,
    refundRows: 0,
    avgCommissionPerBooking: 0,
    actionDates: [],
  };

  transactions.forEach((row) => {
    metrics.netCommission += row.commissionAmountUsd;

    if (row.actionType === "Payment") {
      metrics.paymentRows += 1;
    }

    if (row.actionType === "Refund") {
      metrics.refundRows += 1;
    }

    if (row.actionDate) {
      metrics.actionDates.push(row.actionDate);
    }
  });

  metrics.avgCommissionPerBooking =
    metrics.paymentRows > 0 ? metrics.netCommission / metrics.paymentRows : 0;

  return metrics;
}

function renderKpiComparison(element, currentValue, previousValue, label) {
  if (comparisonMode.value === "off" || previousValue === 0) {
    element.textContent = "";
    element.className = "comparison-note";
    return;
  }

  const percent =
    ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const sign = percent >= 0 ? "+" : "";

  element.textContent = `${sign}${percent.toFixed(1)}% vs previous period`;
  element.className = `comparison-note ${getComparisonDirectionClass(
    currentValue,
    previousValue,
    label,
  )}`;
}

function getComparisonDirectionClass(currentValue, previousValue, label) {
  if (label === "refunds") {
    return currentValue <= previousValue
      ? "comparison-positive"
      : "comparison-negative";
  }

  return currentValue >= previousValue
    ? "comparison-positive"
    : "comparison-negative";
}
