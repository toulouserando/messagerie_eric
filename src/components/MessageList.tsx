import { useState } from 'react';
import { Message } from '../types';
import { Search, Mail, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageListProps {
  messages: Message[];
  selectedFolderId: string;
  selectedMessageId: string | null;
  onSelectMessage: (message: Message) => void;
  onDeleteMessage: (id: string) => void;
}

export default function MessageList({
  messages,
  selectedFolderId,
  selectedMessageId,
  onSelectMessage,
  onDeleteMessage,
}: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter by folder
  const folderFiltered = messages.filter((msg) => {
    if (selectedFolderId === 'tous') return true;
    return msg.dossier.toLowerCase() === selectedFolderId;
  });

  // 2. Filter by search query
  const finalFiltered = folderFiltered.filter((msg) => {
    const query = searchQuery.toLowerCase();
    return (
      msg.objet.toLowerCase().includes(query) ||
      msg.destinataire.toLowerCase().includes(query) ||
      msg.message.toLowerCase().includes(query)
    );
  });

  // Date Formatter Helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="message-list-container" className="w-96 border-r border-gray-200 bg-gray-50/30 flex flex-col h-full shrink-0">
      {/* Search Header */}
      <div className="p-4 bg-white border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 stroke-[1.75]" />
          <input
            id="search-messages-input"
            type="text"
            placeholder="Rechercher un message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {finalFiltered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 stroke-[1.5]" />
            </div>
            <p className="text-sm font-medium text-gray-900">Aucun message</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery ? 'Aucun résultat pour cette recherche.' : 'Ce dossier est actuellement vide.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {finalFiltered.map((msg) => {
              const isSelected = selectedMessageId === msg.id;
              
              return (
                <motion.div
                  id={`message-card-${msg.id}`}
                  key={msg.id}
                  layoutId={`msg-card-layout-${msg.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onSelectMessage(msg)}
                  className={`group relative p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600/10 shadow-md shadow-blue-100/30'
                      : 'bg-white hover:bg-gray-50 border-gray-200 shadow-xs'
                  }`}
                >
                  {/* Top line: Destinataire & Time */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      À : {msg.destinataire}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 font-mono">
                      {formatDate(msg.date)}
                    </span>
                  </div>

                  {/* Subject line */}
                  <h4 className={`text-sm font-bold text-gray-800 line-clamp-1 mb-2 ${isSelected ? 'text-blue-900' : ''}`}>
                    {msg.objet || '(Sans objet)'}
                  </h4>

                  {/* Body preview */}
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {msg.message}
                  </p>

                  {/* Badge & Action Bar */}
                  <div className="flex items-center justify-between">
                    {/* Folder Badge */}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wide uppercase ${
                      msg.dossier === 'Sherpa'
                        ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                        : msg.dossier === 'Divers'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                        : 'bg-purple-50 text-purple-700 border border-purple-100/50'
                    }`}>
                      {msg.dossier}
                    </span>

                    {/* Delete button (only visible on hover or if selected) */}
                    <button
                      id={`btn-delete-${msg.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMessage(msg.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Supprimer le message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
