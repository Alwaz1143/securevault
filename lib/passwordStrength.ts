export type PasswordStrengthLabel = "Weak" | "Medium" | "Strong" | "Very Strong";

export type PasswordStrengthResult = {
  score: number;
  label: PasswordStrengthLabel;
  percentage: number;
  feedback: string[];
};

const COMMON_PATTERNS = [
  "password",
  "qwerty",
  "admin",
  "welcome",
  "letmein",
  "iloveyou",
  "123456",
  "000000",
];

function hasRepeatedCharacters(password: string) {
  return /(.)\1{2,}/.test(password);
}

function hasSequentialPattern(password: string) {
  const lower = password.toLowerCase();

  const sequences = [
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "qwertyuiop",
    "asdfghjkl",
    "zxcvbnm",
  ];

  return sequences.some((sequence) => {
    for (let i = 0; i <= sequence.length - 4; i++) {
      const part = sequence.slice(i, i + 4);

      if (lower.includes(part)) {
        return true;
      }
    }

    return false;
  });
}

export function evaluatePasswordStrength(
  password: string
): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: "Weak",
      percentage: 0,
      feedback: ["Enter a password to check its strength."],
    };
  }

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Use at least 8 characters.");
  }

  if (password.length >= 12) {
    score += 1;
  } else {
    feedback.push("12+ characters is better.");
  }

  if (password.length >= 16) {
    score += 1;
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const varietyCount = [
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSymbol,
  ].filter(Boolean).length;

  if (varietyCount >= 3) {
    score += 1;
  } else {
    feedback.push("Use a mix of uppercase, lowercase, numbers, and symbols.");
  }

  if (varietyCount === 4) {
    score += 1;
  }

  const lowerPassword = password.toLowerCase();

  if (COMMON_PATTERNS.some((pattern) => lowerPassword.includes(pattern))) {
    score -= 2;
    feedback.push("Avoid common words or leaked-style patterns.");
  }

  if (hasRepeatedCharacters(password)) {
    score -= 1;
    feedback.push("Avoid repeated characters like aaa or 111.");
  }

  if (hasSequentialPattern(password)) {
    score -= 1;
    feedback.push("Avoid keyboard or number sequences like qwerty or 1234.");
  }

  score = Math.max(0, Math.min(score, 5));

  let label: PasswordStrengthLabel = "Weak";

  if (score >= 5) {
    label = "Very Strong";
  } else if (score >= 4) {
    label = "Strong";
  } else if (score >= 2) {
    label = "Medium";
  }

  if (feedback.length === 0) {
    feedback.push("Good password structure.");
  }

  return {
    score,
    label,
    percentage: (score / 5) * 100,
    feedback,
  };
}