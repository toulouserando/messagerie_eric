export interface Message {
  id: string;
  destinataire: string;
  objet: string;
  message: string;
  dossier: string;
  date: string;
  expediteur: string;
  masque?: boolean;      // Conservé si vous l'utilisez déjà dans votre code
  is_deleted?: boolean;  // Indique si le message est placé dans la corbeille
  is_visible?: boolean;  // Indique si le message est visible ou masqué
}

export interface Folder {
  id: string;   // Ex: 'tous', 'home', 'office', 'corbeille'
  name: string; // Nom d'affichage
  count: number;
}