import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Edit2,
  Heart,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import {
  FamilyConfig,
  FamilyMember,
  MemberRole,
  Transaction,
} from '../types/budget';
import { calculateFairSplit } from '../utils/calculations';
import { formatCurrency, formatMonthYear, formatPercentage } from '../utils/formatters';

interface FamilyMembersViewProps {
  familyConfig: FamilyConfig;
  transactions: Transaction[];
  currentMonth: string;
  onUpdateFamilyConfig: (updated: FamilyConfig) => void;
  onAddMember: (member: FamilyMember) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMember: (id: string) => void;
  onUpdateFamilyName?: (newName: string) => void;
}

export const FamilyMembersView: React.FC<FamilyMembersViewProps> = ({
  familyConfig,
  transactions,
  currentMonth,
  onUpdateFamilyConfig,
  onAddMember,
  onEditMember,
  onDeleteMember,
  onUpdateFamilyName,
}) => {
  const [splitMode, setSplitMode] = useState<'prorata' | 'equal'>('prorata');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [familyNameInput, setFamilyNameInput] = useState(familyConfig.familyName);
  const [isFamilyNameSaved, setIsFamilyNameSaved] = useState(false);

  React.useEffect(() => {
    setFamilyNameInput(familyConfig.familyName);
  }, [familyConfig.familyName]);

  const handleSaveFamilyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyNameInput.trim()) return;
    if (onUpdateFamilyName) {
      onUpdateFamilyName(familyNameInput.trim());
    } else {
      onUpdateFamilyConfig({
        ...familyConfig,
        familyName: familyNameInput.trim(),
      });
    }
    setIsFamilyNameSaved(true);
    setTimeout(() => setIsFamilyNameSaved(false), 2500);
  };
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<MemberRole>('parent');
  const [incomeInput, setIncomeInput] = useState('');
  const [allowanceInput, setAllowanceInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const splitResult = calculateFairSplit(familyConfig, transactions, currentMonth);

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    const parsedIncome = parseFloat(incomeInput.replace(',', '.')) || 0;
    const parsedAllowance = parseFloat(allowanceInput.replace(',', '.')) || 0;

    const newMember: FamilyMember = {
      id: `m-${Date.now()}`,
      name: nameInput.trim(),
      role: roleInput,
      monthlyIncome: parsedIncome,
      personalAllowance: parsedAllowance > 0 ? parsedAllowance : undefined,
      color: roleInput === 'parent' ? '#0F766E' : '#2563EB',
      avatarInitial: nameInput.trim().slice(0, 2).toUpperCase(),
      isContributor: roleInput === 'parent',
      notes: notesInput.trim() || undefined,
    };

    onAddMember(newMember);
    setNameInput('');
    setIncomeInput('');
    setAllowanceInput('');
    setNotesInput('');
    setIsAddingMember(false);
  };

  const roleLabels: Record<MemberRole, string> = {
    parent: 'Parent / Contributeur',
    teen: 'Adolescent(e)',
    child: 'Enfant',
    other: 'Autre membre',
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Foyer & Répartition Équitable
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestion des membres de la {familyConfig.familyName} et calcul du partage des dépenses communes
          </p>
        </div>

        <button
          onClick={() => setIsAddingMember(!isAddingMember)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un membre
        </button>
      </div>

      {/* Paramètres d'identification du Foyer (Nom de famille et Devise) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <form onSubmit={handleSaveFamilyName} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nom du Foyer ou de la Famille
              </label>
              <input
                type="text"
                value={familyNameInput}
                onChange={(e) => setFamilyNameInput(e.target.value)}
                placeholder="ex: Famille Martin..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Devise
              </label>
              <select
                value={familyConfig.currencySymbol || 'Ar'}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateFamilyConfig({
                    ...familyConfig,
                    currencySymbol: val,
                    currency: val === 'Ar' ? 'MGA' : val === '€' ? 'EUR' : val === '$' ? 'USD' : val,
                  });
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50/50 focus:bg-white text-xs text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option value="Ar">Ariary (Ar)</option>
                <option value="€">Euro (€)</option>
                <option value="$">Dollar ($)</option>
                <option value="CHF">Franc Suisse (CHF)</option>
                <option value="FCFA">FCFA</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-800 text-white font-semibold text-xs hover:bg-teal-900 transition-colors shrink-0"
            >
              Enregistrer
            </button>

            {isFamilyNameSaved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start sm:self-auto">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Enregistré !</span>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Add Member Form */}
      {isAddingMember && (
        <form
          onSubmit={handleCreateMember}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs"
        >
          <h4 className="font-bold text-slate-900">Nouveau membre du foyer</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Prénom / Nom *</label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="ex: Camille"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Rôle dans le foyer</label>
              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as MemberRole)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="parent">Parent (participe aux frais)</option>
                <option value="teen">Adolescent(e)</option>
                <option value="child">Enfant</option>
                <option value="other">Autre / Proche</option>
              </select>
            </div>

            {roleInput === 'parent' ? (
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Salaire net mensuel ({familyConfig.currencySymbol || 'Ar'})
                </label>
                <input
                  type="text"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="ex: 1500000"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Argent de poche mensuel ({familyConfig.currencySymbol || 'Ar'})
                </label>
                <input
                  type="text"
                  value={allowanceInput}
                  onChange={(e) => setAllowanceInput(e.target.value)}
                  placeholder="ex: 30000"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-medium mb-1">Notes / Statut</label>
              <input
                type="text"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="ex: Collège, Temps plein..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900"
            >
              Enregistrer le membre
            </button>
          </div>
        </form>
      )}

      {/* Member Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {familyConfig.members.map((member) => {
          const memberTx = transactions.filter(
            (t) => t.month === currentMonth && t.memberId === member.id && t.type === 'expense',
          );
          const memberTotalSpent = memberTx.reduce((sum, t) => sum + t.amount, 0);

          return (
            <div
              key={member.id}
              className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-2xs"
                      style={{ backgroundColor: member.color || '#0F766E' }}
                    >
                      {member.avatarInitial || member.name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                      <span className="text-2xs text-slate-500 block">
                        {roleLabels[member.role] || member.role}
                      </span>
                    </div>
                  </div>

                  {familyConfig.members.length > 1 && (
                    <button
                      onClick={() => onDeleteMember(member.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Supprimer ce membre"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {member.notes && (
                  <p className="mt-3 text-2xs text-slate-500 leading-normal italic">
                    {member.notes}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {member.role === 'parent' ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Revenu mensuel :</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(member.monthlyIncome || 0)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Argent de poche :</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatCurrency(member.personalAllowance || 0)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dépenses directes :</span>
                    <span className="font-mono text-slate-700 tabular-nums">
                      {formatCurrency(memberTotalSpent)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-400">
                <span>{memberTx.length} dépense(s) directe(s)</span>
                {member.isContributor && (
                  <span className="text-teal-700 font-medium">Contributeur foyer</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Fair Split Calculator (Calculateur de contribution équitable) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-700" />
              <h3 className="text-base font-bold text-slate-900">
                Calculateur de Répartition des Frais Communs ({formatMonthYear(currentMonth)})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Partage des charges communes du ménage (Loyer, courses, énergie, enfants) entre conjoints
            </p>
          </div>

          {/* Toggle Prorata vs 50/50 */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setSplitMode('prorata')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                splitMode === 'prorata'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Au Prorata des Revenus
            </button>
            <button
              onClick={() => setSplitMode('equal')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                splitMode === 'equal'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              50 / 50 Égalitaire
            </button>
          </div>
        </div>

        {/* Total Shared Expenses Banner */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Total des Dépenses Partagées du Foyer
            </span>
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums mt-0.5 block">
              {formatCurrency(splitResult.totalSharedExpenses)}
            </span>
            <span className="text-2xs text-slate-400 mt-0.5 block">
              Charges fixes communes + courses + factures du ménage
            </span>
          </div>

          <div className="text-xs text-slate-600 max-w-sm">
            {splitMode === 'prorata' ? (
              <span>
                Chaque parent contribue proportionnellement à son salaire net, assurant un reste à vivre équitable et serein pour chacun.
              </span>
            ) : (
              <span>
                Chaque parent contribue à parts exactement égales (50% chacun) aux dépenses du foyer.
              </span>
            )}
          </div>
        </div>

        {/* Breakdown for each contributor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {splitResult.contributors.map((c) => {
            const pct = splitMode === 'prorata' ? c.prorataPercentage : c.equalPercentage;
            const targetPay = splitMode === 'prorata' ? c.shouldPayProrata : c.shouldPayEqual;
            const balance = splitMode === 'prorata' ? c.balanceProrata : c.balanceEqual;

            return (
              <div
                key={c.member.id}
                className="bg-white rounded-xl p-5 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: c.member.color }}
                    >
                      {c.member.avatarInitial}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{c.member.name}</h4>
                      <span className="text-2xs text-slate-500">
                        Salaire : {formatCurrency(c.income)} ({formatPercentage(pct)})
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xs text-slate-400 block">Quote-part due</span>
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                      {formatCurrency(targetPay)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Avancé directement :</span>
                    <span className="font-mono tabular-nums">{formatCurrency(c.alreadyPaidShared)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 font-medium">
                    <span>Régularisation / Virement :</span>
                    <span
                      className={`font-mono tabular-nums font-bold ${
                        balance >= 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {balance >= 0
                        ? `Reçoit +${formatCurrency(balance)}`
                        : `Doit verser ${formatCurrency(Math.abs(balance))}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clear Resolution Box */}
        {splitResult.contributors.length === 2 && (
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-teal-700 shrink-0" />
            <div className="text-xs text-teal-950 leading-relaxed">
              <strong>Synthèse du virement d'équilibre : </strong>
              {(() => {
                const c1 = splitResult.contributors[0];
                const c2 = splitResult.contributors[1];
                const bal1 = splitMode === 'prorata' ? c1.balanceProrata : c1.balanceEqual;
                const bal2 = splitMode === 'prorata' ? c2.balanceProrata : c2.balanceEqual;

                if (Math.abs(bal1) < 1) {
                  return 'Les comptes sont déjà parfaitement équilibrés ce mois-ci ! Aucun virement requis.';
                }

                if (bal1 < 0) {
                  return `${c1.member.name} doit virer ${formatCurrency(Math.abs(bal1))} à ${c2.member.name} (ou verser cette part sur le compte joint du couple) pour clore le mois.`;
                } else {
                  return `${c2.member.name} doit virer ${formatCurrency(Math.abs(bal2))} à ${c1.member.name} (ou verser cette part sur le compte joint du couple) pour clore le mois.`;
                }
              })()}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
