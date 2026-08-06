import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function extractEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  const match = rawEmail.match(/<([^>]+)>/);
  return (match ? match[1] : rawEmail).trim().toLowerCase();
}

// Fonction pour récupérer le contenu textuel du mail via l'API Resend
async function fetchResendEmailBody(emailId: string): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
  if (!apiKey || !emailId) return '';

  try {
    let res = await fetch(`https://api.resend.com/emails/received/${emailId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      res = await fetch(`https://api.resend.com/emails/${emailId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    }

    if (res.ok) {
      const data = await res.json();
      return data.text || data.html || '';
    }
  } catch (e) {
    console.error('Erreur lors de la récupération du corps de mail Resend :', e);
  }
  return '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const payload = req.body;

    if (payload?.type !== 'email.received') {
      return res.status(200).json({ message: 'Événement ignoré (non email.received)' });
    }

    const emailData = payload.data || {};
    const rawSender = emailData.from || '';
    const cleanSender = extractEmail(rawSender);

    if (!cleanSender) {
      return res.status(400).json({ error: 'Adresse expéditeur manquante' });
    }

    // 1. Filtre liste blanche (contacts_uniques)
    const { data: contact, error: contactError } = await supabase
      .from('contacts_uniques')
      .select('email')
      .eq('email', cleanSender)
      .maybeSingle();

    if (contactError) {
      console.error('Erreur vérification contacts_uniques :', contactError.message);
    }

    if (!contact) {
      console.log(`[Anti-Spam] Message bloqué de : ${cleanSender} (Absent de contacts_uniques)`);
      return res.status(200).json({ status: 'ignored', reason: 'Expéditeur non autorisé' });
    }

    // 2. Extraction du corps du message
    let messageBody = emailData.text || emailData.html || '';

    // Si le corps est vide dans le payload du webhook, on interroge l'API Resend
    if (!messageBody && emailData.email_id) {
      messageBody = await fetchResendEmailBody(emailData.email_id);
    }

    const rawRecipient = Array.isArray(emailData.to) ? emailData.to[0] : (emailData.to || '');
    const cleanRecipient = extractEmail(rawRecipient) || 'eric@ftstoulouse.online';
    const objet = emailData.subject || '(Sans objet)';

    // 3. Insertion dans Supabase avec les noms de colonnes exacts
    const { data, error: insertError } = await supabase.from('messages').insert([
      {
        sender_email: cleanSender,
        recipient_email: cleanRecipient,
        subject: objet,
        body: messageBody || '(Message vide)',
        theme: 'Général',
        is_read: false,
        is_visible: true,
        is_deleted: false,
      },
    ]).select();

    if (insertError) {
      console.error('Erreur insertion message :', insertError.message);
      return res.status(500).json({ error: insertError.message });
    }

    console.log(`[Message Reçu] Mail de ${cleanSender} accepté et enregistré.`);
    return res.status(200).json({ success: true, inserted: data });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur serveur Webhook :', errorMessage);
    return res.status(500).json({ error: errorMessage });
  }
}