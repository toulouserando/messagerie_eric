import { useState } from 'react';
import { Message } from '../types';
import { 
  FileText, Trash2, Reply, Forward, Eye, EyeOff, Search, 
  Tag, Calendar, User, Printer, Download, FileCode 
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

  // Télécharger un seul message au format .txt
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
    
    const safeSubject = (msg.objet || 'message').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeSubject}_${msg.id}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export TXT de l'ensemble de la page
  const handleExportPageAsTxt = () => {
    let content = `==================================================\n`;
    content += ` EXPORT DOSSIER / THÈME : ${activeKeyword.toUpperCase()}\n`;
    content += ` NOMBRE DE MESSAGES     : ${currentMessages.length}\n`;
    content += ` DATE DE GÉNÉRATION     : ${new Date().toLocaleString('fr-FR')}\n`;
    content += `==================================================\n\n`;

    currentMessages.forEach((msg, idx) => {
      content += `--------------------------------------------------\n`;
      content += `#${idx + 1} | Objet : ${msg.objet || '(Sans objet)'}\n`;
      content += `De     : ${msg.expediteur || 'Inconnu'}\n`;
      content += `Date   : ${new Date(msg.date).toLocaleString('fr-FR')}\n`;
      content += `--------------------------------------------------\n`;
      content += `${msg.message}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `dossier_${activeKeyword.toLowerCase()}_${Date.now()}.txt`;
    
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
    <div className="flex-1 flex flex-col h-full bg-gray-100/70 overflow-hidden text-left print:bg-white print:overflow-visible">
      {/* Navigation par mots-clés - Masqué à l'impression */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 shrink-0 overflow-x-auto flex items-center gap-2 shadow-xs print:hidden">
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

      {/* Zone de travail */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center print:p-0 print:overflow-visible">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[85vh] overflow-hidden print:border-none print:shadow-none">
          
          {/* En-tête de la Page */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-linear-to-b from-gray-50 to-white print:p-2 print:border-b-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 print:hidden">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-100 print:hidden">
                      Vue Page / Document
                    </span>
                    <span className="text-xs text-gray-400">
                      {currentMessages.length} message(s)
                    </span>
                  </div>
                  <h1 className="text-xl font-black text-gray-900 mt-0.5 capitalize print:text-lg">
                    Dossier : {activeKeyword}
                  </h1>
                </div>
              </div>

              {/* BOUTONS D'IMPRESSION ET D'EXPORTATION */}
              <div className="flex items-center gap-2 flex-wrap print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Sélectionner une imprimante (USB, Wi-Fi, Réseau)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  title="Générer au format PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleExportPageAsTxt}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  title="Télécharger la page complète en fichier .txt"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>TXT</span>
                </button>
              </div>
            </div>

            {/* Recherche interne */}
            <div className="relative w-full sm:w-72 mt-2 print:hidden">
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

          {/* CONTENU - INTERLIGNES ET MARGES RÉDUITES */}
          <div className="p-4 sm:p-6 flex-1 space-y-3 print:p-2 print:space-y-2">
            {currentMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 stroke-[1.2] text-gray-300" />
                <p className="text-xs font-medium text-gray-600">Aucun contenu disponible pour "{activeKeyword}"</p>
              </div>
            ) : (
              currentMessages.map((msg, index) => (
                <article
                  key={msg.id}
                  className={`pb-3 border-b border-gray-100 last:border-b-0 last:pb-0 print:pb-2 print:border-gray-200 ${
                    msg.masque ? 'opacity-50' : ''
                  }`}
                >
                  {/* Cartouche d'en-tête du message */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5 bg-gray-50/80 p-2 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0">
                    <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                      <span className="font-bold font-mono text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200 text-[11px] print:border-none">
                        #{index + 1}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-blue-600 print:text-black">
                        <User className="w-3 h-3 text-blue-500 print:hidden" />
                        {msg.expediteur || 'Inconnu'}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                        <Calendar className="w-3 h-3 print:hidden" />
                        {new Date(msg.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Actions sur chaque message */}
                    <div className="flex items-center gap-1 print:hidden">
                      <button
                        onClick={() => handleDownloadMessage(msg)}
                        title="Télécharger ce message (.txt)"
                        className="p-1 text-gray-600 hover:text-green-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onReplyMessage(msg)}
                        title="Répondre"
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onForwardMessage(msg)}
                        title="Transférer"
                        className="p-1 text-gray-600 hover:text-blue-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Forward className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleHideMessage(msg.id, !!msg.masque)}
                        title={msg.masque ? 'Réafficher' : 'Masquer'}
                        className="p-1 text-gray-600 hover:text-amber-600 hover:bg-white rounded cursor-pointer"
                      >
                        {msg.masque ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onDeleteMessage(msg.id)}
                        title="Supprimer"
                        className="p-1 text-gray-600 hover:text-red-600 hover:bg-white rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Objet du message */}
                  <h2 className="text-sm font-bold text-gray-900 mb-1 print:text-xs">
                    {msg.objet || '(Sans objet)'}
                  </h2>

                  {/* Corps du message */}
                  <div className="text-xs text-gray-800 leading-snug font-sans whitespace-pre-wrap pl-2.5 border-l-2 border-blue-400 my-1 print:border-l print:text-[11px]">
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