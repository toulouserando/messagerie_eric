import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { RefreshCw } from 'lucide-react';

const MAIN_EMAIL = (import.meta.env.VITE_SENDER_EMAIL || 'eric@ftstoulouse.online').trim().toLowerCase();
const MY_EMAILS = [MAIN_EMAIL, 'ericgalaxy5@free.fr'];

const formatFolderName = (folder: string): string => {
  if (!folder) return 'Général';
  const clean = folder.trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sherpa_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'messagerie' | 'pages'>('messagerie');

  const [selectedFolderId, setSelectedFolderId] = useState<string>('général');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

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

  const fetchMessages = useCallback(async () => {
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
        dossier: item.theme ? formatFolderName(item.theme) : 'Général',
        date: item.created_at,
        masque: item.is_archived || false,
        is_deleted: item.is_deleted || false,
        is_read: item.is_read || false,
      }));

      setMessages(formattedMessages);

      setSelectedMessageId((prevId) => {
        const isStillValid = formattedMessages.some(
          (m) => m.id === prevId && !m.masque && !m.is_deleted
        );
        if (isStillValid) return prevId;
        const visible = formattedMessages.filter((m) => !m.masque && !m.is_deleted);
        return visible.length > 0 ? visible[0].id : null;
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated, fetchMessages]);

  const markAsRead = useCallback(async (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
    );

    const { error } = await supabase.from('messages').update({ is_read: true }).eq('id', id);
    if (error) {
      console.error('Erreur mise à jour statut lu :', error.message);
    }
  }, []);

  useEffect(() => {
    if (!selectedMessageId) return;

    const currentMsg = messages.find((m) => m.id === selectedMessageId);
    if (currentMsg && !currentMsg.is_read) {
      const timer = setTimeout(() => {
        markAsRead(selectedMessageId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedMessageId, messages, markAsRead]);

  const handleToggleReadMessage = async (id: string, currentReadStatus: boolean) => {
    const newReadStatus = !currentReadStatus;

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_read: newReadStatus } : m))
    );

    const { error } = await supabase.from('messages').update({ is_read: newReadStatus }).eq('id', id);
    if (error) {
      console.error('Erreur mise à jour statut lu / non lu :', error.message);
    }
  };

  const handleLoginSuccess = () => {
    localStorage.setItem('sherpa_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sherpa_authenticated');
    setIsAuthenticated(false);
    setSelectedMessageId(null);
    setSelectedFolderId('général');
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

  const handleMoveMessageToFolder = async (id: string, newFolder: string) => {
    const formattedFolder = formatFolderName(newFolder);

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, dossier: formattedFolder } : m))
    );

    if (selectedMessageId === id && selectedFolderId.toLowerCase() !== formattedFolder.toLowerCase()) {
      setSelectedMessageId(null);
    }

    const { error } = await supabase
      .from('messages')
      .update({ theme: formattedFolder })
      .eq('id', id);

    if (error) {
      console.error('Erreur lors du déplacement du message :', error.message);
      alert(`Erreur Supabase : ${error.message}`);
      fetchMessages();
    }
  };

  const handleBulkMoveMessages = async (ids: string[], newFolder: string) => {
    if (ids.length === 0) return;

    const formattedFolder = formatFolderName(newFolder);

    setMessages((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, dossier: formattedFolder } : m))
    );

    if (selectedMessageId && ids.includes(selectedMessageId) && selectedFolderId.toLowerCase() !== formattedFolder.toLowerCase()) {
      setSelectedMessageId(null);
    }

    const { error } = await supabase
      .from('messages')
      .update({ theme: formattedFolder })
      .in('id', ids);

    if (error) {
      console.error('Erreur lors du déplacement groupé :', error.message);
      alert(`Erreur Supabase : ${error.message}`);
      fetchMessages();
    }
  };

  const handleToggleHideMessage = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    const { error } = await supabase.from('messages').update({ is_archived: newStatus }).eq('id', id);
    if (error) {
      console.error('Erreur lors du masquage/démasquage :', error.message);
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, masque: newStatus } : m))
    );

    if (selectedMessageId === id && selectedFolderId.toLowerCase() !== 'masques') {
      setSelectedMessageId(null);
    }
  };

  const handleSendMessage = async (newMsgData: Omit<Message, 'id' | 'date' | 'expediteur'>) => {
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newMsgData.destinataire,
          subject: newMsgData.objet,
          text: newMsgData.message,
          message: newMsgData.message,
          expediteur: MAIN_EMAIL,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        const errorMsg = resData.error?.message || resData.error || `Erreur serveur (HTTP ${response.status})`;
        alert(`Échec d'envoi de l'e-mail : ${errorMsg}`);
        return;
      }

      let newMsg: Message;

      if (resData.messageRecord) {
        const inserted = resData.messageRecord;
        newMsg = {
          id: inserted.id,
          expediteur: inserted.sender_email || MAIN_EMAIL,
          destinataire: inserted.recipient_email || newMsgData.destinataire,
          objet: inserted.subject || '',
          message: inserted.body || '',
          dossier: formatFolderName(inserted.theme || 'Général'),
          date: inserted.created_at || new Date().toISOString(),
          masque: false,
          is_deleted: false,
          is_read: true,
        };
      } else {
        const payload = {
          sender_email: MAIN_EMAIL,
          recipient_email: newMsgData.destinataire,
          subject: newMsgData.objet,
          body: newMsgData.message,
          is_read: true,
        };

        const { data, error } = await supabase.from('messages').insert([payload]).select();

        if (error || !data?.[0]) {
          console.error("Erreur Supabase lors de l'enregistrement :", error?.message);
          alert(`E-mail envoyé via Resend mais erreur d'enregistrement local : ${error?.message}`);
          return;
        }

        const inserted = data[0];
        newMsg = {
          id: inserted.id,
          expediteur: inserted.sender_email,
          destinataire: inserted.recipient_email,
          objet: inserted.subject || '',
          message: inserted.body,
          dossier: formatFolderName(inserted.theme || 'Général'),
          date: inserted.created_at,
          masque: false,
          is_deleted: false,
          is_read: true,
        };
      }

      await supabase
        .from('contacts_uniques')
        .upsert({ email: newMsgData.destinataire }, { onConflict: 'email' });

      setMessages((prev) => [newMsg, ...prev]);
      setSelectedMessageId(newMsg.id);
      setSelectedFolderId('envoyes');
      setIsComposeOpen(false);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error("Erreur lors de l'exécution de l'envoi :", errMessage);
      alert(`Erreur réseau : ${errMessage}\n\nVérifie que le fichier api/send.ts est bien placé à la racine de ton projet.`);
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

  const handleSelectMessage = (msg: Message) => {
    setSelectedMessageId(msg.id);
  };

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedMessageId) || null;
  }, [messages, selectedMessageId]);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      <Sidebar
        selectedFolderId={selectedFolderId}
        onSelectFolder={(folderId) => {
          setSelectedFolderId(folderId);
          setSelectedMessageId(null);
        }}
        onNewMessage={handleOpenNewMessage}
        messages={messages}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* BARRE SUPÉRIEURE */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg flex items-center">
              <button
                type="button"
                onClick={() => setViewMode('messagerie')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'messagerie'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Messagerie Classique
              </button>
              <button
                type="button"
                onClick={() => setViewMode('pages')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  viewMode === 'pages'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Format Page / Document
              </button>
            </div>

            <button
              type="button"
              onClick={fetchMessages}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === 'messagerie' ? (
            <>
              <MessageList
                messages={messages}
                selectedFolderId={selectedFolderId}
                selectedMessageId={selectedMessageId}
                onSelectMessage={handleSelectMessage}
                onDeleteMessage={handleDeleteMessage}
                onToggleHideMessage={handleToggleHideMessage}
                onToggleReadMessage={handleToggleReadMessage}
                onMoveMessage={handleMoveMessageToFolder}
                onBulkMoveMessages={handleBulkMoveMessages}
              />

              <MessageDetail
                message={selectedMessage}
                onDeleteMessage={handleDeleteMessage}
                onRestoreMessage={handleRestoreMessage}
                onToggleHideMessage={handleToggleHideMessage}
                onMoveMessage={handleMoveMessageToFolder}
                onReply={handleReplyMessage}
                onForward={handleForwardMessage}
                onEmptyTrash={handleEmptyTrash}
                selectedFolderId={selectedFolderId}
              />
            </>
          ) : (
            <KeywordPagesView messages={messages} />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isComposeOpen && (
          <NewMessageModal
            isOpen={isComposeOpen}
            onClose={() => setIsComposeOpen(false)}
            onSend={handleSendMessage}
            initialData={initialComposeData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}