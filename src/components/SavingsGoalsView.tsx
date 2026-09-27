import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Minus,
  PiggyBank,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { FamilyConfig, SavingsGoal, Transaction } from '../types/budget';
import { formatCurrency, formatMonthYear } from '../utils/formatters';

interface SavingsGoalsViewProps {
  familyConfig: FamilyConfig;
  currentMonth: string;
  onUpdateGoals: (updatedGoals: SavingsGoal[]) => void;
  onAddTransaction: (tx: Transaction) => void;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  familyConfig,
  currentMonth,
  onUpdateGoals,
  onAddTransaction,
}) => {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Projet familial');
  const [notes, setNotes] = useState('');

  // Quick Deposit / Withdraw modal state
  const [activeGoalForAction, setActiveGoalForAction] = useState<{
    goal: SavingsGoal;
    action: 'deposit' | 'withdraw';
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');

  const totalSaved = familyConfig.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = familyConfig.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalMonthlyScheduled = familyConfig.savingsGoals.reduce((sum, g) => sum + g.monthlyTarget, 0);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      targetAmount: parseFloat(targetAmount.replace(',', '.')) || 1000,
      currentAmount: parseFloat(currentAmount.replace(',', '.')) || 0,
      monthlyTarget: parseFloat(monthlyTarget.replace(',', '.')) || 100,
      targetDate: targetDate || undefined,
      category: category.trim(),
      color: '#0F766E',
      notes: notes.trim() || undefined,
    };

    onUpdateGoals([...familyConfig.savingsGoals, newGoal]);
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setMonthlyTarget('');
    setTargetDate('');
    setNotes('');
    setIsAddingGoal(false);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Voulez-vous supprimer ce projet d’épargne ?')) {
      onUpdateGoals(familyConfig.savingsGoals.filter((g) => g.id !== id));
    }
  };

  const handleApplyAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForAction) return;

    const val = parseFloat(actionAmount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;

    const { goal, action } = activeGoalForAction;
    const newCurrent = action === 'deposit' ? goal.currentAmount + val : Math.max(0, goal.currentAmount - val);

    const updated = familyConfig.savingsGoals.map((g) =>
      g.id === goal.id ? { ...g, currentAmount: newCurrent } : g,
    );
    onUpdateGoals(updated);

    // Optionally record a transaction in current month
    if (action === 'deposit') {
      const today = new Date().toISOString().slice(0, 10);
      onAddTransaction({
        id: `tx-save-${Date.now()}`,
        month: currentMonth,
        date: today.startsWith(currentMonth) ? today : `${currentMonth}-01`,
        type: 'saving',
        nature: 'fixed',
        category: goal.title,
        description: `Versement vers : ${goal.title}`,
        amount: val,
        memberId: 'family',
        paymentMethod: 'Virement',
        status: 'cleared',
        isRecurring: false,
      });
    }

    setActiveGoalForAction(null);
    setActionAmount('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Épargne & Projets du Foyer
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tirelires, fonds de sécurité et projets familiaux à court et moyen terme
          </p>
        </div>

        <button
          onClick={() => setIsAddingGoal(!isAddingGoal)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau projet d'épargne
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Épargné à ce jour</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(totalSaved)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Sur {totalTarget > 0 ? formatCurrency(totalTarget) : '0 €'} d'objectifs cumulés
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Progression Globale</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-900">
              {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0} %
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {familyConfig.savingsGoals.length} projets actifs
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Effort d'Épargne Mensuel</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-900">
              {formatCurrency(totalMonthlyScheduled)} / mois
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Programmé vers les tirelires
            </div>
          </div>
        </div>

      </div>

      {/* Add New Goal Form */}
      {isAddingGoal && (
        <form
          onSubmit={handleCreateGoal}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Ajouter un nouveau projet d'épargne</h4>
            <button
              type="button"
              onClick={() => setIsAddingGoal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Titre du projet *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Vacances Corse, Apport Voiture..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Montant cible visé ({familyConfig.currencySymbol || 'Ar'}) *
              </label>
              <input
                type="text"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="ex: 2000000"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Déjà épargné ({familyConfig.currencySymbol || 'Ar'})
              </label>
              <input
                type="text"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="ex: 500000"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Versement mensuel prévu ({familyConfig.currencySymbol || 'Ar'})
              </label>
              <input
                type="text"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                placeholder="ex: 150000"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Date cible (facultatif)</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Notes / Compte support</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ex: Livret A, LEP, assurance-vie..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingGoal(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900"
            >
              Créer le projet
            </button>
          </div>
        </form>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {familyConfig.savingsGoals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
          const monthsLeft = goal.monthlyTarget > 0 ? Math.ceil(remaining / goal.monthlyTarget) : 0;

          return (
            <div
              key={goal.id}
              className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{goal.title}</h3>
                    {goal.notes && (
                      <p className="text-2xs text-slate-500 mt-0.5">{goal.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Amount and target */}
                <div className="mt-4 flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-xs text-slate-500 block">Montant actuel</span>
                    <span className="text-lg font-bold font-mono text-teal-900 tabular-nums">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Objectif</span>
                    <span className="text-sm font-semibold font-mono text-slate-700 tabular-nums">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct >= 100 ? 'bg-emerald-600' : 'bg-teal-700'
                      }`}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-2xs text-slate-500">
                    <span className="font-semibold text-slate-700">{pct} % atteint</span>
                    <span>
                      {remaining === 0
                        ? 'Objectif atteint !'
                        : `Reste ${formatCurrency(remaining)} (~${monthsLeft} mois à ${formatCurrency(goal.monthlyTarget)}/m)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Quick deposit / withdraw */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-2xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{formatCurrency(goal.monthlyTarget)} / mois</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveGoalForAction({ goal, action: 'withdraw' })}
                    className="px-2.5 py-1 text-2xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors flex items-center gap-1"
                    title="Retirer une somme de ce projet"
                  >
                    <Minus className="w-3 h-3" />
                    Retirer
                  </button>

                  <button
                    onClick={() => setActiveGoalForAction({ goal, action: 'deposit' })}
                    className="px-2.5 py-1 text-2xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                    title="Ajouter un versement"
                  >
                    <Plus className="w-3 h-3" />
                    Verser
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Deposit / Withdraw Action Modal */}
      {activeGoalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900">
                {activeGoalForAction.action === 'deposit'
                  ? `Verser sur : ${activeGoalForAction.goal.title}`
                  : `Retirer de : ${activeGoalForAction.goal.title}`}
              </h4>
              <button
                onClick={() => setActiveGoalForAction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyAction} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Montant ({familyConfig.currencySymbol || 'Ar'})
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="ex: 100000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm"
                />
              </div>

              {activeGoalForAction.action === 'deposit' && (
                <p className="text-2xs text-slate-500">
                  Ce versement sera également enregistré dans le journal des opérations de {formatMonthYear(currentMonth)}.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveGoalForAction(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900"
                >
                  Confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
