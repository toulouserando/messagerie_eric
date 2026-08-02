import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, text, body } = await req.json();

    const data = await resend.emails.send({
      from: 'Eric <eric@ftstoulouse.online>',
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      text: text || body || '', // Accepte 'text' ou 'body' selon l'appelant
    });

    return Response.json(data);
  } catch (error: any) {
    console.error("Erreur Resend backend :", error);
    return Response.json({ error: error.message || error }, { status: 500 });
  }
}