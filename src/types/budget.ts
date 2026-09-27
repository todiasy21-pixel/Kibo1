export type MemberRole = 'parent' | 'child' | 'teen' | 'other';

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  monthlyIncome: number; // e.g. net monthly salary or allowance
  color: string; // hex or tailwind identifier
  avatarInitial: string;
  isContributor: boolean; // participates in shared household expenses
  personalAllowance?: number; // pocket money for kids/teens
  notes?: string;
}

export type TransactionType = 'income' | 'expense' | 'saving';
export type ExpenseNature = 'fixed' | 'variable' | 'punctual';
export type PaymentMethod = 'Prélèvement' | 'Carte bancaire' | 'Virement' | 'Espèces' | 'Chèque';
export type TransactionStatus = 'cleared' | 'pending';

export interface Transaction {
  id: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  type: TransactionType;
  nature: ExpenseNature;
  category: string;
  subCategory?: string;
  description: string;
  amount: number;
  memberId: string; // member id or 'family' for household
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  isRecurring: boolean;
  notes?: string;
}

export interface CategoryBudget {
  category: string;
  nature: ExpenseNature | 'income' | 'saving';
  allocated: number; // monthly planned amount
  iconName: string;
  color: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number;
  targetDate?: string;
  category: string;
  color: string;
  notes?: string;
}

export interface FamilyConfig {
  familyName: string;
  currency: string;
  currencySymbol: string;
  members: FamilyMember[];
  categoryBudgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  splitMethod: 'prorata' | 'equal' | 'custom';
  customSplitPercentages?: Record<string, number>;
}

export interface MonthlySummary {
  month: string;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalPunctualExpenses: number;
  totalExpenses: number;
  totalSavings: number;
  resteAVivre: number; // Income - Fixed
  resteAVivreJournalierParPersonne: number;
  soldeNet: number; // Income - Expenses - Savings
  tauxChargesFixes: number; // (Fixed / Income) * 100
  tauxEpargne: number; // (Savings / Income) * 100
}
