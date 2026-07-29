import { useState, useEffect } from 'react';
import { Message } from '../types';
import { 
  Mail, Calendar, User, Folder, Trash2, ShieldCheck, 
  Reply, Forward, Eye, EyeOff, Copy, Check, AlertTriangle, RotateCcw, Download, Printer,
  MailOpen, MailCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';

interface MessageDetailProps {
  message: Message | null;
  onDeleteMessage: (id: string) => void;
  onRestoreMessage?: (id: string) => void;
  onReplyMessage?: (message: Message) => void;
  onForwardMessage?: (message: Message) => void;
  onToggleHideMessage?: (id: string, currentStatus: boolean) => void;
  onToggleReadMessage?: (id: string, currentReadStatus: boolean) => void;
}

export default function MessageDetail({
  message,
  onDeleteMessage,
  onRestoreMessage,
  onReplyMessage,
  onForwardMessage,
  onToggleHideMessage,
  onToggleReadMessage,
}: MessageDetailProps) {
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [message?.id]);

  if (!message) {
    return (
      <div id="no-message-selected-pane" className="flex-1 bg-white flex flex-col items-center justify-center p-8 text-center print:hidden">
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

  const handleConfirmDelete = () => {
    onDeleteMessage(message.id);
    setShowDeleteConfirm(false);
  };

  const handleCopyText = () => {
    const textToCopy = message.message || message.messageHtml?.replace(/<[^>]*>?/gm, '') || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMessage = () => {
    const content = `==================================================
EXPÉDITEUR   : ${message.expediteur || 'Inconnu'}
DESTINATAIRE : ${message.destinataire || 'Inconnu'}
DATE         : ${formatDateString(message.date)}
DOSSIER      : ${message.dossier || 'Général'}
OBJET        : ${message.objet || '(Sans objet)'}
==================================================

${message.message || message.messageHtml?.replace(/<[^>]*>?/gm, '') || ''}
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeSubject = (message.objet || 'message').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeSubject}_${message.id}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sanitizedHtml = message.messageHtml ? DOMPurify.sanitize(message.messageHtml) : null;

  return (
    <div id="message-detail-pane" className="flex-1 bg-white flex flex-col h-full overflow-hidden relative print:overflow-visible">
      {/* BARRE D'ACTION SUPÉRIEURE - Masquée à l'impression */}
      <div className="px-8 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/40 print:hidden">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border ${
              message.dossier === 'Sherpa'
                ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                : message.dossier === 'Divers'
                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                : 'bg-purple-50 text-purple-700 border-purple-200/60'
            }`}
          >
            <Folder className="w-3.5 h-3.5 stroke-[2]" />
            Dossier : {message.dossier}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-emerald-700 bg-emerald-50 border border-emerald-200/50 rounded-md text-[10px] font-mono uppercase font-bold">
            <ShieldCheck className="w-3 h-3" />
            Classifié
          </span>
        </div>

        {/* BOUTONS D'ACTIONS */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            title="Imprimer uniquement ce message sur votre imprimante"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer</span>
          </button>

          {message.is_deleted ? (
            <>
              {onRestoreMessage && (
                <button
                  id="btn-restore-detail"
                  onClick={() => onRestoreMessage(message.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restauration</span>
                </button>
              )}
            </>
          ) : (
            <>
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

              {onForwardMessage && (
                <button
                  id="btn-forward-detail"
                  onClick={() => onForwardMessage(message)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5" />
                  <span>Transférer</span>
                </button>
              )}

              <button
                id="btn-download-detail"
                onClick={handleDownloadMessage}
                title="Télécharger l'e-mail sur votre disque dur"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>

              {/* BOUTON MARQUER COMME LU / NON LU */}
              {onToggleReadMessage && (
                <button
                  id="btn-toggle-read-detail"
                  onClick={() => onToggleReadMessage(message.id, !!message.is_read)}
                  title={message.is_read ? 'Marquer le message comme non lu' : 'Marquer le message comme lu'}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  {message.is_read ? (
                    <>
                      <Mail className="w-3.5 h-3.5 text-amber-600" />
                      <span>Marquer non lu</span>
                    </>
                  ) : (
                    <>
                      <MailOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Marquer lu</span>
                    </>
                  )}
                </button>
              )}

              {onToggleHideMessage && (
                <button
                  id="btn-hide-detail"
                  onClick={() => onToggleHideMessage(message.id, !!message.masque)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  {message.masque ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Réafficher</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                      <span>Masquer</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}

          <button
            id="btn-delete-detail"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{message.is_deleted ? 'Supprimer définitivement' : 'Supprimer'}</span>
          </button>
        </div>
      </div>

      {/* DÉTAILS DU CONTENU */}
      <div className="flex-1 overflow-y-auto p-8 lg:p-10 print:p-0 print:overflow-visible">
        <div className="mb-8 border-b border-gray-100 pb-6 print:mb-4 print:pb-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-950 leading-tight print:text-lg">
            {message.objet || '(Sans objet)'}
          </h1>
        </div>

        {/* MÉTADONNÉES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/50 border border-gray-200 p-5 rounded-xl mb-8 print:p-3 print:mb-4 print:bg-transparent">
          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Expéditeur (De)
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-500 rounded-md flex items-center justify-center shrink-0 print:hidden">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{message.expediteur || 'Inconnu'}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Destinataire (À)
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-500 rounded-md flex items-center justify-center shrink-0 print:hidden">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="truncate">{message.destinataire}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Date d'envoi
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-6 h-6 bg-white border border-gray-200 text-gray-400 rounded-md flex items-center justify-center shrink-0 print:hidden">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="truncate font-medium">{formatDateString(message.date)}</span>
            </div>
          </div>
        </div>

        {/* CORPS DU MESSAGE */}
        <div className="text-left">
          <div className="flex items-center justify-between mb-4 print:mb-2">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
              Corps du message
            </span>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 font-medium cursor-pointer print:hidden"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs print:border-none print:p-0 print:shadow-none">
            {sanitizedHtml ? (
              <div
                className="prose max-w-none text-sm text-gray-800 font-sans print:text-xs overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans print:text-xs">
                {message.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POP-UP DE CONFIRMATION DE SUPPRESSION */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-1">
                {message.is_deleted ? 'Supprimer définitivement ?' : 'Placer dans la corbeille ?'}
              </h3>
              <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                {message.is_deleted
                  ? 'Cette action supprimera définitivement ce message. L\'opération est irréversible.'
                  : 'Le message sera déplacé vers la corbeille. Vous pourrez le restaurer ultérieurement.'}
              </p>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}