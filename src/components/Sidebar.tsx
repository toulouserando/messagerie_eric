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

  // Détection souple
  const isSentByMe = (msg: Message) => {
    const sender = (msg.expediteur || '').toLowerCase();
    return MY_EMAILS.some((email) => sender.includes(email));
  };

  const isToMe = (msg: Message) => {
    const recipient = (msg.destinataire || '').toLowerCase();
    return MY_EMAILS.some((email) => recipient.includes(email));
  };

  const trashMessages = messages.filter((m) => m.is_deleted === true);
  const activeMessages = messages.filter((m) => !m.is_deleted);

  const hiddenMessages = activeMessages.filter((m) => m.masque);
  const visibleMessages = activeMessages.filter((m) => !m.masque);

  // Messages envoyés par moi
  const sentMessages = visibleMessages.filter((m) => isSentByMe(m));

  // Messages reçus (boîte de réception)
  const receivedMessages = visibleMessages.filter((m) => !isSentByMe(m) || isToMe(m));

  const getFolders = (): Folder[] => {
    const foldersMap = new Map<string, number>();

    // Liste des dossiers fixes intermédiaires
    const staticMiddleNames = ['Archives', 'Fait', 'Messages traités', 'Test'];
    const predefinedFolders = ['Général', ...staticMiddleNames];
    predefinedFolders.forEach((name) => foldersMap.set(name, 0));

    // Décompte dynamique basé sur les messages reçus
    receivedMessages.forEach((msg) => {
      const folderName = (msg.dossier || 'Général').trim();
      const formattedName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
      foldersMap.set(formattedName, (foldersMap.get(formattedName) || 0) + 1);
    });

    // 1. Dossier Général
    const generalFolder: Folder = {
      id: 'général',
      name: 'Général',
      count: foldersMap.get('Général') || 0,
    };

    // 2. Sous-dossiers automatiques/dynamiques (Home, Sherpa, etc.)
    const dynamicFolders: Folder[] = [];
    foldersMap.forEach((count, name) => {
      if (name !== 'Général' && !staticMiddleNames.includes(name)) {
        dynamicFolders.push({
          id: name.toLowerCase(),
          name,
          count,
        });
      }
    });
    dynamicFolders.sort((a, b) => a.name.localeCompare(b.name));

    // 3. Dossiers fixes du bas (Archives, Fait, Messages traités, Test)
    const staticMiddleFolders: Folder[] = staticMiddleNames.map((name) => ({
      id: name.toLowerCase(),
      name,
      count: foldersMap.get(name) || 0,
    }));

    // Reconstitution de la liste avec "Général" en première position
    return [
      generalFolder,
      {
        id: 'tous',
        name: 'Tous les messages',
        count: receivedMessages.length,
      },
      {
        id: 'envoyes',
        name: 'Messages envoyés',
        count: sentMessages.length,
      },
      ...dynamicFolders,
      ...staticMiddleFolders,
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
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
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
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
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
          const isSelected = selectedFolderId.toLowerCase() === folder.id;
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