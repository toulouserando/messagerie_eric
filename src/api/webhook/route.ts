import { createClient } from '@supabase/supabase-js';

// Utiliser la service_role key pour écrire sans blocage RLS
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const payload = await req.json();

  // Événement déclenché lors d'un mail entrant
  if (payload.type === 'email.received') {
    const senderEmail = payload.data.from;
    const subject = payload.data.subject;
    const body = payload.data.text;
    const html = payload.data.html;

    // 1. Vérification dans contacts_uniques
    const { data: contact } = await supabase
      .from('contacts_uniques')
      .select('email')
      .eq('email', senderEmail)
      .single();

    // Si le contact n'est PAS dans la liste, on IGNORE le mail
    if (!contact) {
      console.log(`Mail ignoré de : ${senderEmail} (Non présent dans contacts_uniques)`);
      return Response.json({ status: 'ignored' }, { status: 200 });
    }

    // 2. Si le contact EST autorisé, on insère le message dans la boîte de réception
    await supabase.from('messages').insert([{
      sender_email: senderEmail,
      recipient_email: 'eric@ftstoulouse.online',
      subject: subject,
      body: body,
      body_html: html,
      is_read: false,
      is_archived: false,
      is_deleted: false,
    }]);

    return Response.json({ status: 'accepted' }, { status: 200 });
  }

  return Response.json({ status: 'ok' }, { status: 200 });
}