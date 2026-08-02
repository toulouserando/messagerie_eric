/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Message } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import MessageDetail from './components/MessageDetail';
import NewMessageModal from './components/NewMessageModal';
import SearchBar, { AdvancedFilters } from './components/SearchBar';
import KeywordPagesView from './components/KeywordPagesView';
import { AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { FileText, Mail, Trash2, Printer, Download } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sherpa_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ÉTAT DE LA VUE : 'messagerie' (classique) ou 'pages' (mode document)
  const [viewMode, setViewMode] = useState<'messagerie' | 'pages'>('messagerie');

  // DOSSIER ACTIF : 'tous' par défaut
  const [selectedFolderId, setSelectedFolderId] = useState<string>('tous');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Email de l'expéditeur principal (normalisé)
  const MY_EMAIL = (import.meta.env.VITE_SENDER_EMAIL || 'eric@ftstoulouse.online').trim().toLowerCase();

  // ÉTATS DE RECHERCHE & FILTRES
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AdvancedFilters>({
    objet: '',
    message: '',
    destinataire: '',
    expediteur: '',
    dateDebut: '',
    dateFin: '',
  });

  const [initialComposeData, setInitialComposeData] = useState<{
    destinataire?: string;
    objet?: string;
    message?: string;
  }>({});

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated]);

  // AUTO-MARK AS READ: Marque automatiquement comme lu lors de la sélection
  useEffect(() => {
    if (!selectedMessageId) return;

    const currentMsg = messages.find((m) => m.id === selectedMessageId);
    if (currentMsg && currentMsg.is_read === false) {
      const timer = setTimeout(() => {
        markAsRead(selectedMessageId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedMessageId, messages]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase :', error.message);
    } else if (data) {
      const formattedMessages: Message[] = data.map((item) => ({
        id: item.id,
        expediteur: item.sender_email || '',
        destinataire: item.recipient_email || '',
        objet: item.subject || '',
        message: item.body || '',
        messageHtml: item.body_html || item.message_html || undefined,
        dossier: item.theme || 'Général',
        date: item.created_at,
        masque: item.is_archived || false,
        is_deleted: item.is_deleted || false,
        is_read: item.is_read || false,
      }));

      setMessages(formattedMessages);

      // Sélectionner le 1er message visible (non supprimé et non masqué)
      const visible = formattedMessages.filter((m) => !m.masque && !m.is_deleted);
      if (visible.length > 0 && !selectedMessageId) {
        setSelectedMessageId(visible[0].id);
      }
    }
    setLoading(false);
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('sherpa_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sherpa_authenticated');
    setIsAuthenticated(false);
    setSelectedMessageId(null);
    setSelectedFolderId('tous');
  };

  const handleOpenNewMessage = () => {
    setInitialComposeData({});
    setIsComposeOpen(true);
  };

  const handleReplyMessage = (msg: Message) => {
    const rawContent = msg.message || msg.messageHtml?.replace(/<[^>]*>?/gm, '') || '';
    setInitialComposeData({
      destinataire: msg.expediteur || msg.destinataire,
      objet: msg.objet?.startsWith('Re:') ? msg.objet : `Re: ${msg.objet || ''}`,
      message: `\n\n--- Message original de ${msg.expediteur || 'inconnu'} ---\n${rawContent}`,
    });
    setIsComposeOpen(true);
  };

  const handleForwardMessage = (msg: Message) => {
    const rawContent = msg.message || msg.messageHtml?.replace(/<[^>]*>?/gm, '') || '';
    setInitialComposeData({
      destinataire: '',
      objet: msg.objet?.startsWith('Fwd:') || msg.objet?.startsWith('Tr:') ? msg.objet : `Fwd: ${msg.objet || ''}`,
      message: `\n\n-------- Message transféré --------\nDe : ${msg.expediteur}\nÀ : ${msg.destinataire}\nObjet : ${msg.objet}\n\n${rawContent}`,
    });
    setIsComposeOpen(true);
  };

  const handleToggleHideMessage = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    await supabase.from('messages').update({ is_archived: newStatus }).eq('id', id);

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, masque: newStatus } : m))
    );
  };

  const markAsRead = async (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );

    const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', id);
    if (error) {
      console.error('Erreur mise à jour statut lu :', error.message);
    }
  };

  const handleToggleReadMessage = async (id: string, currentReadStatus: boolean) => {
    const newReadStatus = !currentReadStatus;

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: newReadStatus } : m))
    );

    const { error } = await supabase.from('messages').update({ is_read: newReadStatus }).eq('id', id);
    if (error) {
      console.error('Erreur mise à jour statut lu/non lu :', error.message);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessageId(msg.id);
  };

  const handleSendMessage = async (newMsgData: Omit<Message, 'id' | 'date' | 'expediteur'>) => {
    try {
      const resendRes = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: MY_EMAIL,
          to: newMsgData.destinataire,
          subject: newMsgData.objet,
          text: newMsgData.message,
        }),
      });

      if (!resendRes.ok) {
        console.warn("Échec de l'envoi direct via l'API route Resend. Traitement Supabase conservé.");
      }

      const payload = {
        sender_email: MY_EMAIL,
        recipient_email: newMsgData.destinataire,
        subject: newMsgData.objet,
        body: newMsgData.message,
        is_read: true,
      };

      const { data, error } = await supabase.from('messages').insert([payload]).select();

      if (error) {
        console.error("Erreur Supabase lors de l'enregistrement :", error.message);
        return;
      }

      const { error: contactError } = await supabase
        .from('contacts_uniques')
        .upsert({ email: newMsgData.destinataire }, { onConflict: 'email' });

      if (contactError) {
        console.error("Erreur lors de l'ajout dans contacts_uniques :", contactError.message);
      }

      if (data && data[0]) {
        const inserted = data[0];
        const newMsg: Message = {
          id: inserted.id,
          expediteur: inserted.sender_email,
          destinataire: inserted.recipient_email,
          objet: inserted.subject || '',
          message: inserted.body,
          dossier: inserted.theme || 'Général',
          date: inserted.created_at,
          masque: false,
          is_deleted: false,
          is_read: true,
        };

        setMessages((prev) => [newMsg, ...prev]);
        setSelectedMessageId(newMsg.id);
        setSelectedFolderId('envoyes');
      }
    } catch (err: any) {
      console.error("Erreur lors de l'exécution de l'envoi :", err.message);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const targetMsg = messages.find((m) => m.id === id);

    if (targetMsg?.is_deleted || selectedFolderId === 'corbeille') {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) {
        console.error('Erreur lors de la suppression définitive :', error.message);
        return;
      }
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } else {
      const { error } = await supabase.from('messages').update({ is_deleted: true }).eq('id', id);
      if (error) {
        console.error('Erreur lors du déplacement en corbeille :', error.message);
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_deleted: true } : m))
      );
    }

    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };

  const handleRestoreMessage = async (id: string) => {
    const { error } = await supabase.from('messages').update({ is_deleted: false }).eq('id', id);
    if (error) {
      console.error('Erreur lors de la restauration :', error.message);
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_deleted: false } : m))
    );

    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };

  const handleEmptyTrash = async () => {
    const { error } = await supabase.from('messages').delete().eq('is_deleted', true);

    if (error) {
      console.error('Erreur lors du vidage de la corbeille :', error.message);
      return;
    }

    setMessages((prev) => prev.filter((m) => !m.is_deleted));
    setSelectedMessageId(null);
  };

  const handleSearchChange = (query: string, newFilters: AdvancedFilters) => {
    setSearchTerm(query);
    setFilters(newFilters);
  };

  // --- LOGIQUE DE FILTRAGE DU DOSSIER CORRIGÉE ---
  const filterByFolder = (msg: Message, folderId: string) => {
    const folderKey = folderId.toLowerCase().trim();
    const expediteurClean = (msg.expediteur || '').trim().toLowerCase();
    const isSentByMe = expediteurClean === MY_EMAIL;

    // 1. CORBEILLE
    if (folderKey === 'corbeille' || folderKey === 'trash') {
      return msg.is_deleted;
    }
    if (msg.is_deleted) return false;

    // 2. MASQUÉS
    if (folderKey === 'masques' || folderKey === 'messages masqués' || folderKey === 'archived') {
      return msg.masque;
    }
    if (msg.masque) return false;

    // 3. ENVOYÉS
    if (folderKey === 'envoyes' || folderKey === 'sent' || folderKey === 'messages envoyés') {
      return isSentByMe;
    }

    // 4. TOUS LES MESSAGES (REÇUS ET ENVOYÉS VUS GLOBALEMENT)
    if (folderKey === 'tous' || folderKey === 'tous_les_messages' || folderKey === 'tous les messages' || folderKey === 'all') {
      return true;
    }

    // 5. DOSSIERS THÉMATIQUES (Général, Sherpa, Home, etc.)
    const msgDossierClean = (msg.dossier || 'Général').trim().toLowerCase();
    return msgDossierClean === folderKey;
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => filterByFolder(msg, selectedFolderId)).filter((msg) => {
      // FILTRES DE RECHERCHE
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchGlobal =
          msg.objet?.toLowerCase().includes(query) ||
          msg.message?.toLowerCase().includes(query) ||
          msg.expediteur?.toLowerCase().includes(query) ||
          msg.destinataire?.toLowerCase().includes(query) ||
          msg.dossier?.toLowerCase().includes(query);

        if (!matchGlobal) return false;
      }

      if (filters.objet && !msg.objet?.toLowerCase().includes(filters.objet.toLowerCase())) return false;
      if (filters.message && !msg.message?.toLowerCase().includes(filters.message.toLowerCase())) return false;
      if (filters.expediteur && !msg.expediteur?.toLowerCase().includes(filters.expediteur.toLowerCase())) return false;
      if (filters.destinataire && !msg.destinataire?.toLowerCase().includes(filters.destinataire.toLowerCase())) return false;

      if (filters.dateDebut) {
        const startDate = new Date(filters.dateDebut);
        if (!isNaN(startDate.getTime()) && new Date(msg.date) < startDate) return false;
      }

      if (filters.dateFin) {
        const endDate = new Date(filters.dateFin);
        if (!isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          if (new Date(msg.date) > endDate) return false;
        }
      }

      return true;
    });
  }, [messages, selectedFolderId, searchTerm, filters, MY_EMAIL]);

  // CHANGEMENT DE DOSSIER : Sélectionne le 1er message du dossier actif
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);

    const nextFolderMessages = messages.filter((msg) => filterByFolder(msg, folderId));

    if (nextFolderMessages.length > 0) {
      setSelectedMessageId(nextFolderMessages[0].id);
    } else {
      setSelectedMessageId(null);
    }
  };

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-workspace" className="flex h-screen w-full bg-white overflow-hidden text-gray-800 font-sans selection:bg-gray-100 print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar
          messages={messages}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleFolderSelect}
          onNewMessageClick={handleOpenNewMessage}
          onLogout={handleLogout}
        />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible">
        {/* BARRE DE RECHERCHE */}
        <div className="print:hidden border-b border-gray-200">
          <SearchBar onSearchChange={handleSearchChange} />
        </div>

        {/* BARRE D'OUTILS ET COMMUTATEUR DE VUE */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-1 bg-gray-200/80 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('messagerie')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'messagerie'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Messagerie Classique</span>
            </button>
            <button
              onClick={() => setViewMode('pages')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'pages'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Format Page / Document</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-md text-xs font-semibold transition-all cursor-pointer"
              title="Envoyer tous les messages du dossier sélectionné vers votre imprimante"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer Boîte ({filteredMessages.length})</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-xs font-semibold transition-all cursor-pointer"
              title="Générer au format PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            {selectedFolderId === 'corbeille' ? (
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider la corbeille</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-gray-500 font-medium hidden sm:inline ml-2 uppercase">
                Dossier : {selectedFolderId}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xs font-medium print:hidden">
            Chargement de la messagerie...
          </div>
        ) : viewMode === 'pages' ? (
          <KeywordPagesView
            messages={messages.filter((m) => !m.is_deleted)}
            activeKeyword={selectedFolderId}
            onSelectKeyword={(folder) => handleFolderSelect(folder.toLowerCase())}
            onDeleteMessage={handleDeleteMessage}
            onReplyMessage={handleReplyMessage}
            onForwardMessage={handleForwardMessage}
            onToggleHideMessage={handleToggleHideMessage}
          />
        ) : (
          <div className="flex-1 flex h-full overflow-hidden print:hidden">
            <MessageList
              messages={filteredMessages}
              selectedFolderId={selectedFolderId}
              selectedMessageId={selectedMessageId}
              onSelectMessage={handleSelectMessage}
              onDeleteMessage={handleDeleteMessage}
              onToggleHideMessage={handleToggleHideMessage}
              onToggleReadMessage={handleToggleReadMessage}
            />

            <MessageDetail
              message={selectedMessage}
              onDeleteMessage={handleDeleteMessage}
              onRestoreMessage={handleRestoreMessage}
              onReplyMessage={handleReplyMessage}
              onForwardMessage={handleForwardMessage}
              onToggleHideMessage={handleToggleHideMessage}
              onToggleReadMessage={handleToggleReadMessage}
            />
          </div>
        )}

        {/* VUE D'IMPRESSION */}
        {viewMode === 'messagerie' && (
          <div className="hidden print:block p-4 bg-white text-black font-sans">
            <div className="border-b-2 border-black pb-3 mb-4">
              <h1 className="text-xl font-bold uppercase">
                Dossier : {selectedFolderId}
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                Impression générée le {new Date().toLocaleString('fr-FR')} | Nombre de messages : {filteredMessages.length}
              </p>
            </div>

            {filteredMessages.length === 0 ? (
              <p className="text-sm italic">Aucun message dans ce dossier.</p>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((msg, idx) => (
                  <article key={msg.id} className="border-b border-gray-300 pb-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>#{idx + 1} | De : {msg.expediteur || 'Inconnu'}</span>
                      <span>{new Date(msg.date).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="text-xs font-semibold mb-1">
                      À : {msg.destinataire || 'Inconnu'} | Objet : {msg.objet || '(Sans objet)'}
                    </div>
                    {msg.messageHtml ? (
                      <div
                        className="text-xs pl-2 border-l-2 border-gray-400 leading-snug prose prose-xs"
                        dangerouslySetInnerHTML={{ __html: msg.messageHtml }}
                      />
                    ) : (
                      <div className="text-xs pl-2 border-l-2 border-gray-400 whitespace-pre-wrap leading-snug">
                        {msg.message}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isComposeOpen && (
          <NewMessageModal
            isOpen={isComposeOpen}
            onClose={() => setIsComposeOpen(false)}
            onSendMessage={handleSendMessage}
            initialData={initialComposeData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}