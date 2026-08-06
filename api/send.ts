import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialisation des SDKs côté serveur
const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Domaine autorisé et vérifié chez Resend
const VERIFIED_SENDER_EMAIL = 'eric@ftstoulouse.online';

// Fonction utilitaire pour transformer des chaînes ou tableaux en liste d'emails nettoyés
const parseEmailList = (input: string | string[] | undefined): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((e) => e.trim()).filter(Boolean);
  }
  return input
    .split(/[,;]+/)
    .map((e) => e.trim())
    .filter(Boolean);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Gestion des en-têtes CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { to, cc, bcc, subject, text, message, expediteur, dossier } = req.body;
    const bodyText = text || message || '';

    // Extraction et nettoyage des adresses e-mails
    const toList = parseEmailList(to);
    const ccList = parseEmailList(cc);
    const bccList = parseEmailList(bcc);

    // Contrôle : il faut au moins un destinataire dans 'to' ou 'bcc'
    if (toList.length === 0 && bccList.length === 0) {
      return res.status(400).json({ error: 'Au moins un destinataire (to ou bcc) est requis.' });
    }

    // -------------------------------------------------------------
    // ÉTAPE 1 : ENVOI EXTERNE VIA RESEND
    // -------------------------------------------------------------
    const resendPayload: Parameters<typeof resend.emails.send>[0] = {
      from: `Eric <${VERIFIED_SENDER_EMAIL}>`, // Toujours l'adresse vérifiée
      to: toList.length > 0 ? toList : [VERIFIED_SENDER_EMAIL],
      subject: subject || '(Sans objet)',
      text: bodyText,
      html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
    };

    // Si un expediteur alternatif est fourni, on le place en Reply-To
    if (expediteur && expediteur !== VERIFIED_SENDER_EMAIL) {
      resendPayload.replyTo = expediteur;
    }

    if (ccList.length > 0) resendPayload.cc = ccList;
    if (bccList.length > 0) resendPayload.bcc = bccList;

    const { data: resendData, error: resendError } = await resend.emails.send(resendPayload);

    if (resendError) {
      console.error('Erreur SDK Resend :', resendError);
      return res.status(400).json({
        error: `Échec d'envoi externe (Resend) : ${resendError.message}`,
      });
    }

    // -------------------------------------------------------------
    // ÉTAPE 2 : ENREGISTREMENT INTERNE DANS SUPABASE
    // -------------------------------------------------------------
    const recipientEmail = toList.join(', ');
    const ccEmail = ccList.join(', ');
    const bccEmail = bccList.join(', ');

    const { data: dbData, error: dbError } = await supabase
      .from('messages')
      .insert([
        {
          sender_email: VERIFIED_SENDER_EMAIL,
          recipient_email: recipientEmail || 'Copie cachée',
          cc_email: ccEmail || null,
          bcc_email: bccEmail || null,
          subject: subject || '(Sans objet)',
          body: bodyText,
          folder: dossier || 'Divers',
          is_read: true,
        },
      ])
      .select();

    if (dbError) {
      console.error('Erreur Supabase BDD :', dbError.message);
      return res.status(207).json({
        warning: "E-mail envoyé vers l'extérieur mais échec d'enregistrement en BDD",
        resend: resendData,
        dbError: dbError.message,
      });
    }

    // -------------------------------------------------------------
    // ÉTAPE 3 : MISE À JOUR SILENCIEUSE DES CONTACTS
    // -------------------------------------------------------------
    const allContacts = Array.from(new Set([...toList, ...ccList, ...bccList]));
    if (allContacts.length > 0) {
      const contactsToUpsert = allContacts.map((email) => ({ email }));
      await supabase
        .from('contacts_uniques')
        .upsert(contactsToUpsert, { onConflict: 'email' });
    }

    // Succès complet
    return res.status(200).json({
      success: true,
      resend: resendData,
      messageRecord: dbData?.[0] || null,
    });
  } catch (error: any) {
    console.error('Erreur interne serveur :', error);
    return res.status(500).json({
      error: error.message || "Erreur interne du serveur lors de la procédure d'envoi",
    });
  }
}