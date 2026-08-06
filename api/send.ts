import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialisation des SDKs côté serveur
const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { to, subject, text, message, expediteur } = req.body;
    const bodyText = text || message || '';
    const senderEmail = expediteur || 'eric@ftstoulouse.online';

    if (!to) {
      return res.status(400).json({ error: 'Le champ destinataire (to) est requis.' });
    }

    // -------------------------------------------------------------
    // ÉTAPE 1 : ENVOI EXTERNE VIA RESEND
    // -------------------------------------------------------------
    const { data: resendData, error: resendError } = await resend.emails.send({
      from: 'Eric <eric@ftstoulouse.online>',
      to: Array.isArray(to) ? to : [to],
      subject: subject || '(Sans objet)',
      text: bodyText,
      html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`,
    });

    if (resendError) {
      console.error('Erreur SDK Resend :', resendError);
      return res.status(400).json({ 
        error: `Échec d'envoi externe (Resend) : ${resendError.message}` 
      });
    }

    // -------------------------------------------------------------
    // ÉTAPE 2 : ENREGISTREMENT INTERNE DANS SUPABASE
    // -------------------------------------------------------------
    const recipientEmail = Array.isArray(to) ? to[0] : to;

    const { data: dbData, error: dbError } = await supabase
      .from('messages')
      .insert([
        {
          sender_email: senderEmail,
          recipient_email: recipientEmail,
          subject: subject || '(Sans objet)',
          body: bodyText,
          is_read: true,
        },
      ])
      .select();

    if (dbError) {
      console.error('Erreur Supabase BDD :', dbError.message);
      // L'e-mail est parti mais la BDD n'a pas pu être mise à jour
      return res.status(207).json({
        warning: 'E-mail envoyé vers l\'extérieur mais échec d\'enregistrement en BDD',
        resend: resendData,
        dbError: dbError.message,
      });
    }

    // -------------------------------------------------------------
    // ÉTAPE 3 : MISE À JOUR SILENCIEUSE DES CONTACTS
    // -------------------------------------------------------------
    await supabase
      .from('contacts_uniques')
      .upsert({ email: recipientEmail }, { onConflict: 'email' });

    // Succès complet (externe + interne)
    return res.status(200).json({
      success: true,
      resend: resendData,
      messageRecord: dbData?.[0] || null,
    });

  } catch (error: any) {
    console.error('Erreur interne serveur :', error);
    return res.status(500).json({ 
      error: error.message || 'Erreur interne du serveur lors de la procédure d\'envoi' 
    });
  }
}