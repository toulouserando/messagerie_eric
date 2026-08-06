import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase avec la Service Role Key (nécessaire pour lire/écrire)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extraction propre de l'adresse e-mail (ex: "John Doe <john@example.com>" => "john@example.com")
function extractEmail(rawEmail: string): string {
  if (!rawEmail) return '';
  const match = rawEmail.match(/<([^>]+)>/);
  return (match ? match[1] : rawEmail).trim().toLowerCase();
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

    // 1. VÉRIFICATION LISTE BLANCHE : L'expéditeur est-il dans contacts_uniques ?
    const { data: contact, error: contactError } = await supabase
      .from('contacts_uniques')
      .select('email')
      .eq('email', cleanSender)
      .maybeSingle();

    if (contactError) {
      console.error('Erreur vérification contacts_uniques :', contactError.message);
    }

    // 2. Si le contact n'est PAS dans ta base, ON REJETTE LE MESSAGE (Anti-Spam)
    if (!contact) {
      console.log(`[Anti-Spam] Message bloqué de : ${cleanSender} (Absent de contacts_uniques)`);
      return res.status(200).json({ status: 'ignored', reason: 'Expéditeur non autorisé' });
    }

    // 3. Contact autorisé : Enregistrement dans Supabase avec la structure SQL exacte
    const rawRecipient = Array.isArray(emailData.to) ? emailData.to[0] : (emailData.to || '');
    const cleanRecipient = extractEmail(rawRecipient) || 'eric@ftstoulouse.online';

    const objet = emailData.subject || '(Sans objet)';
    const messageTxt = emailData.text || emailData.html || '';

    const { data, error: insertError } = await supabase.from('messages').insert([
      {
        sender_email: cleanSender,
        recipient_email: cleanRecipient,
        subject: objet,
        body: messageTxt,
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