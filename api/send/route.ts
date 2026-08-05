import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, text, body } = await req.json();

    // Validation minimale des champs obligatoires
    if (!to) {
      return Response.json(
        { error: 'Le champ destinataire (to) est requis.' },
        { status: 400 }
      );
    }

    // Envoi via l'API Resend
    const { data, error } = await resend.emails.send({
      from: 'Eric <eric@ftstoulouse.online>',
      to: Array.isArray(to) ? to : [to],
      subject: subject || '(Sans objet)',
      text: text || body || '',
    });

    // Gestion de l'erreur renvoyée par le SDK Resend (quota, rejet, etc.)
    if (error) {
      console.error('Erreur retournée par le SDK Resend :', error);
      return Response.json({ error }, { status: 400 });
    }

    // Succès
    return Response.json(data, { status: 200 });

  } catch (error: any) {
    // Gestion des erreurs serveur (ex: JSON invalide, problème réseau)
    console.error('Erreur serveur API /api/send :', error);
    return Response.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}