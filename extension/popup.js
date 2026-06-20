const currentUrlElement = document.getElementById("currentUrl");
const loginStatusElement = document.getElementById("loginStatus");
const summaryTextElement = document.getElementById("summaryText");
const usernameCountElement = document.getElementById("usernameCount");
const passwordCountElement = document.getElementById("passwordCount");
const detailsBoxElement = document.getElementById("detailsBox");
const statusDotElement = document.getElementById("statusDot");
const scanButton = document.getElementById("scanButton");
const fillSection = document.getElementById("fillSection");
const fillButton = document.getElementById("fillButton");
const fillStatus = document.getElementById("fillStatus");

// Hardcoded test credentials for Phase 2 autofill prototype
const TEST_CREDENTIALS = {
  username: "test@securevault.dev",
  password: "TestPass@Phase2!"
};

function setStatusDot(status) {
  statusDotElement.className = "status-dot";

  if (status) {
    statusDotElement.classList.add(status);
  }
}

function showFillSection() {
  fillSection.hidden = false;
  fillStatus.textContent = "";
  fillStatus.className = "fill-status";
}

function hideFillSection() {
  fillSection.hidden = true;
  fillStatus.textContent = "";
  fillStatus.className = "fill-status";
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
  hideFillSection();
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
    showFillSection();
  } else if (result.visibleInputCount > 0) {
    setStatusDot("warning");
    loginStatusElement.textContent = "Inputs found, but no password field";
    summaryTextElement.textContent =
      "SecureVault found input fields, but no visible password field. This may be a multi-step login page.";
    hideFillSection();
  } else {
    setStatusDot("warning");
    loginStatusElement.textContent = "No login form detected";
    summaryTextElement.textContent =
      "SecureVault did not find visible login fields on this page.";
    hideFillSection();
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

async function fillTestCredentials() {
  fillButton.disabled = true;
  fillStatus.className = "fill-status";
  fillStatus.textContent = "Filling...";

  try {
    const activeTab = await getActiveTab();

    if (!activeTab?.id) {
      throw new Error("No active tab found.");
    }

    await injectContentScript(activeTab.id);

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: "SECUREVAULT_FILL_CREDENTIALS",
      payload: TEST_CREDENTIALS
    });

    if (!response?.ok) {
      throw new Error(response?.message || "Fill failed.");
    }

    const { filledUsername, filledPassword } = response.result;
    const parts = [];

    if (filledUsername) parts.push("username");
    if (filledPassword) parts.push("password");

    if (parts.length === 0) {
      fillStatus.className = "fill-status error";
      fillStatus.textContent = "No fields were filled. Fields may not be recognised.";
    } else {
      fillStatus.className = "fill-status success";
      fillStatus.textContent = `✓ Filled: ${parts.join(" + ")}`;
    }
  } catch (error) {
    fillStatus.className = "fill-status error";
    fillStatus.textContent =
      error instanceof Error ? error.message : "Fill failed.";
  } finally {
    fillButton.disabled = false;
  }
}

fillButton.addEventListener("click", fillTestCredentials);
scanButton.addEventListener("click", scanCurrentPage);

document.addEventListener("DOMContentLoaded", scanCurrentPage);