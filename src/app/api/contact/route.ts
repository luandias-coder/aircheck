import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "Mensagem muito longa (máx 2000 caracteres)" }, { status: 400 });
    }

    await sendEmail({
      to: "oi@aircheck.com.br",
      subject: `[Contato] ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px">
          <h2 style="color:#1A1A1A">Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <hr style="border:none;border-top:1px solid #E5E5E5;margin:16px 0"/>
          <p style="white-space:pre-wrap;color:#374151">${message}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[contact]", e);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
