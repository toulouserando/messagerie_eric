import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

// Exportation nécessaire pour être importée dans App.tsx
export interface AdvancedFilters {
  objet: string;
  message: string;
  destinataire: string;
  expediteur: string;
  dateDebut: string;
  dateFin: string;
}

interface SearchBarProps {
  onSearch: (searchTerm: string, filters: AdvancedFilters) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({
    objet: '',
    message: '',
    destinataire: '',
    expediteur: '',
    dateDebut: '',
    dateFin: '',
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch(value, filters);
  };

  const handleFilterChange = (key: keyof AdvancedFilters, value: string) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onSearch(searchTerm, updatedFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      objet: '',
      message: '',
      destinataire: '',
      expediteur: '',
      dateDebut: '',
      dateFin: '',
    };
    setSearchTerm('');
    setFilters(emptyFilters);
    onSearch('', emptyFilters);
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 p-4 space-y-3">
      {/* Barre de recherche principale */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher dans tous les messages..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bouton pour ouvrir/fermer la recherche avancée */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-all cursor-pointer ${
            showAdvanced || Object.values(filters).some(Boolean)
              ? 'bg-blue-50 border-blue-200 text-blue-600'
              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filtres</span>
        </button>
      </div>

      {/* Panneau de recherche avancée */}
      {showAdvanced && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-left space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
              Recherche avancée par champ
            </span>
            <button
              onClick={resetFilters}
              className="text-[11px] text-red-600 hover:underline cursor-pointer font-medium"
            >
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Objet / Titre
              </label>
              <input
                type="text"
                value={filters.objet}
                onChange={(e) => handleFilterChange('objet', e.target.value)}
                placeholder="Ex: Facture..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Corps du message
              </label>
              <input
                type="text"
                value={filters.message}
                onChange={(e) => handleFilterChange('message', e.target.value)}
                placeholder="Contient le mot..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Expéditeur (De)
              </label>
              <input
                type="text"
                value={filters.expediteur}
                onChange={(e) => handleFilterChange('expediteur', e.target.value)}
                placeholder="Ex: Jean..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Destinataire (À)
              </label>
              <input
                type="text"
                value={filters.destinataire}
                onChange={(e) => handleFilterChange('destinataire', e.target.value)}
                placeholder="Ex: Sophie..."
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Après le (Date min)
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Avant le (Date max)
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500 text-gray-700"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}