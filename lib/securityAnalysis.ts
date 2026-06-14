import type { VaultPlaintextItem } from "@/lib/crypto";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";

export type VaultSecurityInputItem = VaultPlaintextItem & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type SecurityRiskSeverity = "critical" | "high" | "medium" | "low";

export type SecurityRiskType =
  | "weak_password"
  | "reused_password"
  | "old_password"
  | "missing_category";

export type SecurityRisk = {
  id: string;
  itemId: string;
  title: string;
  username: string;
  type: SecurityRiskType;
  severity: SecurityRiskSeverity;
  message: string;
  recommendation: string;
  relatedItemTitles?: string[];
  updatedAt: string;
};

export type SecurityScoreLabel =
  | "No Data"
  | "Strong"
  | "Good"
  | "Needs Attention"
  | "High Risk";

export type VaultSecurityReport = {
  totalItems: number;
  securityScore: number;
  scoreLabel: SecurityScoreLabel;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  weakPasswordCount: number;
  reusedPasswordCount: number;
  oldPasswordCount: number;
  missingCategoryCount: number;
  strongPasswordCount: number;
  risks: SecurityRisk[];
  topPriorityRisks: SecurityRisk[];
};

const OLD_PASSWORD_DAYS = 180;

const severityWeight: Record<SecurityRiskSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 8,
  low: 3,
};

const severityRank: Record<SecurityRiskSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function normalizePassword(password: string) {
  return password.trim();
}

function getDaysSince(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const differenceMs = Date.now() - date.getTime();

  return Math.max(0, Math.floor(differenceMs / (1000 * 60 * 60 * 24)));
}

function getScoreLabel(totalItems: number, score: number): SecurityScoreLabel {
  if (totalItems === 0) {
    return "No Data";
  }

  if (score >= 90) {
    return "Strong";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs Attention";
  }

  return "High Risk";
}

function buildRiskId(itemId: string, type: SecurityRiskType) {
  return `${type}_${itemId}`;
}

export function analyzeVaultSecurity(
  items: VaultSecurityInputItem[]
): VaultSecurityReport {
  const risks: SecurityRisk[] = [];
  const passwordGroups = new Map<string, VaultSecurityInputItem[]>();

  let weakPasswordCount = 0;
  let oldPasswordCount = 0;
  let missingCategoryCount = 0;
  let strongPasswordCount = 0;

  for (const item of items) {
    const password = normalizePassword(item.password);

    if (password) {
      const currentGroup = passwordGroups.get(password) ?? [];
      currentGroup.push(item);
      passwordGroups.set(password, currentGroup);
    }

    const strength = evaluatePasswordStrength(item.password);

    if (strength.score >= 4) {
      strongPasswordCount++;
    }

    if (strength.score <= 2) {
      weakPasswordCount++;

      const isVeryWeak = strength.score <= 1;

      risks.push({
        id: buildRiskId(item.id, "weak_password"),
        itemId: item.id,
        title: item.title,
        username: item.username,
        type: "weak_password",
        severity: isVeryWeak ? "high" : "medium",
        message: `${item.title} uses a ${strength.label.toLowerCase()} password.`,
        recommendation:
          "Generate a stronger unique password and update this account.",
        updatedAt: item.updatedAt,
      });
    }

    const daysSinceUpdate = getDaysSince(item.updatedAt);

    if (daysSinceUpdate >= OLD_PASSWORD_DAYS) {
      oldPasswordCount++;

      risks.push({
        id: buildRiskId(item.id, "old_password"),
        itemId: item.id,
        title: item.title,
        username: item.username,
        type: "old_password",
        severity: "low",
        message: `${item.title} has not been updated for ${daysSinceUpdate} days.`,
        recommendation:
          "Review this account and consider rotating the password if it is important.",
        updatedAt: item.updatedAt,
      });
    }

    if (!item.category?.trim()) {
      missingCategoryCount++;

      risks.push({
        id: buildRiskId(item.id, "missing_category"),
        itemId: item.id,
        title: item.title,
        username: item.username,
        type: "missing_category",
        severity: "low",
        message: `${item.title} has no category assigned.`,
        recommendation:
          "Add a category such as Email, Banking, Social, Work, or Shopping to organize the vault.",
        updatedAt: item.updatedAt,
      });
    }
  }

  let reusedPasswordCount = 0;

  for (const group of passwordGroups.values()) {
    if (group.length <= 1) {
      continue;
    }

    reusedPasswordCount += group.length;

    const relatedItemTitles = group.map((item) => item.title);

    for (const item of group) {
      risks.push({
        id: buildRiskId(item.id, "reused_password"),
        itemId: item.id,
        title: item.title,
        username: item.username,
        type: "reused_password",
        severity: "critical",
        message: `${item.title} uses a password that is reused across ${group.length} vault items.`,
        recommendation:
          "Change this account to a unique password. Reused passwords can compromise multiple accounts after one leak.",
        relatedItemTitles: relatedItemTitles.filter(
          (title) => title !== item.title
        ),
        updatedAt: item.updatedAt,
      });
    }
  }

  const sortedRisks = risks.sort((firstRisk, secondRisk) => {
    const severityDifference =
      severityRank[firstRisk.severity] - severityRank[secondRisk.severity];

    if (severityDifference !== 0) {
      return severityDifference;
    }

    return (
      new Date(secondRisk.updatedAt).getTime() -
      new Date(firstRisk.updatedAt).getTime()
    );
  });

  const penalty = sortedRisks.reduce((totalPenalty, risk) => {
    return totalPenalty + severityWeight[risk.severity];
  }, 0);

  const securityScore = items.length === 0 ? 0 : Math.max(0, 100 - penalty);

  return {
    totalItems: items.length,
    securityScore,
    scoreLabel: getScoreLabel(items.length, securityScore),
    criticalCount: sortedRisks.filter((risk) => risk.severity === "critical")
      .length,
    highCount: sortedRisks.filter((risk) => risk.severity === "high").length,
    mediumCount: sortedRisks.filter((risk) => risk.severity === "medium")
      .length,
    lowCount: sortedRisks.filter((risk) => risk.severity === "low").length,
    weakPasswordCount,
    reusedPasswordCount,
    oldPasswordCount,
    missingCategoryCount,
    strongPasswordCount,
    risks: sortedRisks,
    topPriorityRisks: sortedRisks.slice(0, 5),
  };
}