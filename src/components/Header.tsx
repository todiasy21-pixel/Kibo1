import React from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Printer,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { FamilyConfig } from '../types/budget';
import { formatMonthYear } from '../utils/formatters';

interface HeaderProps {
  activeTab: 'dashboard' | 'transactions' | 'envelopes' | 'family' | 'savings' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'envelopes' | 'family' | 'savings' | 'analytics') => void;
  currentMonth: string;
  onChangeMonth: (delta: number) => void;
  onSetCurrentMonth: () => void;
  onOpenNewTxModal: () => void;
  onOpenExportModal: () => void;
  familyConfig: FamilyConfig;
  onUpdateFamilyName?: (newName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentMonth,
  onChangeMonth,
  onSetCurrentMonth,
  onOpenNewTxModal,
  onOpenExportModal,
  familyConfig,
  onUpdateFamilyName,
}) => {
  const [isEditingFamilyName, setIsEditingFamilyName] = React.useState(false);
  const [tempFamilyName, setTempFamilyName] = React.useState(familyConfig.familyName);

  React.useEffect(() => {
    setTempFamilyName(familyConfig.familyName);
  }, [familyConfig.familyName]);

  const handleSaveFamilyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempFamilyName.trim() && onUpdateFamilyName) {
      onUpdateFamilyName(tempFamilyName.trim());
    }
    setIsEditingFamilyName(false);
  };
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Single Brand Mark Text & Family Name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-lg tracking-tight shadow-sm">
                NB
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-800 transition-colors">
                NidBudget
              </span>
            </button>

            {isEditingFamilyName ? (
              <form onSubmit={handleSaveFamilyName} className="flex items-center gap-1.5 ml-1">
                <input
                  type="text"
                  value={tempFamilyName}
                  onChange={(e) => setTempFamilyName(e.target.value)}
                  placeholder="Nom de famille"
                  className="px-2 py-0.5 text-xs rounded border border-teal-600 bg-white font-medium text-slate-800 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 text-2xs bg-teal-800 text-white rounded font-medium hover:bg-teal-900"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingFamilyName(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 ml-1 text-xs text-slate-500">
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">{familyConfig.familyName}</span>
                <button
                  onClick={() => setIsEditingFamilyName(true)}
                  className="p-1 text-slate-400 hover:text-teal-800 hover:bg-slate-100 rounded transition-colors"
                  title="Renommer le foyer / la famille"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Zone 2: Navigation Links (Text with active indicators) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Tableau de bord
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Opérations
            </button>
            <button
              onClick={() => setActiveTab('envelopes')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'envelopes'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Enveloppes
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'family'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Foyer & Répartition
            </button>
            <button
              onClick={() => setActiveTab('savings')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'savings'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Épargne & Projets
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'text-teal-900 bg-teal-50/80 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Analyses
            </button>
          </nav>

          {/* Zone 3: Actions & Month Selector */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Month Switcher Control */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200/80">
              <button
                onClick={() => onChangeMonth(-1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={onSetCurrentMonth}
                className="px-2.5 py-1 text-xs font-semibold text-slate-800 hover:text-teal-900 whitespace-nowrap flex items-center gap-1.5"
                title="Cliquer pour revenir au mois en cours"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{formatMonthYear(currentMonth)}</span>
              </button>

              <button
                onClick={() => onChangeMonth(1)}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tool / Export Menu Button */}
            <button
              onClick={onOpenExportModal}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors"
              title="Données, Sauvegarde & Impression"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Primary Action: New Transaction */}
            <button
              onClick={onOpenNewTxModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle</span> opération
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'dashboard' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'transactions' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Opérations
          </button>
          <button
            onClick={() => setActiveTab('envelopes')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'envelopes' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Enveloppes
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'family' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Foyer & Répartition
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'savings' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Épargne
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md shrink-0 font-medium ${
              activeTab === 'analytics' ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-slate-600'
            }`}
          >
            Analyses
          </button>
        </div>

      </div>
    </header>
  );
};
