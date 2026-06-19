(() => {
  if (window.__secureVaultAutofillLoaded) {
    return;
  }

  window.__secureVaultAutofillLoaded = true;

  function isVisibleElement(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function getInputType(input) {
    return (input.getAttribute("type") || "text").toLowerCase();
  }

  function getInputLabel(input) {
    const labels = [];

    if (input.id) {
      const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);

      if (label?.textContent?.trim()) {
        labels.push(label.textContent.trim());
      }
    }

    const parentLabel = input.closest("label");

    if (parentLabel?.textContent?.trim()) {
      labels.push(parentLabel.textContent.trim());
    }

    const ariaLabel = input.getAttribute("aria-label");

    if (ariaLabel) {
      labels.push(ariaLabel);
    }

    const placeholder = input.getAttribute("placeholder");

    if (placeholder) {
      labels.push(placeholder);
    }

    const name = input.getAttribute("name");

    if (name) {
      labels.push(name);
    }

    const id = input.getAttribute("id");

    if (id) {
      labels.push(id);
    }

    const autocomplete = input.getAttribute("autocomplete");

    if (autocomplete) {
      labels.push(autocomplete);
    }

    return labels.join(" ").toLowerCase();
  }

  function isUsernameCandidate(input) {
    const type = getInputType(input);

    if (!["text", "email", "tel", "search", "url", ""].includes(type)) {
      return false;
    }

    const label = getInputLabel(input);

    const usernameKeywords = [
      "email",
      "user",
      "username",
      "login",
      "phone",
      "mobile",
      "identifier",
      "account"
    ];

    return usernameKeywords.some((keyword) => label.includes(keyword));
  }

  function getSafeInputSummary(input) {
    return {
      type: getInputType(input),
      name: input.getAttribute("name") || "",
      id: input.getAttribute("id") || "",
      placeholder: input.getAttribute("placeholder") || "",
      autocomplete: input.getAttribute("autocomplete") || "",
      visible: isVisibleElement(input)
    };
  }

  function detectLoginFields() {
    const allInputs = Array.from(document.querySelectorAll("input"));
    const visibleInputs = allInputs.filter(isVisibleElement);

    const passwordFields = visibleInputs.filter(
      (input) => getInputType(input) === "password"
    );

    const usernameCandidates = visibleInputs.filter(isUsernameCandidate);

    const forms = Array.from(document.querySelectorAll("form")).map((form) => {
      const formInputs = Array.from(form.querySelectorAll("input"));
      const visibleFormInputs = formInputs.filter(isVisibleElement);

      return {
        action: form.getAttribute("action") || "",
        method: form.getAttribute("method") || "get",
        inputCount: formInputs.length,
        visibleInputCount: visibleFormInputs.length,
        passwordFieldCount: visibleFormInputs.filter(
          (input) => getInputType(input) === "password"
        ).length
      };
    });

    const hasLoginForm = passwordFields.length > 0;

    return {
      pageTitle: document.title,
      pageUrl: window.location.href,
      hostname: window.location.hostname,
      hasLoginForm,
      totalInputCount: allInputs.length,
      visibleInputCount: visibleInputs.length,
      usernameCandidateCount: usernameCandidates.length,
      passwordFieldCount: passwordFields.length,
      formCount: forms.length,
      usernameCandidates: usernameCandidates.map(getSafeInputSummary),
      passwordFields: passwordFields.map(getSafeInputSummary),
      forms
    };
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "SECUREVAULT_DETECT_LOGIN_FIELDS") {
      return false;
    }

    try {
      const result = detectLoginFields();

      sendResponse({
        ok: true,
        result
      });
    } catch (error) {
      sendResponse({
        ok: false,
        message: error instanceof Error ? error.message : "Detection failed."
      });
    }

    return true;
  });
})();