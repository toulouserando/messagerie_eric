import { Message } from '../types';
import { Mail, Calendar, User, Folder, Trash2, ShieldCheck, Reply } from 'lucide-react';

interface MessageDetailProps {
  message: Message | null;
  onDeleteMessage: (id: string) => void;
  onReplyMessage?: (message: Message) => void;
}

export default function MessageDetail({ message, onDeleteMessage, onReplyMessage }: MessageDetailProps) {
  if (!message) {
    return (
      <div id="no-message-selected-pane" className="flex-1 bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-gray-300 rounded-2xl flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 stroke-[1.25]" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">Aucun message sélectionné</h3>
        <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
          Choisissez un message dans la liste de gauche pour lire son contenu détaillé ou gérer son dossier.
        </p>
      </div>
    );
  }

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleDelete = () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce message ?')) {
      onDeleteMessage(message.id);
    }
  };

  return (
    <div id="message-detail-pane" className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      {/* Top action bar */}
      <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/40">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${
            message.dossier === 'Sherpa'
              ? 'bg-blue-50 text-blue-700 border-blue-200/60'
              : message.dossier === 'Divers'
              ? 'bg-amber-50 text-amber-700 border-amber-200/60'
              : 'bg-purple-50 text-purple-700 border-purple-200/60'
          }`}>
            <Folder className="w-3.5 h-3.5 stroke-[2]" />
            Dossier : {message.dossier}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-md text-[10px] font-mono uppercase font-bold">
            <ShieldCheck className="w-3 h-3" />
            Classifié
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onReplyMessage && (
            <button
              id="btn-reply-detail"
              onClick={() => onReplyMessage(message)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Répondre</span>
            </button>
          )}

          <button
            id="btn-delete-detail"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>
        </div>
      </div>

      {/* Message content view */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-10">
        {/* Subject Header */}
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-950 leading-tight">
            {message.objet || '(Sans objet)'}
          </h1>
        </div>

        {/* Envelope Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 border border-gray-200 p-5 rounded-xl mb-8">
          {/* Expéditeur */}
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Expéditeur (De)
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-500 rounded-md flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{message.expediteur || 'Inconnu'}</span>
            </div>
          </div>

          {/* Destinataire */}
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Destinataire (À)
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-500 rounded-md flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{message.destinataire}</span>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Date d'envoi
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-400 rounded-md flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="truncate font-medium">{formatDateString(message.date)}</span>
            </div>
          </div>
        </div>

        {/* Message body */}
        <div className="text-left">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono mb-4">
            Corps du message
          </span>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
              {message.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}