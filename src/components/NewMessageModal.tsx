import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Send, User, Tag } from 'lucide-react';
import { Message } from '../types';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (messageData: Omit<Message, 'id' | 'date' | 'expediteur'>) => void;
}

export default function NewMessageModal({ isOpen, onClose, onSendMessage }: NewMessageModalProps) {
  const MY_EMAIL = 'ericgalaxy5@free.fr';

  const [destinataire, setDestinataire] = useState('');
  const [objet, setObjet] = useState('');
  const [message, setMessage] = useState('');
  const [computedFolder, setComputedFolder] = useState('Divers');

  // Extrait le premier mot de l'objet pour en faire le nom du dossier
  const extractFolder = (subject: string): string => {
    const trimmed = subject.trim();
    if (!trimmed) return 'Divers';
    
    const firstWord = trimmed.split(/\s+/)[0];
    const cleaned = firstWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
    
    if (!cleaned) return 'Divers';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  useEffect(() => {
    setComputedFolder(extractFolder(objet));
  }, [objet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSendMessage({
      destinataire: destinataire.trim(),
      objet: objet.trim(),
      message: message.trim(),
      dossier: computedFolder,
    });

    // Reset des champs
    setDestinataire('');
    setObjet('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div id="compose-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        id="compose-modal-card"
        className="w-full max-w-lg bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-800">Rédiger un message</h3>
          </div>
          <button
            id="btn-close-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Destinataire */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="input-destinataire" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
                Destinataire
              </label>
              
              {/* Bouton raccourci pour s'envoyer à soi-même */}
              <button
                type="button"
                onClick={() => setDestinataire(MY_EMAIL)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                + M'écrire à moi-même
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4 stroke-[1.75]" />
              </div>
              <input
                id="input-destinataire"
                type="email"
                required
                list="contacts-list"
                value={destinataire}
                onChange={(e) => setDestinataire(e.target.value)}
                placeholder="nom@exemple.com"
                className="block w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
              />

              {/* Suggestions automatiques */}
              <datalist id="contacts-list">
                <option value={MY_EMAIL} />
                <option value="contact@exemple.com" />
              </datalist>
            </div>
          </div>

          {/* Objet */}
          <div className="space-y-1">
            <label htmlFor="input-objet" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
              Objet
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Tag className="w-4 h-4 stroke-[1.75]" />
              </div>
              <input
                id="input-objet"
                type="text"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                placeholder="Ex : Sherpa - Nouveau rapport"
                className="block w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Automatic classification card */}
          <div id="classification-preview-card" className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
            <span className="text-blue-500 text-lg mt-0.5">ℹ️</span>
            <div className="space-y-1">
              <p className="text-[11px] text-blue-700 leading-tight italic">
                Le premier mot de l'objet servira automatiquement de dossier de classement (ex: 'Sherpa'). Par défaut : 'Divers'.
              </p>
              <div className="pt-2 flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-blue-800">Dossier cible :</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                  computedFolder === 'Sherpa'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200/50'
                    : computedFolder === 'Divers'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200/50'
                    : 'bg-purple-100 text-purple-800 border border-purple-200/50'
                }`}>
                  {computedFolder}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1">
            <label htmlFor="input-message" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
              Message
            </label>
            <div className="relative">
              <textarea
                id="input-message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message ici..."
                className="block w-full px-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end">
            <button
              id="btn-cancel-modal"
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-lg font-medium mr-3 transition-all cursor-pointer hover:bg-gray-200 text-sm"
            >
              Annuler
            </button>
            <button
              id="btn-send-message"
              type="submit"
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}