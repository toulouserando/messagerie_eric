import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase avec la clé Service Role pour écrire en BDD
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Autoriser uniquement la méthode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const payload = req.body;

    // 2. Vérifier que l'événement est bien "email.received"
    if (payload.type !== 'email.received') {
      return res.status(200).json({ message: 'Événement ignoré (non email.received)' });
    }

    const emailData = payload.data;

    // Extraction des données de l'e-mail
    const expediteur = emailData.from || '';
    const destinataire = Array.isArray(emailData.to) ? emailData.to.join(', ') : (emailData.to || '');
    const objet = emailData.subject || '(Sans objet)';
    const messageTxt = emailData.text || '';
    const messageHtml = emailData.html || undefined;

    // 3. Insertion de l'e-mail entrant dans Supabase
    const { data, error } = await supabase.from('messages').insert([
      {
        sender_email: expediteur,
        recipient_email: destinataire,
        subject: objet,
        body: messageTxt,
        body_html: messageHtml,
        theme: 'Général',
        is_read: false,
        is_archived: false,
        is_deleted: false,
      },
    ]).select();

    if (error) {
      console.error('Erreur insertion Supabase Webhook :', error.message);
      return res.status(500).json({ error: error.message });
    }

    // 4. Mettre à jour la table des contacts uniques
    if (expediteur) {
      const emailOnly = expediteur.includes('<') 
        ? expediteur.match(/<([^>]+)>/)?.[1] || expediteur 
        : expediteur;

      await supabase
        .from('contacts_uniques')
        .upsert({ email: emailOnly.trim().toLowerCase() }, { onConflict: 'email' });
    }

    return res.status(200).json({ success: true, inserted: data });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur serveur Webhook :', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}