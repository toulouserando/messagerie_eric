/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Message } from './types';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import MessageDetail from './components/MessageDetail';
import NewMessageModal from './components/NewMessageModal';
import { AnimatePresence } from 'framer-motion'; // ou 'motion/react'
import { supabase } from './supabaseClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sherpa_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedFolderId, setSelectedFolderId] = useState<string>('tous');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // 1. Charger les messages depuis Supabase au démarrage
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
      // Mapping entre les colonnes Supabase et votre interface Message
      const formattedMessages: Message[] = data.map((item) => ({
        id: item.id,
        expediteur: item.sender_email,
        destinataire: item.recipient_email,
        objet: item.subject || '',
        message: item.body,
        dossier: item.theme || 'Général',
        date: item.created_at,
      }));

      setMessages(formattedMessages);

      if (formattedMessages.length > 0 && !selectedMessageId) {
        setSelectedMessageId(formattedMessages[0].id);
      }
    }
    setLoading(false);
  };

  // Handle Login
  const handleLoginSuccess = () => {
    localStorage.setItem('sherpa_authenticated', 'true');
    setIsAuthenticated(true);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('sherpa_authenticated');
    setIsAuthenticated(false);
    setSelectedMessageId(null);
    setSelectedFolderId('tous');
  };

  // 2. Ajouter un nouveau message dans Supabase
  const handleSendMessage = async (newMsgData: Omit<Message, 'id' | 'date' | 'expediteur'>) => {
    const payload = {
      sender_email: 'moi@sherpa.com', // Adresse de l'expéditeur
      recipient_email: newMsgData.destinataire,
      subject: newMsgData.objet,
      body: newMsgData.message,
      // Le thème sera auto-détecté par le trigger SQL si laissé vide ou transmis ici
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([payload])
      .select();

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
      };

      setMessages((prev) => [newMsg, ...prev]);
      setSelectedMessageId(newMsg.id);
      setSelectedFolderId(newMsg.dossier.toLowerCase());
    }
  };

  // 3. Supprimer un message dans Supabase
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

  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div id="app-workspace" className="flex h-screen w-full bg-white overflow-hidden text-gray-800 font-sans selection:bg-gray-100">
      {/* 1. Left Sidebar */}
      <Sidebar
        messages={messages}
        selectedFolderId={selectedFolderId}
        onSelectFolder={(folderId) => {
          setSelectedFolderId(folderId);
          const filtered = messages.filter((msg) => {
            if (folderId === 'tous') return true;
            return msg.dossier.toLowerCase() === folderId;
          });
          if (filtered.length > 0) {
            setSelectedMessageId(filtered[0].id);
          } else {
            setSelectedMessageId(null);
          }
        }}
        onNewMessageClick={() => setIsComposeOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Middle Message Feed */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Chargement de la messagerie...
        </div>
      ) : (
        <MessageList
          messages={messages}
          selectedFolderId={selectedFolderId}
          selectedMessageId={selectedMessageId}
          onSelectMessage={(msg) => setSelectedMessageId(msg.id)}
          onDeleteMessage={handleDeleteMessage}
        />
      )}

      {/* 3. Right Message Detail Viewer */}
      <MessageDetail
        message={selectedMessage}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <NewMessageModal
            isOpen={isComposeOpen}
            onClose={() => setIsComposeOpen(false)}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}