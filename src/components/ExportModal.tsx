import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { FamilyConfig, Transaction } from '../types/budget';
import { formatMonthYear } from '../utils/formatters';
import { exportBackupJSON, exportToCSV } from '../utils/storage';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  familyConfig: FamilyConfig;
  transactions: Transaction[];
  onImportData: (config: FamilyConfig, transactions: Transaction[]) => void;
  onResetData: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  familyConfig,
  transactions,
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportMonthCSV = () => {
    exportToCSV(transactions, familyConfig, currentMonth);
  };

  const handleExportAllCSV = () => {
    exportToCSV(transactions, familyConfig);
  };

  const handleExportJSON = () => {
    exportBackupJSON(familyConfig, transactions);
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.config || !parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error('Le fichier sélectionné n’est pas une sauvegarde valide NidBudget.');
        }

        onImportData(parsed.config, parsed.transactions);
        setImportError(null);
        alert('Sauvegarde restaurée avec succès !');
        onClose();
      } catch (err: any) {
        setImportError(err.message || 'Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-5 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Données, Export & Sauvegarde
            </h3>
            <p className="text-2xs text-slate-500 mt-0.5">
              Gérez les données de la {familyConfig.familyName} en toute liberté et confidentialité locale
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          
          {/* CSV Export Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Export Tableur (Excel / CSV)</h4>
                <p className="text-2xs text-slate-500">
                  Export universel compatible Microsoft Excel, Apple Numbers et Google Sheets
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={handleExportMonthCSV}
                className="px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium text-2xs transition-colors"
              >
                Mois en cours ({formatMonthYear(currentMonth)})
              </button>
              <button
                onClick={handleExportAllCSV}
                className="px-3 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-2xs transition-colors"
              >
                Historique complet
              </button>
            </div>
          </div>

          {/* JSON Backup Export Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Sauvegarde complète (JSON)</h4>
                <p className="text-2xs text-slate-500">
                  Télécharge l'intégralité de vos comptes, membres et objectifs
                </p>
              </div>
            </div>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900 text-2xs shrink-0 transition-colors"
            >
              Télécharger
            </button>
          </div>

          {/* JSON Restore Import Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Restaurer une sauvegarde</h4>
                <p className="text-2xs text-slate-500">
                  Importez un fichier JSON NidBudget précédemment exporté
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={handleTriggerFileInput}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-2xs shrink-0 transition-colors"
            >
              Parcourir...
            </button>
          </div>

          {importError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-2xs">
              {importError}
            </div>
          )}

          {/* Print Report Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Imprimer le bilan mensuel</h4>
                <p className="text-2xs text-slate-500">
                  Mise en page optimisée pour impression papier ou export PDF
                </p>
              </div>
            </div>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-medium text-2xs shrink-0 transition-colors"
            >
              Imprimer
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-2xs text-slate-500">
              Données de test altérées ?
            </span>
            <button
              onClick={() => {
                if (confirm('Voulez-vous réinitialiser toutes les données avec la configuration de démonstration (Famille Martin avec 2 enfants) ?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="text-2xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser avec exemple type
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
