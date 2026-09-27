/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnalyticsView } from './components/AnalyticsView';
import { DashboardView } from './components/DashboardView';
import { EnvelopesView } from './components/EnvelopesView';
import { ExportModal } from './components/ExportModal';
import { FamilyMembersView } from './components/FamilyMembersView';
import { Header } from './components/Header';
import { SavingsGoalsView } from './components/SavingsGoalsView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import {
  CategoryBudget,
  ExpenseNature,
  FamilyConfig,
  FamilyMember,
  SavingsGoal,
  Transaction,
} from './types/budget';
import { calculateMonthlySummary } from './utils/calculations';
import { formatCurrency, formatMonthYear, getCurrentMonthStr } from './utils/formatters';
import {
  duplicateRecurringToMonth,
  loadFamilyConfig,
  loadTransactions,
  resetAllData,
  saveFamilyConfig,
  saveTransactions,
} from './utils/storage';

export default function App() {
  const [familyConfig, setFamilyConfig] = useState<FamilyConfig>(() => loadFamilyConfig());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    // Check if there is data in 2026-09 or use current month
    const defaultM = getCurrentMonthStr();
    return defaultM.startsWith('2026') ? defaultM : '2026-09';
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'transactions' | 'envelopes' | 'family' | 'savings' | 'analytics'
  >('dashboard');

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    saveFamilyConfig(familyConfig);
  }, [familyConfig]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // Toast feedback helper
  const showToast = (message: string) => {
    setFeedbackToast(message);
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3500);
  };

  // Month navigation
  const handleChangeMonth = (delta: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    setCurrentMonth(`${newYear}-${newMonth}`);
  };

  const handleSetCurrentMonth = () => {
    setCurrentMonth(getCurrentMonthStr());
  };

  // Calculate summary for current month
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(currentMonth, transactions, familyConfig);
  }, [currentMonth, transactions, familyConfig]);

  // Transaction CRUD handlers
  const handleSaveTransaction = (savedTx: Transaction) => {
    setTransactions((prev) => {
      const index = prev.findIndex((t) => t.id === savedTx.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = savedTx;
        return copy;
      }
      return [savedTx, ...prev];
    });
    showToast(`Opération « ${savedTx.description} » enregistrée`);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (confirm(`Confirmez-vous la suppression de l'opération « ${tx?.description || ''} » ?`)) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('Opération supprimée');
    }
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: `${tx.description} (Copie)`,
      status: 'pending',
    };
    setTransactions((prev) => [duplicated, ...prev]);
    showToast(`Opération dupliquée : ${duplicated.description}`);
  };

  const handleToggleStatus = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'cleared' ? 'pending' : 'cleared';
          return { ...t, status: nextStatus };
        }
        return t;
      }),
    );
  };

  // Duplicate recurring charges to this month
  const handleDuplicateRecurring = () => {
    // Find previous month
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const { newTransactions, addedCount } = duplicateRecurringToMonth(
      transactions,
      prevMonthStr,
      currentMonth,
    );

    if (addedCount > 0) {
      setTransactions(newTransactions);
      showToast(`${addedCount} charge(s) récurrente(s) importée(s) depuis ${formatMonthYear(prevMonthStr)}`);
    } else {
      showToast(`Toutes les charges récurrentes sont déjà présentes pour ${formatMonthYear(currentMonth)}`);
    }
  };

  // Family Name
  const handleUpdateFamilyName = (newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setFamilyConfig((prev) => ({
      ...prev,
      familyName: clean,
    }));
    showToast(`Nom du foyer mis à jour : « ${clean} »`);
  };

  // Category Budgets & Renaming
  const handleUpdateCategoryBudget = (categoryName: string, newAllocated: number) => {
    setFamilyConfig((prev) => ({
      ...prev,
      categoryBudgets: prev.categoryBudgets.map((c) =>
        c.category === categoryName ? { ...c, allocated: newAllocated } : c,
      ),
    }));
    showToast(`Plafond pour « ${categoryName} » mis à jour : ${formatCurrency(newAllocated, familyConfig.currencySymbol || 'Ar')}`);
  };

  const handleRenameCategory = (
    oldCategoryName: string,
    newCategoryName: string,
    newAllocated?: number,
    newNature?: ExpenseNature | 'income' | 'saving',
  ) => {
    const cleanNewName = newCategoryName.trim();
    if (!cleanNewName) return;

    // 1. Update Category Budgets
    setFamilyConfig((prev) => ({
      ...prev,
      categoryBudgets: prev.categoryBudgets.map((c) => {
        if (c.category === oldCategoryName) {
          return {
            ...c,
            category: cleanNewName,
            allocated: newAllocated !== undefined ? newAllocated : c.allocated,
            nature: (newNature || c.nature) as any,
          };
        }
        return c;
      }),
    }));

    // 2. If name changed, synchronize existing transactions
    if (oldCategoryName !== cleanNewName) {
      let count = 0;
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.category === oldCategoryName) {
            count++;
            return { ...t, category: cleanNewName };
          }
          return t;
        }),
      );
      showToast(
        count > 0
          ? `Charge « ${oldCategoryName} » renommée en « ${cleanNewName} » (${count} opération(s) synchronisée(s))`
          : `Charge « ${oldCategoryName} » renommée en « ${cleanNewName} »`,
      );
    } else if (newAllocated !== undefined) {
      showToast(`Plafond pour « ${cleanNewName} » mis à jour : ${formatCurrency(newAllocated, familyConfig.currencySymbol || 'Ar')}`);
    }
  };

  const handleDeleteCategory = (categoryName: string) => {
    setFamilyConfig((prev) => ({
      ...prev,
      categoryBudgets: prev.categoryBudgets.filter((c) => c.category !== categoryName),
    }));
    showToast(`Charge « ${categoryName} » supprimée`);
  };

  const handleAddCategoryBudget = (newBudget: CategoryBudget) => {
    setFamilyConfig((prev) => ({
      ...prev,
      categoryBudgets: [...prev.categoryBudgets, newBudget],
    }));
    showToast(`Charge « ${newBudget.category} » ajoutée`);
  };

  // Family Members
  const handleAddMember = (member: FamilyMember) => {
    setFamilyConfig((prev) => ({
      ...prev,
      members: [...prev.members, member],
    }));
    showToast(`Membre « ${member.name} » ajouté au foyer`);
  };

  const handleEditMember = (updated: FamilyMember) => {
    setFamilyConfig((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === updated.id ? updated : m)),
    }));
  };

  const handleDeleteMember = (id: string) => {
    const member = familyConfig.members.find((m) => m.id === id);
    if (confirm(`Supprimer « ${member?.name || ''} » du foyer ?`)) {
      setFamilyConfig((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
      }));
      showToast('Membre retiré du foyer');
    }
  };

  // Savings Goals
  const handleUpdateGoals = (updatedGoals: SavingsGoal[]) => {
    setFamilyConfig((prev) => ({
      ...prev,
      savingsGoals: updatedGoals,
    }));
  };

  // Import & Reset Data
  const handleImportData = (config: FamilyConfig, importedTransactions: Transaction[]) => {
    setFamilyConfig(config);
    setTransactions(importedTransactions);
    showToast('Données importées avec succès');
  };

  const handleResetData = () => {
    const { config, transactions: defaultTx } = resetAllData();
    setFamilyConfig(config);
    setTransactions(defaultTx);
    showToast('Données réinitialisées avec succès');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentMonth={currentMonth}
        onChangeMonth={handleChangeMonth}
        onSetCurrentMonth={handleSetCurrentMonth}
        onOpenNewTxModal={() => {
          setEditingTransaction(null);
          setIsTxModalOpen(true);
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        familyConfig={familyConfig}
        onUpdateFamilyName={handleUpdateFamilyName}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Printable Header Summary for Browser Print mode */}
        <div className="hidden print-only mb-6 pb-4 border-b border-black">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">NidBudget - Synthèse Mensuelle</h1>
              <p className="text-sm">{familyConfig.familyName} · {formatMonthYear(currentMonth)}</p>
            </div>
            <div className="text-right text-xs">
              <div>Édité le {new Date().toLocaleDateString('fr-FR')}</div>
              <div>Reste à vivre : {formatCurrency(monthlySummary.resteAVivre, familyConfig.currencySymbol || 'Ar')}</div>
            </div>
          </div>
        </div>

        {/* View Switcher */}
        {activeTab === 'dashboard' && (
          <DashboardView
            currentMonth={currentMonth}
            summary={monthlySummary}
            familyConfig={familyConfig}
            transactions={transactions}
            onOpenNewTxModal={() => {
              setEditingTransaction(null);
              setIsTxModalOpen(true);
            }}
            onNavigateTab={setActiveTab}
            onToggleStatus={handleToggleStatus}
            onDuplicateRecurring={handleDuplicateRecurring}
            onUpdateFamilyName={handleUpdateFamilyName}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            currentMonth={currentMonth}
            transactions={transactions}
            familyConfig={familyConfig}
            onOpenNewTxModal={() => {
              setEditingTransaction(null);
              setIsTxModalOpen(true);
            }}
            onEditTx={(tx) => {
              setEditingTransaction(tx);
              setIsTxModalOpen(true);
            }}
            onDeleteTx={handleDeleteTransaction}
            onDuplicateTx={handleDuplicateTransaction}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {activeTab === 'envelopes' && (
          <EnvelopesView
            currentMonth={currentMonth}
            transactions={transactions}
            familyConfig={familyConfig}
            onUpdateCategoryBudget={handleUpdateCategoryBudget}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddCategoryBudget={handleAddCategoryBudget}
          />
        )}

        {activeTab === 'family' && (
          <FamilyMembersView
            familyConfig={familyConfig}
            transactions={transactions}
            currentMonth={currentMonth}
            onUpdateFamilyConfig={setFamilyConfig}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onUpdateFamilyName={handleUpdateFamilyName}
          />
        )}

        {activeTab === 'savings' && (
          <SavingsGoalsView
            familyConfig={familyConfig}
            currentMonth={currentMonth}
            onUpdateGoals={handleUpdateGoals}
            onAddTransaction={handleSaveTransaction}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            currentMonth={currentMonth}
            summary={monthlySummary}
            familyConfig={familyConfig}
            transactions={transactions}
          />
        )}

      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        currentMonth={currentMonth}
        familyConfig={familyConfig}
        editingTransaction={editingTransaction}
      />

      {/* Export / Data Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentMonth={currentMonth}
        familyConfig={familyConfig}
        transactions={transactions}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 no-print">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NidBudget · Gestion de budget familial mensuel</span>
          <span className="text-2xs text-slate-400">
            Données privées sauvegardées sur votre navigateur
          </span>
        </div>
      </footer>

    </div>
  );
}
