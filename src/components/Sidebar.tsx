import { Folder, Message } from '../types';
import { Plus, Folder as FolderIcon, Inbox, LogOut, EyeOff, Trash2, Send } from 'lucide-react';

interface SidebarProps {
  messages: Message[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onNewMessageClick: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  messages = [],
  selectedFolderId,
  onSelectFolder,
  onNewMessageClick,
  onLogout,
}: SidebarProps) {
  const MY_EMAILS = [
    (import.meta.env.VITE_SENDER_EMAIL || 'eric@ftstoulouse.online').toLowerCase().trim(),
    'ericgalaxy5@free.fr',
  ];

  const isSentByMe = (msg: Message) => {
    const sender = (msg.expediteur || '').toLowerCase().trim();
    return MY_EMAILS.includes(sender);
  };

  const trashMessages = messages.filter((m) => m.is_deleted === true);
  const activeMessages = messages.filter((m) => !m.is_deleted);

  const hiddenMessages = activeMessages.filter((m) => m.masque);
  const visibleMessages = activeMessages.filter((m) => !m.masque);

  const sentMessages = visibleMessages.filter((m) => isSentByMe(m));

  const getFolders = (): Folder[] => {
    const foldersMap = new Map<string, number>();

    // Génère les dossiers thématiques sur TOUS les messages visibles
    visibleMessages.forEach((msg) => {
      const folderName = (msg.dossier || 'Général').trim();
      foldersMap.set(folderName, (foldersMap.get(folderName) || 0) + 1);
    });

    const customFolderList: Folder[] = [];
    foldersMap.forEach((count, name) => {
      customFolderList.push({
        id: name.toLowerCase(),
        name,
        count,
      });
    });

    customFolderList.sort((a, b) => a.name.localeCompare(b.name));

    return [
      {
        id: 'tous',
        name: 'Tous les messages',
        count: visibleMessages.length,
      },
      {
        id: 'envoyes',
        name: 'Messages envoyés',
        count: sentMessages.length,
      },
      ...customFolderList,
      {
        id: 'masques',
        name: 'Messages masqués',
        count: hiddenMessages.length,
      },
      {
        id: 'corbeille',
        name: 'Corbeille',
        count: trashMessages.length,
      },
    ];
  };

  const folders = getFolders();

  return (
    <aside id="sidebar-container" className="w-80 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-gray-800">Messagerie</h2>
            <p className="text-[10px] text-gray-400 font-mono font-medium uppercase tracking-wider">Sherpa Workspace</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <button
          id="btn-compose-message"
          onClick={onNewMessageClick}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nouveau message</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Dossiers</span>
        </div>

        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          const isAll = folder.id === 'tous';
          const isSent = folder.id === 'envoyes';
          const isHiddenFolder = folder.id === 'masques';
          const isTrashFolder = folder.id === 'corbeille';

          return (
            <button
              id={`folder-btn-${folder.id}`}
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all cursor-pointer group ${
                isSelected
                  ? isTrashFolder
                    ? 'bg-red-50 text-red-800 font-semibold border-r-4 border-red-600 rounded-r-none'
                    : 'bg-blue-50 text-blue-800 font-semibold border-r-4 border-blue-600 rounded-r-none'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isAll ? (
                  <Inbox className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                ) : isSent ? (
                  <Send className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                ) : isHiddenFolder ? (
                  <EyeOff className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                ) : isTrashFolder ? (
                  <Trash2 className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-red-700' : 'text-gray-400 group-hover:text-red-600'}`} />
                ) : (
                  <FolderIcon className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                )}
                <span className="truncate">{folder.name}</span>
              </div>
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                  isSelected
                    ? isTrashFolder
                      ? 'bg-red-200 text-red-800'
                      : 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300/60'
                }`}
              >
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button
          id="btn-logout"
          onClick={onLogout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-all cursor-pointer group font-medium"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-4 h-4 stroke-[1.75] text-red-500 group-hover:text-red-600" />
            <span>Déconnexion</span>
          </div>
        </button>
      </div>
    </aside>
  );
}