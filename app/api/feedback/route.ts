import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const { title, description, attachment } = await req.json();

        // Basic validation
        if (!title || !description) {
            return NextResponse.json(
                { error: 'Title and description are required' },
                { status: 400 }
            );
        }

        const attachments = attachment
            ? [
                {
                    content: attachment.split(',')[1], // Remove data URL prefix
                    filename: 'screenshot.png', // Assuming screenshot for now, could be dynamic
                },
            ]
            : [];

        const { data, error } = await resend.emails.send({
            from: 'AnonimiCV Feedback <onboarding@resend.dev>',
            to: ['manbago@gmail.com'],
            subject: `[Feedback 👾] ${title}`,
            html: `
        <div style="font-family: monospace; background: #f4f4f5; padding: 20px; border-radius: 8px;">
          <h2 style="color: #2563eb;">New Feedback Received! 🚀</h2>
          <p><strong>Title:</strong> ${title}</p>
          <hr style="border: 1px dashed #ccc;" />
          <p><strong>Description:</strong></p>
          <pre style="background: #fff; padding: 10px; border-radius: 4px;">${description}</pre>
          <hr style="border: 1px dashed #ccc;" />
          <p style="font-size: 12px; color: #666;">Sent from AnonimiCV Feedback Widget</p>
        </div>
      `,
            attachments,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Feedback error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
