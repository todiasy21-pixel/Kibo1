import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import {
  ExpenseNature,
  FamilyConfig,
  PaymentMethod,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../types/budget';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  currentMonth: string;
  familyConfig: FamilyConfig;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentMonth,
  familyConfig,
  editingTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [nature, setNature] = useState<ExpenseNature>('variable');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [memberId, setMemberId] = useState('family');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Carte bancaire');
  const [status, setStatus] = useState<TransactionStatus>('cleared');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Available categories based on config
  const availableCategories = familyConfig.categoryBudgets.map((c) => c.category);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setNature(editingTransaction.nature);
      setDescription(editingTransaction.description);
      setAmountStr(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setMemberId(editingTransaction.memberId);
      setPaymentMethod(editingTransaction.paymentMethod);
      setStatus(editingTransaction.status);
      setIsRecurring(!!editingTransaction.isRecurring);
      setNotes(editingTransaction.notes || '');
      setIsCustomCategory(false);
    } else {
      // Default new transaction in selected month
      const today = new Date().toISOString().slice(0, 10);
      const isCurrentMonth = today.startsWith(currentMonth);
      const defaultDate = isCurrentMonth ? today : `${currentMonth}-01`;

      setType('expense');
      setNature('variable');
      setDescription('');
      setAmountStr('');
      setDate(defaultDate);
      setCategory(availableCategories[0] || 'Alimentation & Supermarché');
      setMemberId('family');
      setPaymentMethod('Carte bancaire');
      setStatus('cleared');
      setIsRecurring(false);
      setNotes('');
      setIsCustomCategory(false);
    }
  }, [editingTransaction, isOpen, currentMonth]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Veuillez renseigner un montant valide supérieur à 0.');
      return;
    }
    if (!description.trim()) {
      alert('Veuillez saisir un libellé / description.');
      return;
    }

    const finalCategory = isCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : category;

    // Determine month from date (YYYY-MM)
    const txMonth = date.slice(0, 7) || currentMonth;

    const newTx: Transaction = {
      id: editingTransaction ? editingTransaction.id : `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      month: txMonth,
      date,
      type,
      nature: type === 'income' ? 'fixed' : nature,
      category: finalCategory,
      description: description.trim(),
      amount: parsedAmount,
      memberId,
      paymentMethod,
      status,
      isRecurring,
      notes: notes.trim() || undefined,
    };

    onSave(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {editingTransaction ? 'Modifier l’opération' : 'Ajouter une opération'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Type Segmented Buttons */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Type d'opération
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition-all ${
                  type === 'expense'
                    ? 'border-rose-500 bg-rose-50 text-rose-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Dépense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition-all ${
                  type === 'income'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Revenu / Rentrée
              </button>
              <button
                type="button"
                onClick={() => setType('saving')}
                className={`py-2 px-3 text-center rounded-lg border text-xs font-semibold transition-all ${
                  type === 'saving'
                    ? 'border-teal-500 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Épargne / Projet
              </button>
            </div>
          </div>

          {/* If Expense: Nature */}
          {type === 'expense' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Nature de la dépense
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setNature('variable')}
                  className={`py-1.5 px-2 text-center rounded-lg border text-2xs font-medium transition-all ${
                    nature === 'variable'
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Courante / Variable
                </button>
                <button
                  type="button"
                  onClick={() => setNature('fixed')}
                  className={`py-1.5 px-2 text-center rounded-lg border text-2xs font-medium transition-all ${
                    nature === 'fixed'
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Charge fixe mensuelle
                </button>
                <button
                  type="button"
                  onClick={() => setNature('punctual')}
                  className={`py-1.5 px-2 text-center rounded-lg border text-2xs font-medium transition-all ${
                    nature === 'punctual'
                      ? 'border-slate-800 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Ponctuelle / Imprévu
                </button>
              </div>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Description / Libellé *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ex: Courses E.Leclerc, Loyer, Prêt..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Montant ({familyConfig.currencySymbol || 'Ar'}) *
              </label>
              <input
                type="text"
                required
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="ex: 150000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Date de l'opération *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catégorie *
              </label>
              {!isCustomCategory ? (
                <div className="space-y-1">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
                  >
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Autre catégorie personnalisée...</option>
                  </select>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="Nom de la catégorie"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(false)}
                    className="px-2 py-1 text-2xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Member & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Membre du foyer assigné
              </label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
              >
                <option value="family">Foyer commun (Dépense partagée)</option>
                {familyConfig.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === 'parent' ? 'Parent' : 'Enfant/Ado'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mode de paiement
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
              >
                <option value="Carte bancaire">Carte bancaire (CB)</option>
                <option value="Prélèvement">Prélèvement automatique</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
          </div>

          {/* Status & Recurring */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'cleared'}
                  onChange={() => setStatus('cleared')}
                  className="text-teal-700 focus:ring-teal-700"
                />
                <span className="font-medium text-slate-800">Débité / Déjà payé</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="font-medium text-slate-800">Prévu / En attente</span>
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
              />
              <span className="text-slate-700">Reconduire chaque mois</span>
            </label>

          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Notes complémentaires (facultatif)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Ticket de caisse, numéro de chèque, facture..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-900"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs transition-colors"
            >
              {editingTransaction ? 'Enregistrer les modifications' : 'Ajouter l’opération'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
