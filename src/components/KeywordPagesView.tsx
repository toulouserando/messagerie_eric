import { useState } from 'react';
import { Message } from '../types';
import { Folder, Trash2, Reply, Forward, Eye, EyeOff, Search } from 'lucide-react';

interface KeywordPagesViewProps {
  messages: Message[];
  onDeleteMessage: (id: string) => void;
  onReplyMessage: (message: Message) => void;
  onForwardMessage: (message: Message) => void;
  onToggleHideMessage: (id: string, currentStatus: boolean) => void;
}

const KEYWORDS = [
  'Home', 'Office', 'Sherpa', 'Appli', 'date', 
  'visiteur', 'soir', 'validité', 'achat', 'recup', 'resto', 'rando'
];

export default function KeywordPagesView({
  messages,
  onDeleteMessage,
  onReplyMessage,
  onForwardMessage,
  onToggleHideMessage,
}: KeywordPagesViewProps) {
  const [activeKeyword, setActiveKeyword] = useState<string>(KEYWORDS[0]);
  const [searchFilter, setSearchFilter] = useState('');

  // Fonction pour détecter si un message est associé au mot-clé
  // (Vérifie si l'objet ou le message commence par ou contient le mot-clé)
  const getMessagesForKeyword = (keyword: string) => {
    return messages.filter((msg) => {
      if (msg.masque) return false; // Optionnel : masque les archivés
      const textToCheck = `${msg.objet} ${msg.message}`.toLowerCase();
      return textToCheck.includes(keyword.toLowerCase());
    });
  };

  const currentMessages = getMessagesForKeyword(activeKeyword).filter((msg) => {
    if (!searchFilter) return true;
    const query = searchFilter.toLowerCase();
    return (
      msg.objet?.toLowerCase().includes(query) ||
      msg.message?.toLowerCase().includes(query) ||
      msg.expediteur?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50/50 overflow-hidden text-left">
      {/* Barre des onglets de mots-clés */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 overflow-x-auto flex items-center gap-2 shadow-xs">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono mr-2 shrink-0">
          Pages :
        </span>
        {KEYWORDS.map((keyword) => {
          const count = getMessagesForKeyword(keyword).length;
          const isActive = activeKeyword === keyword;
          return (
            <button
              key={keyword}
              onClick={() => setActiveKeyword(keyword)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{keyword}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* En-tête de la page active et recherche interne */}
      <div className="px-8 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Page : {activeKeyword}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Messages triés automatiquement contenant ou débutant par « {activeKeyword} »
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={`Filtrer dans ${activeKeyword}...`}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Liste des messages de la page active */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-4">
        {currentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white rounded-2xl border border-gray-200 p-8">
            <Folder className="w-10 h-10 text-gray-300 mb-3 stroke-[1.5]" />
            <p className="text-sm font-semibold text-gray-700">Aucun message pour la page "{activeKeyword}"</p>
            <p className="text-xs text-gray-400 mt-1">
              Aucun message ne correspond à ce mot-clé pour le moment.
            </p>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {msg.expediteur || 'Inconnu'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Boutons d'actions rapides sur la carte */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onReplyMessage(msg)}
                    title="Répondre"
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs transition-all cursor-pointer"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onForwardMessage(msg)}
                    title="Transférer"
                    className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md text-xs transition-all cursor-pointer"
                  >
                    <Forward className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleHideMessage(msg.id, !!msg.masque)}
                    title={msg.masque ? "Réafficher" : "Masquer"}
                    className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md text-xs transition-all cursor-pointer"
                  >
                    {msg.masque ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    title="Supprimer"
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {msg.objet || '(Sans objet)'}
                </h3>
                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-sans bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}