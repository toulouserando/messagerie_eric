export interface Message {
  id: string;
  expediteur: string;
  destinataire: string;
  objet: string;

  /** Version en texte brut du message (utilisée pour les aperçus, la recherche et l'export .txt) */
  message: string;

  /** Version HTML du message (optionnelle, pour le rendu riche dans le détail du message) */
  messageHtml?: string;

  dossier: string;
  date: string;

  // États et visibilité du message
  masque?: boolean;      // Compatibilité avec le composant MessageList (masquage/archivage)
  is_visible?: boolean;  // Indique si le message est visible ou masqué
  is_deleted?: boolean;  // Indique si le message est placé dans la corbeille
  is_read?: boolean;     // Indique si le message a été lu (true) ou non (false)
}

export interface Folder {
  id: string;   // Ex: 'tous', 'sherpa', 'divers', 'masques', 'corbeille'
  name: string; // Nom d'affichage
  count: number;
  icon?: string; // Optionnel : nom de l'icône si besoin
}