import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit2,
  HeartHandshake,
  Layers,
  PiggyBank,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  CategoryBudget,
  FamilyConfig,
  FamilyMember,
  MonthlySummary,
  Transaction,
} from '../types/budget';
import { calculateCategoryBreakdown } from '../utils/calculations';
import {
  formatCurrency,
  formatDateShort,
  formatMonthYear,
  formatPercentage,
} from '../utils/formatters';

interface DashboardViewProps {
  currentMonth: string;
  summary: MonthlySummary;
  familyConfig: FamilyConfig;
  transactions: Transaction[];
  onOpenNewTxModal: () => void;
  onNavigateTab: (tab: 'dashboard' | 'transactions' | 'envelopes' | 'family' | 'savings' | 'analytics') => void;
  onToggleStatus: (txId: string) => void;
  onDuplicateRecurring: () => void;
  onUpdateFamilyName?: (newName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentMonth,
  summary,
  familyConfig,
  transactions,
  onOpenNewTxModal,
  onNavigateTab,
  onToggleStatus,
  onDuplicateRecurring,
  onUpdateFamilyName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(familyConfig.familyName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim() && onUpdateFamilyName) {
      onUpdateFamilyName(tempName.trim());
    }
    setIsEditingName(false);
  };
  const monthTx = transactions.filter((t) => t.month === currentMonth);
  const pendingTx = monthTx.filter((t) => t.status === 'pending');
  const recentTx = [...monthTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const categoryBreakdown = calculateCategoryBreakdown(
    currentMonth,
    transactions,
    familyConfig.categoryBudgets,
  );

  // Top 4 critical variable or fixed categories
  const topWatchedCategories = categoryBreakdown
    .filter((c) => c.nature === 'variable' || c.nature === 'fixed')
    .slice(0, 4);

  // Calculate Member map
  const memberMap = new Map<string, FamilyMember>();
  familyConfig.members.forEach((m) => memberMap.set(m.id, m));

  const totalMembers = familyConfig.members.length;

  // Visual percentages for the segmented balance bar
  const totalBase = Math.max(1, summary.totalIncome);
  const pctFixed = Math.min(100, (summary.totalFixedExpenses / totalBase) * 100);
  const pctVariable = Math.min(100 - pctFixed, (summary.totalVariableExpenses / totalBase) * 100);
  const pctSavings = Math.min(100 - pctFixed - pctVariable, (summary.totalSavings / totalBase) * 100);
  const pctRemaining = Math.max(0, 100 - pctFixed - pctVariable - pctSavings);

  // Health diagnosis
  const isHealthy = summary.tauxChargesFixes <= 50 && summary.soldeNet >= 0;
  const isSurplus = summary.soldeNet > 0;

  return (
    <div className="space-y-6">
      
      {/* Editorial Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-white shadow-xs">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/family_budget_harmony_1790473224885.jpg"
            alt="Harmonie budgétaire familiale"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter brightness-90"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/40" />
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <span>Budget Familial Mensuel</span>
            <span aria-hidden="true">·</span>
            <span>{formatMonthYear(currentMonth)}</span>
            <span aria-hidden="true">·</span>
            <span>{totalMembers} membres</span>
          </div>

          {isEditingName ? (
            <form onSubmit={handleSaveName} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Nom de famille"
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white border border-teal-500 font-bold text-lg sm:text-2xl focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs flex items-center gap-1 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                Valider
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Annuler
              </button>
            </form>
          ) : (
            <div className="mt-2 flex items-center gap-2 group">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {familyConfig.familyName}
              </h1>
              <button
                onClick={() => {
                  setTempName(familyConfig.familyName);
                  setIsEditingName(true);
                }}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Modifier le nom de famille"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {isSurplus ? (
              <span>
                Excellente gestion : votre solde prévisionnel est positif de{' '}
                <strong className="text-emerald-400 font-mono tabular-nums">
                  +{formatCurrency(summary.soldeNet)}
                </strong>
                . Votre reste à vivre s’élève à{' '}
                <strong className="text-white font-mono tabular-nums">
                  {formatCurrency(summary.resteAVivre)}
                </strong>
                .
              </span>
            ) : (
              <span>
                Attention : vos dépenses et épargnes prévues dépassent vos revenus de{' '}
                <strong className="text-rose-400 font-mono tabular-nums">
                  {formatCurrency(Math.abs(summary.soldeNet))}
                </strong>
                . Ajustez les dépenses variables pour équilibrer le mois.
              </span>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewTxModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter une dépense / rentrée
            </button>
            <button
              onClick={onDuplicateRecurring}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Importer automatiquement les charges récurrentes dans ce mois"
            >
              <Layers className="w-4 h-4" />
              Reconduire charges récurrentes
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stat Grid (Single-Elevation, Tabular figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Revenus Totaux */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Revenus du Foyer</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span>Salaires & rentrées nettes</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Charges Fixes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Charges Fixes (Incompressibles)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(summary.totalFixedExpenses)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 font-mono tabular-nums">
                {formatPercentage(summary.tauxChargesFixes)}
              </span>
              <span>des revenus</span>
              <span aria-hidden="true">·</span>
              <span className={summary.tauxChargesFixes <= 50 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                {summary.tauxChargesFixes <= 50 ? 'Sain (≤ 50%)' : 'Élevé (> 50%)'}
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Reste à Vivre Total */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reste à Vivre Mensuel</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-900">
              {formatCurrency(summary.resteAVivre)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span>Revenus moins charges fixes</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Reste à Vivre / Jour / Personne */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Reste / Jour / Membre</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono tabular-nums text-blue-900">
              {formatCurrency(summary.resteAVivreJournalierParPersonne)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
              <span>Par jour pour {totalMembers} personnes</span>
            </div>
          </div>
        </div>

      </div>

      {/* Secondary Metric Bar: Real Balance & Health */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Équilibre Financier & Répartition Mensuelle
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Vision globale de l'allocation des revenus perçus ce mois
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Solde net prévisionnel</span>
              <span
                className={`text-lg font-bold font-mono tabular-nums ${
                  summary.soldeNet >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {summary.soldeNet >= 0 ? '+' : ''}
                {formatCurrency(summary.soldeNet)}
              </span>
            </div>
            <div
              className={`px-3 py-1 rounded-md text-xs font-medium ${
                summary.soldeNet >= 0
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}
            >
              {summary.soldeNet >= 0 ? 'Excédentaire' : 'Déficit'}
            </div>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="mt-4">
          <div className="h-3.5 w-full bg-slate-100 rounded-md overflow-hidden flex">
            <div
              style={{ width: `${pctFixed}%` }}
              className="bg-indigo-600 h-full transition-all duration-300"
              title={`Charges fixes: ${pctFixed.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pctVariable}%` }}
              className="bg-amber-500 h-full transition-all duration-300"
              title={`Dépenses courantes: ${pctVariable.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pctSavings}%` }}
              className="bg-emerald-600 h-full transition-all duration-300"
              title={`Épargne & projets: ${pctSavings.toFixed(1)}%`}
            />
            <div
              style={{ width: `${pctRemaining}%` }}
              className="bg-teal-200 h-full transition-all duration-300"
              title={`Disponible / Marge: ${pctRemaining.toFixed(1)}%`}
            />
          </div>

          {/* Legend Items (Zero-Pill, pure typography) */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 shrink-0" />
              <span>Fixes : {formatCurrency(summary.totalFixedExpenses)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
              <span>Courantes : {formatCurrency(summary.totalVariableExpenses + summary.totalPunctualExpenses)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 shrink-0" />
              <span>Épargne : {formatCurrency(summary.totalSavings)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-200 shrink-0" />
              <span>Dispo : {formatCurrency(Math.max(0, summary.soldeNet))}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Grid: Pending operations + Envelopes Watch */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Operations Pending Clearance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Opérations Prévues / En Attente ({pendingTx.length})
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-teal-800 hover:text-teal-900 font-medium flex items-center gap-1"
              >
                Tout voir <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingTx.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2 opacity-80" />
                Toutes les opérations de ce mois ont été pointées et débitées !
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2">
                {pendingTx.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => onToggleStatus(tx.id)}
                        className="w-5 h-5 rounded-md border border-slate-300 hover:border-teal-700 hover:bg-teal-50 flex items-center justify-center shrink-0 transition-colors"
                        title="Marquer comme débité"
                      >
                        <span className="w-2 h-2 rounded-xs bg-slate-300" />
                      </button>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {tx.description}
                        </div>
                        <div className="text-slate-400 text-2xs">
                          {formatDateShort(tx.date)} · {tx.category}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pendingTx.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Total en attente de débit :</span>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {formatCurrency(pendingTx.reduce((sum, t) => sum + t.amount, 0))}
              </span>
            </div>
          )}
        </div>

        {/* Right: Envelopes Quick Watch */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Plafonds Budgétaires Clés
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('envelopes')}
              className="text-xs text-teal-800 hover:text-teal-900 font-medium flex items-center gap-1"
            >
              Gérer enveloppes <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 mt-3">
            {topWatchedCategories.map((cat) => {
              const pct = Math.min(100, Math.round(cat.percentageUsed));
              const isOver = cat.status === 'over';
              const isWarning = cat.status === 'warning';

              return (
                <div key={cat.category} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 truncate">{cat.category}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      <strong className={isOver ? 'text-rose-600' : 'text-slate-900'}>
                        {formatCurrency(cat.spent)}
                      </strong>{' '}
                      / {formatCurrency(cat.allocated)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver
                          ? 'bg-rose-600'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-between text-2xs text-slate-400">
                    <span>{pct}% consommé</span>
                    <span>
                      {cat.remaining >= 0
                        ? `Reste ${formatCurrency(cat.remaining)}`
                        : `Dépassement de ${formatCurrency(Math.abs(cat.remaining))}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Recent Transactions Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Dernières Opérations du Foyer
            </h3>
            <p className="text-xs text-slate-500">
              Enregistrées sur le mois sélectionné
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-teal-800 hover:text-teal-900 font-semibold flex items-center gap-1"
          >
            Ouvrir le journal complet ({monthTx.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Aucune opération enregistrée pour ce mois. Cliquez sur "Ajouter une opération" pour démarrer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Catégorie</th>
                  <th className="py-2.5 px-4">Membre</th>
                  <th className="py-2.5 px-4">Paiement</th>
                  <th className="py-2.5 px-4">Statut</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTx.map((tx) => {
                  const member = memberMap.get(tx.memberId);
                  const isCleared = tx.status === 'cleared';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateShort(tx.date)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.category}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.memberId === 'family' ? (
                          <span className="text-slate-500">Foyer commun</span>
                        ) : (
                          <span className="font-medium text-slate-800">{member?.name || tx.memberId}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(tx.id)}
                          className={`inline-flex items-center gap-1 text-2xs font-medium cursor-pointer ${
                            isCleared ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCleared ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                          />
                          {isCleared ? 'Débité' : 'En attente'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            tx.type === 'income'
                              ? 'text-emerald-700'
                              : tx.type === 'saving'
                              ? 'text-teal-700'
                              : 'text-slate-900'
                          }
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
