import { Folder, Message } from '../types';
import { Mail, Plus, Folder as FolderIcon, Inbox, LogOut, Layers } from 'lucide-react';

interface SidebarProps {
  messages: Message[];
  selectedFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onNewMessageClick: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  messages,
  selectedFolderId,
  onSelectFolder,
  onNewMessageClick,
  onLogout,
}: SidebarProps) {
  
  // Calculate folder counts dynamically
  const getFolders = (): Folder[] => {
    const foldersMap = new Map<string, number>();
    
    // Always include 'Divers' in the map so it is present
    foldersMap.set('Divers', 0);
    
    // Count messages per folder
    messages.forEach((msg) => {
      const folderName = msg.dossier || 'Divers';
      foldersMap.set(folderName, (foldersMap.get(folderName) || 0) + 1);
    });

    // Convert map to Folder structures
    const folderList: Folder[] = [];
    foldersMap.forEach((count, name) => {
      folderList.push({
        id: name.toLowerCase(),
        name,
        count,
      });
    });

    // Sort alphabetically, except 'Divers' which should ideally be near the end or just alphabetically
    folderList.sort((a, b) => {
      if (a.name === 'Divers') return 1;
      if (b.name === 'Divers') return -1;
      return a.name.localeCompare(b.name);
    });

    // Prepend "Tous" which aggregates everything
    return [
      {
        id: 'tous',
        name: 'Tous les messages',
        count: messages.length,
      },
      ...folderList,
    ];
  };

  const folders = getFolders();

  return (
    <aside id="sidebar-container" className="w-80 border-r border-gray-200 bg-white flex flex-col h-full shrink-0">
      {/* Brand Header */}
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

      {/* Primary Call-to-Action */}
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

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Dossiers</span>
        </div>
        
        {folders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          const isAll = folder.id === 'tous';
          
          return (
            <button
              id={`folder-btn-${folder.id}`}
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-blue-50 text-blue-800 font-semibold border-r-4 border-blue-600 rounded-r-none'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {isAll ? (
                  <Inbox className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                ) : (
                  <FolderIcon className={`w-4 h-4 stroke-[1.75] ${isSelected ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-900'}`} />
                )}
                <span className="truncate">{folder.name}</span>
              </div>
              <span
                className={`text-xs font-mono font-medium px-2 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300/60'
                }`}
              >
                {folder.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer with Logout */}
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
