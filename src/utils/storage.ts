import { DEFAULT_FAMILY_CONFIG, INITIAL_TRANSACTIONS } from '../data/defaultData';
import { FamilyConfig, Transaction } from '../types/budget';

const STORAGE_KEYS = {
  CONFIG: 'nidbudget_family_config_v1',
  TRANSACTIONS: 'nidbudget_transactions_v1',
  ACTIVE_MONTH: 'nidbudget_active_month_v1',
};

export function loadFamilyConfig(): FamilyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_FAMILY_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed.members || !Array.isArray(parsed.members)) {
      return DEFAULT_FAMILY_CONFIG;
    }
    // Migrate to Ariary if previously in EUR
    if (parsed.currencySymbol !== 'Ar') {
      parsed.currencySymbol = 'Ar';
      parsed.currency = 'MGA';
      // If income values are in small euro scale (< 10000), update to default Ariary figures
      if (parsed.members[0] && parsed.members[0].monthlyIncome < 50000) {
        return {
          ...DEFAULT_FAMILY_CONFIG,
          familyName: parsed.familyName || DEFAULT_FAMILY_CONFIG.familyName,
        };
      }
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load family config, using default', e);
    return DEFAULT_FAMILY_CONFIG;
  }
}

export function saveFamilyConfig(config: FamilyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save family config', e);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return INITIAL_TRANSACTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_TRANSACTIONS;
    // Migrate old low euro transactions to Ariary
    if (parsed.length > 0 && parsed[0].amount < 50000) {
      return INITIAL_TRANSACTIONS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load transactions, using default', e);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions', e);
  }
}

export function resetAllData(): { config: FamilyConfig; transactions: Transaction[] } {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MONTH);
  } catch {
    // ignore
  }
  return {
    config: DEFAULT_FAMILY_CONFIG,
    transactions: INITIAL_TRANSACTIONS,
  };
}

export function exportToCSV(transactions: Transaction[], familyConfig: FamilyConfig, filterMonth?: string): void {
  const dataToExport = filterMonth
    ? transactions.filter((t) => t.month === filterMonth)
    : transactions;

  const memberMap = new Map<string, string>();
  familyConfig.members.forEach((m) => memberMap.set(m.id, m.name));
  memberMap.set('family', 'Foyer commun');

  const headers = [
    'ID',
    'Date',
    'Mois',
    'Description',
    'Type',
    'Nature',
    'Catégorie',
    `Montant (${familyConfig.currencySymbol || 'Ar'})`,
    'Membre assigné',
    'Mode de paiement',
    'Statut',
    'Récurrent',
    'Notes',
  ];

  const typeLabels: Record<string, string> = {
    income: 'Revenu',
    expense: 'Dépense',
    saving: 'Épargne',
  };

  const natureLabels: Record<string, string> = {
    fixed: 'Charge Fixe',
    variable: 'Dépense Courante',
    punctual: 'Ponctuel / Imprévu',
  };

  const statusLabels: Record<string, string> = {
    cleared: 'Débité / Encaissé',
    pending: 'En attente / Prévu',
  };

  const rows = dataToExport.map((t) => [
    t.id,
    t.date,
    t.month,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    typeLabels[t.type] || t.type,
    natureLabels[t.nature] || t.nature,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2).replace('.', ','),
    `"${(memberMap.get(t.memberId) || t.memberId).replace(/"/g, '""')}"`,
    t.paymentMethod || '',
    statusLabels[t.status] || t.status,
    t.isRecurring ? 'Oui' : 'Non',
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Excel
    [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Budget_Familial_${filterMonth || 'Complet'}_${new Date().toISOString().slice(0, 10)}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportBackupJSON(config: FamilyConfig, transactions: Transaction[]): void {
  const payload = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    config,
    transactions,
  };
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `NidBudget_Sauvegarde_Familiale_${new Date().toISOString().slice(0, 10)}.json`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function duplicateRecurringToMonth(
  transactions: Transaction[],
  sourceMonth: string,
  targetMonth: string,
): { newTransactions: Transaction[]; addedCount: number } {
  const sourceRecurring = transactions.filter(
    (t) => t.month === sourceMonth && t.isRecurring,
  );

  // Check which are already in targetMonth by matching description & category
  const existingInTarget = transactions.filter((t) => t.month === targetMonth);
  const toAdd: Transaction[] = [];

  const [tYear, tMonth] = targetMonth.split('-');

  for (const src of sourceRecurring) {
    const alreadyExists = existingInTarget.some(
      (e) => e.description === src.description && e.category === src.category,
    );
    if (!alreadyExists) {
      // adapt date day
      const srcDay = src.date.split('-')[2] || '05';
      const targetDate = `${tYear}-${tMonth}-${srcDay.padStart(2, '0')}`;

      toAdd.push({
        ...src,
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        month: targetMonth,
        date: targetDate,
        status: 'pending', // new month recurring begins as pending/prévu
      });
    }
  }

  const updated = [...transactions, ...toAdd];
  return { newTransactions: updated, addedCount: toAdd.length };
}
