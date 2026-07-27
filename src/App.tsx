/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
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
import { LayoutGrid, Mail } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sherpa_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ÉTAT DE LA VUE : 'messagerie' (classique) ou 'pages' (mots-clés)
  const [viewMode, setViewMode] = useState<'messagerie' | 'pages'>('messagerie');

  const [selectedFolderId, setSelectedFolderId] = useState<string>('tous');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

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
        expediteur: item.sender_email,
        destinataire: item.recipient_email,
        objet: item.subject || '',
        message: item.body,
        dossier: item.theme || 'Général',
        date: item.created_at,
        masque: item.is_archived || false,
      }));

      setMessages(formattedMessages);

      const visible = formattedMessages.filter((m) => !m.masque);
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
    setInitialComposeData({
      destinataire: msg.expediteur || msg.destinataire,
      objet: msg.objet.startsWith('Re:') ? msg.objet : `Re: ${msg.objet}`,
      message: `\n\n--- Message original de ${msg.expediteur || 'inconnu'} ---\n${msg.message}`,
    });
    setIsComposeOpen(true);
  };

  const handleForwardMessage = (msg: Message) => {
    setInitialComposeData({
      destinataire: '',
      objet: msg.objet.startsWith('Fwd:') || msg.objet.startsWith('Tr:') ? msg.objet : `Fwd: ${msg.objet}`,
      message: `\n\n-------- Message transféré --------\nDe : ${msg.expediteur}\nÀ : ${msg.destinataire}\nObjet : ${msg.objet}\n\n${msg.message}`,
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

  const handleSendMessage = async (newMsgData: Omit<Message, 'id' | 'date' | 'expediteur'>) => {
    const payload = {
      sender_email: 'ericgalaxy5@free.fr',
      recipient_email: newMsgData.destinataire,
      subject: newMsgData.objet,
      body: newMsgData.message,
    };

    const { data, error } = await supabase.from('messages').insert([payload]).select();

    if (error) {
      console.error("Erreur lors de l'envoi :", error.message);
      return;
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
      };

      setMessages((prev) => [newMsg, ...prev]);
      setSelectedMessageId(newMsg.id);
      setSelectedFolderId(newMsg.dossier.toLowerCase());
    }
  };

  const handleDeleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      console.error('Erreur de suppression :', error.message);
      return;
    }

    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };

  // GESTION DE LA RECHERCHE ET DU FILTRAGE MULTI-CRITÈRES
  const handleSearchChange = (query: string, newFilters: AdvancedFilters) => {
    setSearchTerm(query);
    setFilters(newFilters);
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      // 1. Recherche par dossier actif
      if (selectedFolderId === 'masques') {
        if (!msg.masque) return false;
      } else {
        if (msg.masque) return false; // Masque les éléments archivés dans les dossiers normaux
        if (selectedFolderId !== 'tous' && msg.dossier.toLowerCase() !== selectedFolderId) {
          return false;
        }
      }

      // 2. Recherche globale (si du texte est entré dans la barre principale)
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

      // 3. Recherche Avancée (Filtres ciblés)
      if (filters.objet && !msg.objet?.toLowerCase().includes(filters.objet.toLowerCase())) {
        return false;
      }

      if (filters.message && !msg.message?.toLowerCase().includes(filters.message.toLowerCase())) {
        return false;
      }

      if (filters.expediteur && !msg.expediteur?.toLowerCase().includes(filters.expediteur.toLowerCase())) {
        return false;
      }

      if (filters.destinataire && !msg.destinataire?.toLowerCase().includes(filters.destinataire.toLowerCase())) {
        return false;
      }

      if (filters.dateDebut && new Date(msg.date) < new Date(filters.dateDebut)) {
        return false;
      }

      if (filters.dateFin) {
        const endDate = new Date(filters.dateFin);
        endDate.setHours(23, 59, 59, 999);
        if (new Date(msg.date) > endDate) return false;
      }

      return true;
    });
  }, [messages, selectedFolderId, searchTerm, filters]);

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-workspace" className="flex h-screen w-full bg-white overflow-hidden text-gray-800 font-sans selection:bg-gray-100">
      <Sidebar
        messages={messages}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(folderId) => {
          setSelectedFolderId(folderId);
          const filtered = messages.filter((msg) => {
            if (folderId === 'masques') return msg.masque === true;
            if (msg.masque) return false;
            if (folderId === 'tous') return true;
            return msg.dossier.toLowerCase() === folderId;
          });
          setSelectedMessageId(filtered.length > 0 ? filtered[0].id : null);
        }}
        onNewMessageClick={handleOpenNewMessage}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* BARRE DE SELECTION DU MODE DE VUE */}
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
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
              <span>Messagerie</span>
            </button>
            <button
              onClick={() => setViewMode('pages')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'pages'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mode Pages (Mots-clés)</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-gray-500 font-medium hidden sm:inline">
            {viewMode === 'messagerie' ? 'Vue chronologique' : 'Tri automatique par thématiques'}
          </span>
        </div>

        {/* CONTENU PRINCIPAL */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-xs font-medium">
            Chargement de la messagerie...
          </div>
        ) : viewMode === 'pages' ? (
          /* MODE PAGES PAR MOTS-CLÉS */
          <KeywordPagesView
            messages={messages}
            onDeleteMessage={handleDeleteMessage}
            onReplyMessage={handleReplyMessage}
            onForwardMessage={handleForwardMessage}
            onToggleHideMessage={handleToggleHideMessage}
          />
        ) : (
          /* MODE MESSAGERE TRADITIONNEL */
          <div className="flex-1 flex h-full overflow-hidden">
            <div className="flex flex-col border-r border-gray-200 w-80 lg:w-96 shrink-0 h-full">
              <SearchBar onSearch={handleSearchChange} />
              <MessageList
                messages={filteredMessages}
                selectedFolderId={selectedFolderId}
                selectedMessageId={selectedMessageId}
                onSelectMessage={(msg) => setSelectedMessageId(msg.id)}
                onDeleteMessage={handleDeleteMessage}
                onToggleHideMessage={handleToggleHideMessage}
              />
            </div>

            <MessageDetail
              message={selectedMessage}
              onDeleteMessage={handleDeleteMessage}
              onReplyMessage={handleReplyMessage}
              onForwardMessage={handleForwardMessage}
              onToggleHideMessage={handleToggleHideMessage}
            />
          </div>
        )}
      </div>

      {/* MODAL NOUVEAU MESSAGE */}
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