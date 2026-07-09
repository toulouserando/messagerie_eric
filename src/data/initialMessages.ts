import { Message } from '../types';

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    destinataire: 'contact@sherpa-consulting.fr',
    objet: 'Sherpa - Proposition de partenariat stratégique 2026',
    message: 'Bonjour l\'équipe Sherpa,\n\nSuite à notre dernière réunion, nous avons affiné notre proposition commerciale pour le projet d\'intégration. Vous trouverez ci-joint les détails financiers ainsi que le calendrier de déploiement estimé.\n\nRestant à votre entière disposition pour tout échange complémentaire.\n\nCordialement,\nJean-Marc',
    dossier: 'Sherpa',
    date: '2026-07-07T14:30:00.000Z',
    expediteur: 'Moi'
  },
  {
    id: 'msg-2',
    destinataire: 'finance@sherpa-consulting.fr',
    objet: 'Sherpa Facturation du premier livrable technique',
    message: 'Bonjour,\n\nJe vous adresse la facture n° FAC-2026-089 correspondant à la validation de la première phase de développement du projet Sherpa.\n\nLe paiement est attendu sous 30 jours par virement bancaire.\n\nMerci pour votre précieuse collaboration.\n\nBien cordialement,\nService Comptabilité',
    dossier: 'Sherpa',
    date: '2026-07-06T09:15:00.000Z',
    expediteur: 'Moi'
  },
  {
    id: 'msg-3',
    destinataire: 'marie.dubois@gmail.com',
    objet: 'Anniversaire surprise de Thomas ce week-end',
    message: 'Coucou Marie,\n\nN\'oublie pas que l\'on se réunit tous samedi soir à 19h30 pour l\'anniversaire de Thomas. Chut, c\'est une surprise ! Pense à apporter un petit dessert si tu le souhaites, je m\'occupe des boissons et du plat principal.\n\nA samedi !',
    dossier: 'Divers',
    date: '2026-07-05T18:45:00.000Z',
    expediteur: 'Moi'
  },
  {
    id: 'msg-4',
    destinataire: 'support@monfournisseur.fr',
    objet: 'Demande de résiliation de mon abonnement fibre',
    message: 'Madame, Monsieur,\n\nPar la présente, je sollicite la résiliation de mon abonnement internet fibre pour cause de déménagement à l\'étranger à compter du mois prochain.\n\nJe vous remercie de m\'indiquer la marche à suivre pour le renvoi des équipements.\n\nDans l\'attente de votre confirmation,\nCordialement.',
    dossier: 'Divers',
    date: '2026-07-04T11:20:00.000Z',
    expediteur: 'Moi'
  },
  {
    id: 'msg-5',
    destinataire: 'team-marketing@sherpa-consulting.fr',
    objet: 'Sherpa Validation des maquettes de la nouvelle application',
    message: 'Bonjour à tous,\n\nJ\'ai passé en revue les maquettes UI/UX de la nouvelle interface. C\'est un superbe travail, moderne et très intuitif. J\'ai simplement deux remarques mineures concernant le contraste de la barre latérale sur mobile.\n\nOn s\'organise un point rapide demain matin à 10h pour finaliser tout cela ?\n\nExcellente journée,\nAlexandre',
    dossier: 'Sherpa',
    date: '2026-07-03T16:00:00.000Z',
    expediteur: 'Moi'
  }
];
