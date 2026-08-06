import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialisation de Supabase avec la Service Role Key (contourne RLS)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Accepter uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const payload = req.body;

    // Événement déclenché lors de la réception d'un e-mail
    if (payload?.type === 'email.received') {
      const senderEmail = payload.data?.from;
      const subject = payload.data?.subject;
      const body = payload.data?.text;
      const html = payload.data?.html;

      if (!senderEmail) {
        return res.status(400).json({ error: 'Expéditeur (from) manquant' });
      }

      // 1. Vérification dans contacts_uniques
      const { data: contact } = await supabase
        .from('contacts_uniques')
        .select('email')
        .eq('email', senderEmail)
        .single();

      // Si le contact n'est PAS dans la liste, on ignore le message
      if (!contact) {
        console.log(`Mail ignoré de : ${senderEmail} (Non présent dans contacts_uniques)`);
        return res.status(200).json({ status: 'ignored' });
      }

      // 2. Si le contact EST autorisé, insertion dans la table messages
      const { error: insertError } = await supabase.from('messages').insert([
        {
          sender_email: senderEmail,
          recipient_email: 'eric@ftstoulouse.online',
          subject: subject || '(Sans objet)',
          body: body || '',
          body_html: html || null,
          is_read: false,
          is_archived: false,
          is_deleted: false,
        },
      ]);

      if (insertError) {
        console.error('Erreur insertion Supabase Webhook :', insertError.message);
        return res.status(500).json({ error: insertError.message });
      }

      return res.status(200).json({ status: 'accepted' });
    }

    return res.status(200).json({ status: 'ok' });

  } catch (error: any) {
    console.error('Erreur interne du Webhook :', error);
    return res.status(500).json({ 
      error: error.message || 'Erreur interne lors du traitement du webhook' 
    });
  }
}