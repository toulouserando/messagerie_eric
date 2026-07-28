import { useState } from 'react';
import { Message } from '../types';
import { 
  FileText, Trash2, Reply, Forward, Eye, EyeOff, Search, 
  Tag, Calendar, User, Printer, Download 
} from 'lucide-react';

interface KeywordPagesViewProps {
  messages: Message[];
  activeKeyword: string;
  onSelectKeyword: (keyword: string) => void;
  onDeleteMessage: (id: string) => void;
  onReplyMessage: (message: Message) => void;
  onForwardMessage: (message: Message) => void;
  onToggleHideMessage: (id: string, currentStatus: boolean) => void;
}

const KEYWORDS = [
  'Tous', 'Home', 'Office', 'Sherpa', 'Appli', 'date', 
  'visiteur', 'soir', 'validité', 'achat', 'recup', 'resto', 'rando'
];

export default function KeywordPagesView({
  messages,
  activeKeyword,
  onSelectKeyword,
  onDeleteMessage,
  onReplyMessage,
  onForwardMessage,
  onToggleHideMessage,
}: KeywordPagesViewProps) {
  const [searchFilter, setSearchFilter] = useState('');

  // Fonction pour télécharger localement un e-mail au format TXT sur votre disque dur
  const handleDownloadMessage = (msg: Message) => {
    const content = `==================================================
De         : ${msg.expediteur || 'Inconnu'}
À          : ${msg.destinataire || 'Inconnu'}
Date       : ${new Date(msg.date).toLocaleString('fr-FR')}
Dossier    : ${msg.dossier}
Objet      : ${msg.objet || '(Sans objet)'}
==================================================

${msg.message}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Génération d'un nom de fichier propre à partir de l'objet du message
    const safeSubject = (msg.objet || 'message').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeSubject}_${msg.id}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtrage des messages selon le mot-clé actif
  const getMessagesForKeyword = (keyword: string) => {
    const kwLower = keyword.toLowerCase();

    return messages.filter((msg) => {
      if (kwLower === 'tous') {
        return !msg.masque;
      }

      const isSameFolder = msg.dossier?.toLowerCase() === kwLower;
      const textMatch = `${msg.objet} ${msg.message}`.toLowerCase().includes(kwLower);

      return (isSameFolder || textMatch) && !msg.masque;
    });
  };

  const currentMessages = getMessagesForKeyword(activeKeyword).filter((msg) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      msg.objet?.toLowerCase().includes(q) ||
      msg.message?.toLowerCase().includes(q) ||
      msg.expediteur?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100/70 overflow-hidden text-left">
      {/* Navigation par mots-clés / sous-dossiers */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 overflow-x-auto flex items-center gap-2 shadow-xs">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono mr-2 shrink-0">
          Documents / Thèmes :
        </span>
        {KEYWORDS.map((keyword) => {
          const count = getMessagesForKeyword(keyword).length;
          const isActive = activeKeyword.toLowerCase() === keyword.toLowerCase();
          return (
            <button
              key={keyword}
              onClick={() => onSelectKeyword(keyword.toLowerCase())}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{keyword}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Zone de travail - Format Document / Page */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[85vh] overflow-hidden">
          
          {/* En-tête de la Page */}
          <div className="p-6 sm:p-8 border-b border-gray-200 bg-linear-to-b from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Vue Page / Document
                    </span>
                    <span className="text-xs text-gray-400">
                      {currentMessages.length} message(s)
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-gray-900 mt-0.5 capitalize">
                    Dossier : {activeKeyword}
                  </h1>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer / PDF</span>
              </button>
            </div>

            {/* Recherche interne à la page */}
            <div className="relative w-full sm:w-72 mt-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={`Filtrer dans la page ${activeKeyword}...`}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Contenu continu du document */}
          <div className="p-6 sm:p-10 flex-1 space-y-8">
            {currentMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 stroke-[1.2] text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Aucun contenu disponible pour "{activeKeyword}"</p>
              </div>
            ) : (
              currentMessages.map((msg, index) => (
                <article
                  key={msg.id}
                  className={`pb-8 border-b border-gray-100 last:border-b-0 last:pb-0 ${
                    msg.masque ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="font-bold font-mono text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                        #{index + 1}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-blue-600">
                        <User className="w-3 h-3 text-blue-500" />
                        {msg.expediteur || 'Inconnu'}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(msg.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* BOUTON TÉLÉCHARGER SUR LE DISQUE DUR */}
                      <button
                        onClick={() => handleDownloadMessage(msg)}
                        title="Télécharger sur le disque dur"
                        className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onReplyMessage(msg)}
                        title="Répondre"
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onForwardMessage(msg)}
                        title="Transférer"
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Forward className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleHideMessage(msg.id, !!msg.masque)}
                        title={msg.masque ? 'Réafficher' : 'Masquer'}
                        className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-white rounded cursor-pointer"
                      >
                        {msg.masque ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Supprimer"
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-gray-900 mb-2">
                    {msg.objet || '(Sans objet)'}
                  </h2>

                  <div className="text-sm text-gray-800 leading-relaxed font-sans whitespace-pre-wrap pl-3 border-l-2 border-blue-400 my-2">
                    {msg.message}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}