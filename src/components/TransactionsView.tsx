import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Edit2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  ExpenseNature,
  FamilyConfig,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types/budget';
import {
  formatCurrency,
  formatDateShort,
  formatMonthYear,
} from '../utils/formatters';

interface TransactionsViewProps {
  currentMonth: string;
  transactions: Transaction[];
  familyConfig: FamilyConfig;
  onOpenNewTxModal: () => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onDuplicateTx: (tx: Transaction) => void;
  onToggleStatus: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  currentMonth,
  transactions,
  familyConfig,
  onOpenNewTxModal,
  onEditTx,
  onDeleteTx,
  onDuplicateTx,
  onToggleStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedNature, setSelectedNature] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    familyConfig.members.forEach((m) => map.set(m.id, m.name));
    map.set('family', 'Foyer commun');
    return map;
  }, [familyConfig.members]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.month === currentMonth);
  }, [transactions, currentMonth]);

  const filteredTransactions = useMemo(() => {
    return monthTransactions.filter((tx) => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(term);
        const matchesCat = tx.category.toLowerCase().includes(term);
        const matchesNotes = (tx.notes || '').toLowerCase().includes(term);
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }

      // Type
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // Nature
      if (selectedNature !== 'all' && tx.nature !== selectedNature) {
        return false;
      }

      // Member
      if (selectedMember !== 'all' && tx.memberId !== selectedMember) {
        return false;
      }

      // Status
      if (selectedStatus !== 'all' && tx.status !== selectedStatus) {
        return false;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthTransactions, searchTerm, selectedType, selectedNature, selectedMember, selectedStatus]);

  const filteredTotal = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') return acc + t.amount;
      return acc - t.amount;
    }, 0);
  }, [filteredTransactions]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedNature('all');
    setSelectedMember('all');
    setSelectedStatus('all');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedType !== 'all' ||
    selectedNature !== 'all' ||
    selectedMember !== 'all' ||
    selectedStatus !== 'all';

  return (
    <div className="space-y-5">
      
      {/* Top Controls: Search + Quick stats + Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Journal des Opérations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatMonthYear(currentMonth)} · {filteredTransactions.length} opération(s) affichée(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-2xs uppercase tracking-wider text-slate-500 block">Total filtré</span>
            <span
              className={`text-base font-bold font-mono tabular-nums ${
                filteredTotal >= 0 ? 'text-emerald-700' : 'text-slate-900'
              }`}
            >
              {filteredTotal >= 0 ? '+' : ''}
              {formatCurrency(filteredTotal)}
            </span>
          </div>
          <button
            onClick={onOpenNewTxModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une opération
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Segmented Buttons - Zero-Pill compliant) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une opération, magasin, loyer, cantine..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Member Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Membre :</span>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-700"
            >
              <option value="all">Tout le foyer</option>
              <option value="family">Foyer commun (partagé)</option>
              {familyConfig.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0 px-2 py-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>

        {/* Filter Tabs: Type, Nature, Status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          
          {/* Type Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-2xs">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous types
            </button>
            <button
              onClick={() => setSelectedType('expense')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedType === 'expense'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dépenses
            </button>
            <button
              onClick={() => setSelectedType('income')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedType === 'income'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenus
            </button>
            <button
              onClick={() => setSelectedType('saving')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedType === 'saving'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Épargne
            </button>
          </div>

          {/* Nature Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-2xs">
            <button
              onClick={() => setSelectedNature('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedNature === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Toute nature
            </button>
            <button
              onClick={() => setSelectedNature('fixed')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedNature === 'fixed'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fixes
            </button>
            <button
              onClick={() => setSelectedNature('variable')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedNature === 'variable'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Variables
            </button>
            <button
              onClick={() => setSelectedNature('punctual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedNature === 'punctual'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Imprévus / Ponctuel
            </button>
          </div>

          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-2xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous statuts
            </button>
            <button
              onClick={() => setSelectedStatus('cleared')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedStatus === 'cleared'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Débités / Encaissés
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedStatus === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En attente
            </button>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              Aucune opération trouvée
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Aucune opération ne correspond à vos filtres actuels pour {formatMonthYear(currentMonth)}.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Effacer les filtres
                </button>
              )}
              <button
                onClick={onOpenNewTxModal}
                className="px-3 py-1.5 text-xs rounded-lg bg-teal-800 text-white hover:bg-teal-900 font-medium"
              >
                Ajouter une opération
              </button>
            </div>
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
                  <th className="py-2.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.map((tx) => {
                  const isCleared = tx.status === 'cleared';
                  const memberName = memberMap.get(tx.memberId) || tx.memberId;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateShort(tx.date)}
                      </td>

                      {/* Description & Note */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900">
                          {tx.description}
                        </div>
                        {tx.notes && (
                          <div className="text-2xs text-slate-400 italic mt-0.5 truncate">
                            {tx.notes}
                          </div>
                        )}
                        {tx.isRecurring && (
                          <div className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>Récurrent mensuel</span>
                          </div>
                        )}
                      </td>

                      {/* Category & Nature */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{tx.category}</div>
                        <div className="text-2xs text-slate-400">
                          {tx.nature === 'fixed'
                            ? 'Charge fixe'
                            : tx.nature === 'variable'
                            ? 'Dépense courante'
                            : 'Ponctuel / Imprévu'}
                        </div>
                      </td>

                      {/* Member */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{memberName}</span>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Status Toggle (Zero-Pill: Clean unboxed indicator) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(tx.id)}
                          className={`inline-flex items-center gap-1.5 font-medium cursor-pointer transition-colors ${
                            isCleared ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                          title="Cliquer pour changer de statut"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCleared ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isCleared ? 'Débité' : 'En attente'}</span>
                        </button>
                      </td>

                      {/* Amount */}
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

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTx(tx)}
                            className="p-1 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateTx(tx)}
                            className="p-1 text-slate-500 hover:text-teal-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Dupliquer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTx(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
