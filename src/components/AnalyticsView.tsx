import React, { useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  FamilyConfig,
  MonthlySummary,
  Transaction,
} from '../types/budget';
import { calculateCategoryBreakdown } from '../utils/calculations';
import {
  formatCurrency,
  formatMonthYear,
  formatPercentage,
} from '../utils/formatters';

interface AnalyticsViewProps {
  currentMonth: string;
  summary: MonthlySummary;
  familyConfig: FamilyConfig;
  transactions: Transaction[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentMonth,
  summary,
  familyConfig,
  transactions,
}) => {
  const monthTx = useMemo(
    () => transactions.filter((t) => t.month === currentMonth),
    [transactions, currentMonth],
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(currentMonth, transactions, familyConfig.categoryBudgets),
    [currentMonth, transactions, familyConfig.categoryBudgets],
  );

  // 50 / 30 / 20 Rule Analysis
  // Needs: Fixed charges + Groceries/Health/Transport basics (approx 75% of variable)
  const totalIncome = Math.max(1, summary.totalIncome);
  const totalNeeds = summary.totalFixedExpenses;
  const totalWants = summary.totalVariableExpenses + summary.totalPunctualExpenses;
  const totalSavings = summary.totalSavings;

  const pctNeeds = (totalNeeds / totalIncome) * 100;
  const pctWants = (totalWants / totalIncome) * 100;
  const pctSavings = (totalSavings / totalIncome) * 100;

  // Expenses by Family Member
  const memberExpenses = useMemo(() => {
    const map = new Map<string, number>();
    map.set('family', 0);
    familyConfig.members.forEach((m) => map.set(m.id, 0));

    monthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cur = map.get(t.memberId) || 0;
        map.set(t.memberId, cur + t.amount);
      });

    return map;
  }, [monthTx, familyConfig.members]);

  // Top 6 Expense Categories for SVG ring chart
  const topExpenseCategories = useMemo(() => {
    return [...categoryBreakdown]
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 6);
  }, [categoryBreakdown]);

  const totalTopExpenses = topExpenseCategories.reduce((s, c) => s + c.spent, 0);

  // SVG Pie Slices calculation
  const slices = useMemo(() => {
    let cumulative = 0;
    return topExpenseCategories.map((cat, idx) => {
      const share = totalTopExpenses > 0 ? cat.spent / totalTopExpenses : 0;
      const startAngle = cumulative * 2 * Math.PI;
      cumulative += share;
      const endAngle = cumulative * 2 * Math.PI;

      // Arc coordinates (center 100, 100, outer 85, inner 55)
      const x1 = 100 + 85 * Math.sin(startAngle);
      const y1 = 100 - 85 * Math.cos(startAngle);
      const x2 = 100 + 85 * Math.sin(endAngle);
      const y2 = 100 - 85 * Math.cos(endAngle);

      const ix1 = 100 + 55 * Math.sin(endAngle);
      const iy1 = 100 - 55 * Math.cos(endAngle);
      const ix2 = 100 + 55 * Math.sin(startAngle);
      const iy2 = 100 - 55 * Math.cos(startAngle);

      const largeArcFlag = share > 0.5 ? 1 : 0;
      const pathData = `
        M ${x1} ${y1}
        A 85 85 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${ix1} ${iy1}
        A 55 55 0 ${largeArcFlag} 0 ${ix2} ${iy2}
        Z
      `;

      // Color palette
      const colors = ['#0F766E', '#4F46E5', '#D97706', '#E11D48', '#2563EB', '#64748B'];
      return {
        category: cat.category,
        spent: cat.spent,
        percentage: Math.round(share * 100),
        color: colors[idx % colors.length],
        pathData,
      };
    });
  }, [topExpenseCategories, totalTopExpenses]);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Analyses & Santé Budgétaire Familiale
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Indicateurs financiers, ratio 50/30/20 et répartition des dépenses pour {formatMonthYear(currentMonth)}
        </p>
      </div>

      {/* Règle 50 / 30 / 20 (Modèle de référence) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              La Règle d'Or 50 / 30 / 20
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              Comparaison entre la répartition recommandée et la réalité de votre foyer ce mois-ci
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Revenus du foyer : <strong className="font-mono text-slate-900">{formatCurrency(summary.totalIncome)}</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 50% Besoins */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">1. Charges Fixes (Besoins)</span>
              <span className="font-mono font-semibold text-slate-600">Cible : ≤ 50%</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatPercentage(pctNeeds)}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, pctNeeds)}%` }}
                className={`h-full rounded-full ${
                  pctNeeds <= 50 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="text-2xs text-slate-500 leading-normal">
              {formatCurrency(totalNeeds)} engagés dans le logement, factures et assurances.
              {pctNeeds <= 50 ? ' Niveau sain et maîtrisé.' : ' Charges élevées, marge de manœuvre réduite.'}
            </p>
          </div>

          {/* 30% Envies / Courant */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">2. Dépenses Variables (Vie)</span>
              <span className="font-mono font-semibold text-slate-600">Cible : ~ 30%</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatPercentage(pctWants)}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, pctWants)}%` }}
                className={`h-full rounded-full ${
                  pctWants <= 35 ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
            </div>
            <p className="text-2xs text-slate-500 leading-normal">
              {formatCurrency(totalWants)} pour les courses, carburant, loisirs, sorties et imprévus.
            </p>
          </div>

          {/* 20% Épargne */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">3. Épargne & Projets</span>
              <span className="font-mono font-semibold text-slate-600">Cible : ≥ 20%</span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {formatPercentage(pctSavings)}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, pctSavings)}%` }}
                className={`h-full rounded-full ${
                  pctSavings >= 15 ? 'bg-emerald-600' : 'bg-teal-600'
                }`}
              />
            </div>
            <p className="text-2xs text-slate-500 leading-normal">
              {formatCurrency(totalSavings)} placés ce mois sur les livrets et projets d'avenir.
            </p>
          </div>

        </div>
      </div>

      {/* Grid: Donut Chart + Expenses per member */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Top Categories Donut Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Top 6 des Postes de Dépenses
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total : {formatCurrency(totalTopExpenses)}
            </span>
          </div>

          {slices.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Aucune dépense enregistrée pour ce mois.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              
              {/* SVG Ring */}
              <div className="w-48 h-48 shrink-0 relative flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {slices.map((slice, i) => (
                    <path
                      key={i}
                      d={slice.pathData}
                      fill={slice.color}
                      className="hover:opacity-85 transition-opacity cursor-pointer"
                    >
                      <title>{`${slice.category} : ${formatCurrency(slice.spent)} (${slice.percentage}%)`}</title>
                    </path>
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xs text-slate-400">Total</span>
                  <span className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                    {formatCurrency(totalTopExpenses)}
                  </span>
                </div>
              </div>

              {/* Legend (Zero-Pill, pure typography) */}
              <div className="flex-1 space-y-2 text-xs w-full">
                {slices.map((slice, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate text-slate-700 font-medium">{slice.category}</span>
                    </div>
                    <div className="shrink-0 font-mono text-slate-900 tabular-nums text-right">
                      <strong>{formatCurrency(slice.spent)}</strong>
                      <span className="text-slate-400 ml-1 text-2xs">({slice.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

        {/* Right: Expenses by Member of the Household */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Dépenses par Membre du Foyer
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total : {formatCurrency(summary.totalExpenses)}
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Foyer Commun */}
            {(() => {
              const sharedAmt = memberExpenses.get('family') || 0;
              const pct = summary.totalExpenses > 0 ? Math.round((sharedAmt / summary.totalExpenses) * 100) : 0;
              return (
                <div className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">
                      Foyer commun (Dépenses partagées du ménage)
                    </span>
                    <span className="font-mono tabular-nums text-slate-700">
                      <strong>{formatCurrency(sharedAmt)}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-teal-800 rounded-full" />
                  </div>
                </div>
              );
            })()}

            {/* Individual Members */}
            {familyConfig.members.map((m) => {
              const amt = memberExpenses.get(m.id) || 0;
              const pct = summary.totalExpenses > 0 ? Math.round((amt / summary.totalExpenses) * 100) : 0;

              return (
                <div key={m.id} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700">{m.name}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {formatCurrency(amt)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: m.color || '#4F46E5' }}
                      className="h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 text-2xs text-slate-500 leading-normal">
            Astuce : Les dépenses affectées au "Foyer commun" alimentent directement le calculateur de répartition équitable pour les parents.
          </div>
        </div>

      </div>

    </div>
  );
};
