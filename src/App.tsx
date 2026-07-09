/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Message } from './types';
import { INITIAL_MESSAGES } from './data/initialMessages';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import MessageDetail from './components/MessageDetail';
import NewMessageModal from './components/NewMessageModal';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sherpa_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('sherpa_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_MESSAGES;
      }
    }
    return INITIAL_MESSAGES;
  });

  const [selectedFolderId, setSelectedFolderId] = useState<string>('tous');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Sync messages to localStorage
  useEffect(() => {
    localStorage.setItem('sherpa_messages', JSON.stringify(messages));
  }, [messages]);

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

  // Add new message
  const handleSendMessage = (newMsgData: Omit<Message, 'id' | 'date' | 'expediteur'>) => {
    const newMsg: Message = {
      ...newMsgData,
      id: `msg-${Date.now()}`,
      date: new Date().toISOString(),
      expediteur: 'Moi',
    };

    setMessages((prev) => [newMsg, ...prev]);
    
    // Automatically select the newly created message
    setSelectedMessageId(newMsg.id);
    
    // Switch view to the target folder to let the user see where it got placed
    setSelectedFolderId(newMsg.dossier.toLowerCase());
  };

  // Delete message
  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessageId === id) {
      setSelectedMessageId(null);
    }
  };

  // Get active message
  const selectedMessage = messages.find((m) => m.id === selectedMessageId) || null;

  // Render LoginScreen if not authenticated
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
          // Auto-select first message of the folder or clear selection
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
      <MessageList
        messages={messages}
        selectedFolderId={selectedFolderId}
        selectedMessageId={selectedMessageId}
        onSelectMessage={(msg) => setSelectedMessageId(msg.id)}
        onDeleteMessage={handleDeleteMessage}
      />

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

