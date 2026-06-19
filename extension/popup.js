const currentUrlElement = document.getElementById("currentUrl");
const loginStatusElement = document.getElementById("loginStatus");
const summaryTextElement = document.getElementById("summaryText");
const usernameCountElement = document.getElementById("usernameCount");
const passwordCountElement = document.getElementById("passwordCount");
const detailsBoxElement = document.getElementById("detailsBox");
const statusDotElement = document.getElementById("statusDot");
const scanButton = document.getElementById("scanButton");

function setStatusDot(status) {
  statusDotElement.className = "status-dot";

  if (status) {
    statusDotElement.classList.add(status);
  }
}

function setLoadingState() {
  scanButton.disabled = true;
  scanButton.textContent = "Scanning...";
  setStatusDot("");
  loginStatusElement.textContent = "Checking page...";
  summaryTextElement.textContent =
    "SecureVault is scanning the current page for login fields.";
  usernameCountElement.textContent = "0";
  passwordCountElement.textContent = "0";
  detailsBoxElement.textContent = "Waiting for scan...";
}

function setErrorState(message) {
  scanButton.disabled = false;
  scanButton.textContent = "Scan Again";
  setStatusDot("error");
  loginStatusElement.textContent = "Scan failed";
  summaryTextElement.textContent = message;
  detailsBoxElement.textContent = message;
}

function getShortUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname + parsedUrl.pathname;
  } catch {
    return url || "Unknown page";
  }
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  return tabs[0];
}

async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["contentScript.js"]
  });
}

async function detectLoginFields(tabId) {
  return chrome.tabs.sendMessage(tabId, {
    type: "SECUREVAULT_DETECT_LOGIN_FIELDS"
  });
}

function renderDetectionResult(result) {
  scanButton.disabled = false;
  scanButton.textContent = "Scan Again";

  currentUrlElement.textContent = getShortUrl(result.pageUrl);

  usernameCountElement.textContent = String(result.usernameCandidateCount);
  passwordCountElement.textContent = String(result.passwordFieldCount);

  if (result.hasLoginForm) {
    setStatusDot("success");
    loginStatusElement.textContent = "Login form detected";
    summaryTextElement.textContent =
      "SecureVault found password fields on this page. This page can likely support autofill.";
  } else if (result.visibleInputCount > 0) {
    setStatusDot("warning");
    loginStatusElement.textContent = "Inputs found, but no password field";
    summaryTextElement.textContent =
      "SecureVault found input fields, but no visible password field. This may be a multi-step login page.";
  } else {
    setStatusDot("warning");
    loginStatusElement.textContent = "No login form detected";
    summaryTextElement.textContent =
      "SecureVault did not find visible login fields on this page.";
  }

  detailsBoxElement.textContent = JSON.stringify(
    {
      title: result.pageTitle,
      hostname: result.hostname,
      forms: result.formCount,
      totalInputs: result.totalInputCount,
      visibleInputs: result.visibleInputCount,
      usernameCandidates: result.usernameCandidates,
      passwordFields: result.passwordFields
    },
    null,
    2
  );
}

async function scanCurrentPage() {
  try {
    setLoadingState();

    const activeTab = await getActiveTab();

    if (!activeTab?.id) {
      setErrorState("No active tab found.");
      return;
    }

    currentUrlElement.textContent = getShortUrl(activeTab.url);

    if (
      activeTab.url.startsWith("chrome://") ||
      activeTab.url.startsWith("chrome-extension://") ||
      activeTab.url.startsWith("edge://")
    ) {
      setErrorState("Browser internal pages cannot be scanned.");
      return;
    }

    await injectContentScript(activeTab.id);

    const response = await detectLoginFields(activeTab.id);

    if (!response?.ok) {
      throw new Error(response?.message || "Detection failed.");
    }

    renderDetectionResult(response.result);
  } catch (error) {
    console.error("SecureVault scan failed:", error);

    setErrorState(
      error instanceof Error
        ? error.message
        : "Unable to scan this page. Try refreshing the page and scanning again."
    );
  }
}

scanButton.addEventListener("click", scanCurrentPage);

document.addEventListener("DOMContentLoaded", scanCurrentPage);