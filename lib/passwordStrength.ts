export type StrengthLevel = "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";

export interface PasswordStrengthResult {
  score: number; // 0–100
  level: StrengthLevel;
  suggestions: string[];
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 20;
  else suggestions.push("Use at least 8 characters.");

  if (password.length >= 16) score += 10;

  if (/[A-Z]/.test(password)) score += 20;
  else suggestions.push("Add uppercase letters.");

  if (/[a-z]/.test(password)) score += 10;
  else suggestions.push("Add lowercase letters.");

  if (/[0-9]/.test(password)) score += 20;
  else suggestions.push("Add numbers.");

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else suggestions.push("Add special characters.");

  const level: StrengthLevel =
    score >= 90 ? "Very Strong" :
    score >= 70 ? "Strong" :
    score >= 50 ? "Fair" :
    score >= 30 ? "Weak" :
    "Very Weak";

  return { score, level, suggestions };
}
