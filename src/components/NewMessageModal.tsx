import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, User, Tag, AlertCircle, EyeOff } from 'lucide-react';
import { Message } from '../types';
import { supabase } from '../supabaseClient';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (messageData: Omit<Message, 'id' | 'date' | 'expediteur'> & { cc?: string; bcc?: string }) => void;
  initialData?: {
    destinataire?: string;
    objet?: string;
    message?: string;
  };
}

export default function NewMessageModal({
  isOpen,
  onClose,
  onSendMessage,
  initialData = {},
}: NewMessageModalProps) {
  // Récupération dynamique depuis la variable d'environnement Vite
  const MY_EMAIL = import.meta.env.VITE_SENDER_EMAIL || 'eric@ftstoulouse.online';

  const [destinataire, setDestinataire] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const [objet, setObjet] = useState('');
  const [message, setMessage] = useState('');
  const [computedFolder, setComputedFolder] = useState('Divers');

  // Liste des suggestions de contacts depuis Supabase
  const [contactSuggestions, setContactSuggestions] = useState<string[]>([]);

  // État pour gérer les avertissements/erreurs
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Chargement dynamique des contacts enregistrés dans Supabase
  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await supabase.from('contacts').select('email');
      if (!error && data) {
        const emails = data.map((c) => c.email).filter(Boolean);
        setContactSuggestions(Array.from(new Set(emails)));
      }
    };

    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);

  // Extrait le premier mot de l'objet pour en faire le nom du dossier
  const extractFolder = (subject: string): string => {
    const trimmed = subject.trim();
    if (!trimmed) return 'Divers';

    const firstWord = trimmed.split(/\s+/)[0];
    const cleaned = firstWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, '');

    if (!cleaned) return 'Divers';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  useEffect(() => {
    if (isOpen) {
      setDestinataire(initialData.destinataire || '');
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
      setObjet(initialData.objet || '');
      setMessage(initialData.message || '');
      setErrorMessage(null); // Réinitialise les alertes à l'ouverture
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    setComputedFolder(extractFolder(objet));
  }, [objet]);

  // Utilitaire de validation d'une liste d'e-mails
  const validateEmails = (emailsString: string): { isValid: boolean; invalidEmail?: string; count: number } => {
    if (!emailsString.trim()) return { isValid: true, count: 0 };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const list = emailsString.split(/[,;]+/).map((e) => e.trim()).filter(Boolean);
    const invalid = list.find((e) => !emailRegex.test(e));
    return {
      isValid: !invalid,
      invalidEmail: invalid,
      count: list.length,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // --- CONTRÔLES DE VALIDATION ---
    const destValidation = validateEmails(destinataire);
    const ccValidation = validateEmails(cc);
    const bccValidation = validateEmails(bcc);

    if (destValidation.count === 0 && bccValidation.count === 0) {
      setErrorMessage('Veuillez indiquer au moins un destinataire principal ou en copie cachée (CCI).');
      return;
    }

    if (!destValidation.isValid) {
      setErrorMessage(`L'adresse e-mail "${destValidation.invalidEmail}" dans le champ Destinataire n'est pas valide.`);
      return;
    }

    if (!ccValidation.isValid) {
      setErrorMessage(`L'adresse e-mail "${ccValidation.invalidEmail}" dans le champ Cc n'est pas valide.`);
      return;
    }

    if (!bccValidation.isValid) {
      setErrorMessage(`L'adresse e-mail "${bccValidation.invalidEmail}" dans le champ CCI n'est pas valide.`);
      return;
    }

    if (!objet.trim()) {
      setErrorMessage('Veuillez renseigner un objet pour votre message.');
      return;
    }

    if (!message.trim()) {
      setErrorMessage('Le corps du message ne peut pas être vide.');
      return;
    }

    // --- ENVOI ---
    onSendMessage({
      destinataire: destinataire.trim(),
      cc: cc.trim() || undefined,
      bcc: bcc.trim() || undefined,
      objet: objet.trim(),
      message: message.trim(),
      dossier: computedFolder,
      masque: false,
      is_deleted: false,
    });

    // Reset des champs
    setDestinataire('');
    setCc('');
    setBcc('');
    setObjet('');
    setMessage('');
    setErrorMessage(null);
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

        {/* Message d'avertissement dynamique */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Destinataire principal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="input-destinataire" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
                Destinataire(s) <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center gap-2">
                {!showCc && (
                  <button
                    type="button"
                    onClick={() => setShowCc(true)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
                  >
                    + Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    type="button"
                    onClick={() => setShowBcc(true)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    + CCI (Caché)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDestinataire(MY_EMAIL);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
                >
                  + M'écrire à moi-même
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4 stroke-[1.75]" />
              </div>
              <input
                id="input-destinataire"
                type="text"
                list="contacts-list"
                value={destinataire}
                onChange={(e) => {
                  setDestinataire(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="nom@exemple.com"
                className="block w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
              />

              <datalist id="contacts-list">
                <option value={MY_EMAIL} />
                {contactSuggestions.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Champ Cc (Copie conforme) */}
          {showCc && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="input-cc" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
                  Copie conforme (Cc)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCc('');
                    setShowCc(false);
                  }}
                  className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Masquer
                </button>
              </div>
              <input
                id="input-cc"
                type="text"
                list="contacts-list"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="contact1@domaine.com, contact2@domaine.com"
                className="block w-full px-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Champ CCI (Copie cachée) */}
          {showBcc && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="input-bcc" className="block text-xs font-bold text-blue-600 uppercase tracking-tighter flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5 inline" /> Copie Cachée (CCI)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setBcc('');
                    setShowBcc(false);
                  }}
                  className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Masquer
                </button>
              </div>
              <input
                id="input-bcc"
                type="text"
                list="contacts-list"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Les destinataires CCI ne verront pas les adresses des autres"
                className="block w-full px-4 py-2 text-sm bg-blue-50/50 border border-blue-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}

          {/* Objet */}
          <div className="space-y-1">
            <label htmlFor="input-objet" className="block text-xs font-bold text-gray-500 uppercase tracking-tighter">
              Objet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Tag className="w-4 h-4 stroke-[1.75]" />
              </div>
              <input
                id="input-objet"
                type="text"
                value={objet}
                onChange={(e) => {
                  setObjet(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
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
              Message <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                id="input-message"
                rows={6}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
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