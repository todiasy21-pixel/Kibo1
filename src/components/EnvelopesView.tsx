import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit2,
  Layers,
  Plus,
  Save,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import {
  CategoryBudget,
  ExpenseNature,
  FamilyConfig,
  Transaction,
} from '../types/budget';
import { calculateCategoryBreakdown } from '../utils/calculations';
import { formatCurrency, formatMonthYear } from '../utils/formatters';

interface EnvelopesViewProps {
  currentMonth: string;
  transactions: Transaction[];
  familyConfig: FamilyConfig;
  onUpdateCategoryBudget: (categoryName: string, newAllocated: number) => void;
  onRenameCategory?: (
    oldName: string,
    newName: string,
    newAllocated?: number,
    newNature?: ExpenseNature | 'income' | 'saving',
  ) => void;
  onDeleteCategory?: (categoryName: string) => void;
  onAddCategoryBudget: (newBudget: CategoryBudget) => void;
}

export const EnvelopesView: React.FC<EnvelopesViewProps> = ({
  currentMonth,
  transactions,
  familyConfig,
  onUpdateCategoryBudget,
  onRenameCategory,
  onDeleteCategory,
  onAddCategoryBudget,
}) => {
  // Modal / Editing state for an individual category
  const [editingTarget, setEditingTarget] = useState<CategoryBudget | null>(null);
  const [editName, setEditName] = useState('');
  const [editAllocated, setEditAllocated] = useState('');
  const [editNature, setEditNature] = useState<ExpenseNature | 'income' | 'saving'>('variable');

  // Quick inline add new category
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatNature, setNewCatNature] = useState<'variable' | 'fixed' | 'punctual' | 'saving'>('variable');
  const [newCatAmount, setNewCatAmount] = useState('');

  // Mass manager modal
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const categoryBreakdown = calculateCategoryBreakdown(
    currentMonth,
    transactions,
    familyConfig.categoryBudgets,
  );

  const totalAllocated = categoryBreakdown.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = categoryBreakdown.reduce((sum, c) => sum + c.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;

  const handleOpenEdit = (catBudget: CategoryBudget) => {
    setEditingTarget(catBudget);
    setEditName(catBudget.category);
    setEditAllocated(String(catBudget.allocated));
    setEditNature(catBudget.nature);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    const cleanNewName = editName.trim();
    if (!cleanNewName) {
      alert('Veuillez renseigner un nom de charge valide.');
      return;
    }

    const parsedAllocated = parseFloat(editAllocated.replace(',', '.'));
    const finalAllocated = isNaN(parsedAllocated) || parsedAllocated < 0 ? 0 : parsedAllocated;

    if (onRenameCategory) {
      onRenameCategory(
        editingTarget.category,
        cleanNewName,
        finalAllocated,
        editNature,
      );
    } else {
      onUpdateCategoryBudget(cleanNewName, finalAllocated);
    }

    setEditingTarget(null);
  };

  const handleDeleteCategory = (catName: string) => {
    if (confirm(`Confirmez-vous la suppression de la charge « ${catName} » ?`)) {
      if (onDeleteCategory) {
        onDeleteCategory(catName);
      }
      setEditingTarget(null);
    }
  };

  const handleCreateNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const parsed = parseFloat(newCatAmount.replace(',', '.')) || 0;

    onAddCategoryBudget({
      category: newCatName.trim(),
      nature: newCatNature,
      allocated: parsed,
      iconName: 'Tag',
      color: '#0F766E',
    });

    setNewCatName('');
    setNewCatAmount('');
    setIsAddingNew(false);
  };

  // Group by nature
  const fixedCategories = categoryBreakdown.filter((c) => c.nature === 'fixed');
  const variableCategories = categoryBreakdown.filter((c) => c.nature === 'variable');
  const punctualCategories = categoryBreakdown.filter((c) => c.nature === 'punctual');
  const savingCategories = categoryBreakdown.filter((c) => c.nature === 'saving');

  const renderCategoryCard = (cat: typeof categoryBreakdown[0]) => {
    const rawBudget = familyConfig.categoryBudgets.find((c) => c.category === cat.category) || {
      category: cat.category,
      nature: cat.nature as any,
      allocated: cat.allocated,
      iconName: cat.iconName,
      color: cat.color,
    };

    const pct = Math.min(100, Math.round(cat.percentageUsed));
    const isOver = cat.status === 'over';
    const isWarning = cat.status === 'warning';

    return (
      <div
        key={cat.category}
        className={`bg-white rounded-xl p-4 border transition-all shadow-2xs ${
          isOver
            ? 'border-rose-300'
            : isWarning
            ? 'border-amber-200'
            : 'border-slate-200/90'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-slate-900 truncate" title={cat.category}>
              {cat.category}
            </h4>
            <span className="text-2xs text-slate-400">
              {cat.transactionCount} opération(s) ce mois
            </span>
          </div>

          {/* Edit Button */}
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEdit(rawBudget)}
              className="text-2xs text-slate-500 hover:text-teal-800 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors border border-slate-200/70"
              title="Renommer la charge ou modifier le plafond"
            >
              <Edit2 className="w-3 h-3 text-slate-400" />
              <span>Modifier</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {formatCurrency(cat.spent)}
            </span>
            <span className="font-mono text-slate-500 tabular-nums text-2xs">
              Plafond alloué : {formatCurrency(cat.allocated)}
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

          <div className="mt-2 flex items-center justify-between text-2xs">
            <span className="font-medium text-slate-600 font-mono tabular-nums">
              {Math.round(cat.percentageUsed)}% consommé
            </span>

            <span
              className={`font-semibold font-mono tabular-nums ${
                cat.remaining >= 0 ? 'text-slate-700' : 'text-rose-600'
              }`}
            >
              {cat.remaining >= 0
                ? `Reste : +${formatCurrency(cat.remaining)}`
                : `Dépassement : -${formatCurrency(Math.abs(cat.remaining))}`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Enveloppes & Gestion des Charges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personnalisez librement le nom de chaque charge (loyer, courses, factures) et son plafond pour {formatMonthYear(currentMonth)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            title="Vue d'ensemble pour renommer toutes vos charges"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            Renommer les charges
          </button>

          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle charge
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-2xs uppercase tracking-wider text-slate-500 block">Total Plafonds Alloués</span>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {formatCurrency(totalAllocated)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">
            Budget total programmé
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-2xs uppercase tracking-wider text-slate-500 block">Total Dépensé / Consommé</span>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {formatCurrency(totalSpent)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {totalAllocated > 0 ? `${Math.round((totalSpent / totalAllocated) * 100)} % du budget global` : ''}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs">
          <span className="text-2xs uppercase tracking-wider text-slate-500 block">Marge / Reste Disponible</span>
          <span
            className={`text-xl font-bold font-mono tabular-nums mt-1 block ${
              totalRemaining >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {totalRemaining >= 0 ? '+' : ''}
            {formatCurrency(totalRemaining)}
          </span>
          <span className="text-xs text-slate-500 mt-0.5 block">
            {totalRemaining >= 0 ? 'Budget respecté' : 'Dépassement global'}
          </span>
        </div>
      </div>

      {/* Optional: Add New Category Form */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateNewCategory}
          className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-3 text-xs"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-teal-900">Ajouter une nouvelle charge personnalisée</h4>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nom de la charge *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="ex: Crédit Immo, Animaux, Jardinage..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Nature du poste</label>
              <select
                value={newCatNature}
                onChange={(e) => setNewCatNature(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="variable">Dépense courante / variable</option>
                <option value="fixed">Charge fixe mensuelle</option>
                <option value="punctual">Ponctuel / Imprévu</option>
                <option value="saving">Épargne & Projet</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Plafond mensuel ({familyConfig.currencySymbol || 'Ar'})
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCatAmount}
                  onChange={(e) => setNewCatAmount(e.target.value)}
                  placeholder="ex: 150000"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Section 1: Dépenses Courantes & Variables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              1. Dépenses Courantes & Variables
            </h3>
            <p className="text-2xs text-slate-500">
              Postes modulables du quotidien (Alimentation, Carburant, Sorties, Habillement...)
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-600">
            {formatCurrency(variableCategories.reduce((s, c) => s + c.spent, 0))} / {formatCurrency(variableCategories.reduce((s, c) => s + c.allocated, 0))}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {variableCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Section 2: Charges Fixes Incompressibles */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              2. Charges Fixes Incompressibles
            </h3>
            <p className="text-2xs text-slate-500">
              Obligations contractuelles régulières (Logement, Assurances, Énergie, Scolarité...)
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-600">
            {formatCurrency(fixedCategories.reduce((s, c) => s + c.spent, 0))} / {formatCurrency(fixedCategories.reduce((s, c) => s + c.allocated, 0))}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fixedCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Section 3: Ponctuel & Imprévus */}
      {punctualCategories.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. Ponctuel & Imprévus
              </h3>
              <p className="text-2xs text-slate-500">
                Dépenses exceptionnelles du mois (Entretien véhicule, Cadeaux, Remplacement matériel...)
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600">
              {formatCurrency(punctualCategories.reduce((s, c) => s + c.spent, 0))} / {formatCurrency(punctualCategories.reduce((s, c) => s + c.allocated, 0))}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {punctualCategories.map(renderCategoryCard)}
          </div>
        </div>
      )}

      {/* Section 4: Épargne & Projets */}
      {savingCategories.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                4. Épargne & Tirelires Mensuelles
              </h3>
              <p className="text-2xs text-slate-500">
                Versements programmés vers les comptes d'épargne et projets futurs
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-600">
              {formatCurrency(savingCategories.reduce((s, c) => s + c.spent, 0))} / {formatCurrency(savingCategories.reduce((s, c) => s + c.allocated, 0))}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingCategories.map(renderCategoryCard)}
          </div>
        </div>
      )}

      {/* MODAL: Modifier / Renommer une charge spécifique */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Modifier la charge
              </h4>
              <button
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nom du poste / de la charge *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ex: Crédit Maison, Courses Leclerc, Mutuelle..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  autoFocus
                />
                <p className="text-2xs text-slate-500 mt-1">
                  Si vous renommez cette charge, toutes les opérations associées seront automatiquement synchronisées avec ce nouveau nom.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Plafond alloué mensuel ({familyConfig.currencySymbol || 'Ar'})
                </label>
                <input
                  type="text"
                  value={editAllocated}
                  onChange={(e) => setEditAllocated(e.target.value)}
                  placeholder="ex: 200000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nature de la charge
                </label>
                <select
                  value={editNature}
                  onChange={(e) => setEditNature(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                >
                  <option value="fixed">Charge fixe mensuelle (incompressible)</option>
                  <option value="variable">Dépense courante (variable)</option>
                  <option value="punctual">Ponctuelle / Imprévu</option>
                  <option value="saving">Épargne & Projet</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(editingTarget.category)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer cette charge
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-teal-800 text-white font-semibold hover:bg-teal-900 transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestion globale & renommage de toutes les charges */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-xl space-y-4 text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Renommer & Personnaliser vos Charges
                </h4>
                <p className="text-2xs text-slate-500 mt-0.5">
                  Adaptez librement les intitulés de charges selon les contrats et habitudes de votre foyer
                </p>
              </div>
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 pr-1">
              {familyConfig.categoryBudgets.map((cat) => (
                <div key={cat.category} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 block truncate">
                      {cat.category}
                    </span>
                    <span className="text-2xs text-slate-400">
                      {cat.nature === 'fixed'
                        ? 'Charge fixe'
                        : cat.nature === 'variable'
                        ? 'Dépense courante'
                        : cat.nature === 'saving'
                        ? 'Épargne'
                        : 'Imprévu'} · Plafond : {formatCurrency(cat.allocated)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsManageModalOpen(false);
                        handleOpenEdit(cat);
                      }}
                      className="px-2.5 py-1 text-2xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Renommer
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.category)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Supprimer la charge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsManageModalOpen(false)}
                className="px-4 py-2 bg-teal-800 text-white rounded-lg font-semibold hover:bg-teal-900 text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
