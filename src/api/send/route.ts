import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, body } = await req.json();

    const data = await resend.emails.send({
      from: 'Eric <eric@ftstoulouse.online>',
      to: [to],
      subject: subject,
      text: body,
    });

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}