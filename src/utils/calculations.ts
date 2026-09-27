import {
  CategoryBudget,
  FamilyConfig,
  FamilyMember,
  MonthlySummary,
  Transaction,
} from '../types/budget';
import { getDaysInMonth } from './formatters';

export function calculateMonthlySummary(
  month: string,
  transactions: Transaction[],
  familyConfig: FamilyConfig,
): MonthlySummary {
  const monthTx = transactions.filter((tx) => tx.month === month);

  let totalIncome = 0;
  let totalFixedExpenses = 0;
  let totalVariableExpenses = 0;
  let totalPunctualExpenses = 0;
  let totalSavings = 0;

  for (const tx of monthTx) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      if (tx.nature === 'fixed') {
        totalFixedExpenses += tx.amount;
      } else if (tx.nature === 'variable') {
        totalVariableExpenses += tx.amount;
      } else if (tx.nature === 'punctual') {
        totalPunctualExpenses += tx.amount;
      }
    } else if (tx.type === 'saving') {
      totalSavings += tx.amount;
    }
  }

  const totalExpenses = totalFixedExpenses + totalVariableExpenses + totalPunctualExpenses;
  const resteAVivre = totalIncome - totalFixedExpenses;
  const soldeNet = totalIncome - totalExpenses - totalSavings;

  const daysInMonth = getDaysInMonth(month) || 30;
  const memberCount = Math.max(1, familyConfig.members.length);
  // Reste à vivre journalier par personne (ce qu'il reste pour nourrir, habiller et faire vivre chaque personne par jour après les charges fixes)
  const resteAVivreJournalierParPersonne = Math.max(
    0,
    resteAVivre / (daysInMonth * memberCount),
  );

  const tauxChargesFixes = totalIncome > 0 ? (totalFixedExpenses / totalIncome) * 100 : 0;
  const tauxEpargne = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return {
    month,
    totalIncome,
    totalFixedExpenses,
    totalVariableExpenses,
    totalPunctualExpenses,
    totalExpenses,
    totalSavings,
    resteAVivre,
    resteAVivreJournalierParPersonne,
    soldeNet,
    tauxChargesFixes,
    tauxEpargne,
  };
}

export interface CategorySummaryItem {
  category: string;
  nature: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  iconName: string;
  color: string;
  status: 'nominal' | 'warning' | 'over'; // nominal < 80%, warning 80-100%, over > 100%
  transactionCount: number;
}

export function calculateCategoryBreakdown(
  month: string,
  transactions: Transaction[],
  categoryBudgets: CategoryBudget[],
): CategorySummaryItem[] {
  const monthTx = transactions.filter((tx) => tx.month === month && tx.type !== 'income');

  return categoryBudgets.map((cat) => {
    const matchedTx = monthTx.filter((tx) => tx.category === cat.category);
    const spent = matchedTx.reduce((acc, curr) => acc + curr.amount, 0);
    const allocated = cat.allocated;
    const remaining = allocated - spent;
    const percentageUsed = allocated > 0 ? (spent / allocated) * 100 : 0;

    let status: 'nominal' | 'warning' | 'over' = 'nominal';
    if (percentageUsed > 100) {
      status = 'over';
    } else if (percentageUsed >= 80) {
      status = 'warning';
    }

    return {
      category: cat.category,
      nature: cat.nature,
      allocated,
      spent,
      remaining,
      percentageUsed,
      iconName: cat.iconName,
      color: cat.color,
      status,
      transactionCount: matchedTx.length,
    };
  });
}

export interface FairSplitResult {
  totalSharedExpenses: number;
  contributors: {
    member: FamilyMember;
    income: number;
    prorataPercentage: number;
    equalPercentage: number;
    shouldPayProrata: number;
    shouldPayEqual: number;
    alreadyPaidShared: number;
    balanceProrata: number; // positive = to receive, negative = to pay
    balanceEqual: number;
  }[];
}

export function calculateFairSplit(
  familyConfig: FamilyConfig,
  transactions: Transaction[],
  month: string,
): FairSplitResult {
  const monthTx = transactions.filter((tx) => tx.month === month && tx.type === 'expense');
  
  // Shared expenses are marked as 'family' or expenses for general household
  const sharedExpenses = monthTx.filter((tx) => tx.memberId === 'family');
  const totalSharedExpenses = sharedExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const contributors = familyConfig.members.filter((m) => m.isContributor && m.role === 'parent');
  const totalContributorsIncome = contributors.reduce((acc, curr) => acc + (curr.monthlyIncome || 0), 0);
  const contributorCount = Math.max(1, contributors.length);

  const contributorResults = contributors.map((m) => {
    const income = m.monthlyIncome || 0;
    const prorataPercentage = totalContributorsIncome > 0 ? (income / totalContributorsIncome) * 100 : (100 / contributorCount);
    const equalPercentage = 100 / contributorCount;

    const shouldPayProrata = (totalSharedExpenses * prorataPercentage) / 100;
    const shouldPayEqual = totalSharedExpenses / contributorCount;

    // Direct personal expenses paid by this member for household
    const memberPaidDirectly = monthTx
      .filter((tx) => tx.memberId === m.id)
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      member: m,
      income,
      prorataPercentage,
      equalPercentage,
      shouldPayProrata,
      shouldPayEqual,
      alreadyPaidShared: memberPaidDirectly,
      balanceProrata: memberPaidDirectly - shouldPayProrata,
      balanceEqual: memberPaidDirectly - shouldPayEqual,
    };
  });

  return {
    totalSharedExpenses,
    contributors: contributorResults,
  };
}

export function getMonthListFromTransactions(transactions: Transaction[], currentMonth: string): string[] {
  const set = new Set<string>();
  set.add(currentMonth);
  for (const tx of transactions) {
    if (tx.month) set.add(tx.month);
  }
  // also add next month and previous 2 months
  const [currY, currM] = currentMonth.split('-').map(Number);
  const prevMonthDate = new Date(currY, currM - 2, 1);
  const nextMonthDate = new Date(currY, currM, 1);
  const prevStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  set.add(prevStr);
  set.add(nextStr);

  return Array.from(set).sort().reverse();
}
