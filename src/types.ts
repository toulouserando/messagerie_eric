export interface Message {
  id: string;
  destinataire: string;
  objet: string;
  message: string;
  dossier: string;
  date: string;
  expediteur: string;
  masque?: boolean; // NOUVEAU
}

export interface Folder {
  id: string;
  name: string;
  count: number;
}