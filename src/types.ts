export interface Message {
  id: string;
  destinataire: string;
  objet: string;
  message: string;
  dossier: string;
  date: string;
  expediteur: string;
}

export interface Folder {
  id: string; // 'tous' or the folder name in lowercase
  name: string; // Display name
  count: number;
}
