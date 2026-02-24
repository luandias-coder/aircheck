const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";
const FROM_EMAIL = "oi@aircheck.com.br";
const FROM_NAME = "AirCheck";

// ─── SEND EMAIL VIA SENDGRID v3 REST API ────────────────────────
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!SENDGRID_API_KEY) {
    console.warn("[email] SENDGRID_API_KEY not set, skipping email to", to);
    return false;
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });

    if (res.status >= 200 && res.status < 300) {
      console.log(`[email] Sent "${subject}" to ${to}`);
      return true;
    }

    const body = await res.text();
    console.error(`[email] SendGrid error ${res.status}:`, body);
    return false;
  } catch (err) {
    console.error("[email] Failed to send:", err);
    return false;
  }
}

// ─── BASE LAYOUT ────────────────────────────────────────────────
function layout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F5F5F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
  .container{max-width:560px;margin:0 auto;padding:32px 20px}
  .card{background:#fff;border-radius:16px;padding:36px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
  .logo{text-align:center;margin-bottom:24px}
  .logo-text{font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#1A1A1A}
  .logo-text span{color:#3B5FE5}
  h1{font-size:24px;font-weight:700;color:#1A1A1A;margin:0 0 8px;line-height:1.3}
  p{font-size:15px;color:#525252;line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;padding:14px 28px;background:#3B5FE5;color:#fff!important;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;text-align:center}
  .divider{height:1px;background:#E5E5E5;margin:24px 0}
  .footer{text-align:center;padding:20px;font-size:12px;color:#A3A3A3;line-height:1.6}
  .metric{display:inline-block;text-align:center;padding:12px 20px;background:#F5F5F4;border-radius:10px;margin:4px}
  .metric-value{font-size:28px;font-weight:800;color:#3B5FE5;display:block}
  .metric-label{font-size:11px;color:#737373;text-transform:uppercase;letter-spacing:0.06em;margin-top:4px;display:block}
  .stat-row{padding:10px 0;border-bottom:1px solid #F0F0F0;display:flex;justify-content:space-between}
  .stat-row:last-child{border-bottom:none}
  .tag{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}
  @media(max-width:600px){.card{padding:28px 20px}h1{font-size:20px}.metric{padding:10px 14px}}
</style></head><body>
<div class="container">
  <div class="card">
    <div class="logo">
      <div class="logo-text">Air<span>Check</span></div>
    </div>
    ${content}
  </div>
  <div class="footer">
    AirCheck — Check-in automatizado para anfitriões<br>
    <a href="https://aircheck.com.br" style="color:#3B5FE5;text-decoration:none">aircheck.com.br</a>
  </div>
</div>
</body></html>`;
}

// ─── WELCOME EMAIL ──────────────────────────────────────────────
export function welcomeEmail(name: string | null) {
  const firstName = name?.split(" ")[0] || "Anfitrião";
  return {
    subject: `Bem-vindo ao AirCheck, ${firstName}! 🏠`,
    html: layout(`
      <h1>Olá, ${firstName}! 👋</h1>
      <p>Que bom ter você no AirCheck. Estamos aqui para simplificar o check-in dos seus hóspedes e a comunicação com a portaria do condomínio.</p>
      
      <div class="divider"></div>
      
      <p style="font-size:13px;font-weight:600;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Como funciona:</p>
      
      <p><strong style="color:#1A1A1A">1. Encaminhe seus emails</strong><br>
      Configure o Airbnb para encaminhar confirmações de reserva. O AirCheck cria tudo automaticamente.</p>
      
      <p><strong style="color:#1A1A1A">2. Hóspede preenche o formulário</strong><br>
      Um link é gerado para cada reserva. O hóspede envia nome, CPF e foto do documento em menos de 1 minuto.</p>
      
      <p><strong style="color:#1A1A1A">3. Envie para a portaria</strong><br>
      Com um clique, a mensagem formatada vai direto pro WhatsApp do porteiro.</p>
      
      <div class="divider"></div>
      
      <p style="text-align:center;margin-bottom:0">
        <a href="https://aircheck.com.br/dashboard" class="btn">Acessar meu painel →</a>
      </p>
      
      <div class="divider"></div>
      
      <p style="font-size:13px;color:#A3A3A3;text-align:center">Dúvidas ou sugestões? Use a aba <strong style="color:#737373">Feedback</strong> no painel — lemos tudo!</p>
    `),
  };
}

// ─── WEEKLY DIGEST EMAIL ────────────────────────────────────────
interface DigestData {
  name: string | null;
  period: string;
  newReservations: number;
  formsFilled: number;
  sentToDoorman: number;
  pendingForms: number;
  upcomingCheckins: Array<{ guest: string; property: string; date: string; hasForm: boolean }>;
}

export function weeklyDigestEmail(d: DigestData) {
  const firstName = d.name?.split(" ")[0] || "Anfitrião";

  const upcomingRows = d.upcomingCheckins.length > 0
    ? d.upcomingCheckins.map(c => `
      <tr>
        <td style="padding:10px 12px;font-size:14px;color:#1A1A1A;border-bottom:1px solid #F0F0F0">${c.guest}</td>
        <td style="padding:10px 12px;font-size:13px;color:#737373;border-bottom:1px solid #F0F0F0">${c.property}</td>
        <td style="padding:10px 12px;font-size:13px;color:#737373;border-bottom:1px solid #F0F0F0">${c.date}</td>
        <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #F0F0F0">
          <span class="tag" style="background:${c.hasForm ? "#ECFDF5" : "#FFFBEB"};color:${c.hasForm ? "#059669" : "#D97706"}">${c.hasForm ? "✓ Pronto" : "⏳ Pendente"}</span>
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" style="padding:20px;text-align:center;color:#A3A3A3;font-size:13px">Nenhum check-in nos próximos 7 dias</td></tr>`;

  return {
    subject: `Seu resumo semanal — ${d.newReservations} nova${d.newReservations !== 1 ? "s" : ""} reserva${d.newReservations !== 1 ? "s" : ""}`,
    html: layout(`
      <h1>Resumo semanal ☀️</h1>
      <p>Olá, ${firstName}! Aqui está o que aconteceu no AirCheck na última semana (${d.period}).</p>
      
      <div style="text-align:center;margin:20px 0">
        <div class="metric">
          <span class="metric-value">${d.newReservations}</span>
          <span class="metric-label">Novas reservas</span>
        </div>
        <div class="metric">
          <span class="metric-value">${d.formsFilled}</span>
          <span class="metric-label">Forms preenchidos</span>
        </div>
        <div class="metric">
          <span class="metric-value">${d.sentToDoorman}</span>
          <span class="metric-label">Enviados portaria</span>
        </div>
      </div>
      
      ${d.pendingForms > 0 ? `
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin-bottom:20px">
          <p style="margin:0;font-size:14px;color:#D97706"><strong>⚠️ ${d.pendingForms} formulário${d.pendingForms !== 1 ? "s" : ""} pendente${d.pendingForms !== 1 ? "s" : ""}</strong> — hóspede${d.pendingForms !== 1 ? "s" : ""} ainda não preencheu.</p>
        </div>
      ` : ""}
      
      <div class="divider"></div>
      
      <p style="font-size:13px;font-weight:600;color:#1A1A1A;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Próximos check-ins (7 dias)</p>
      
      <table style="width:100%;border-collapse:collapse;font-family:inherit">
        <thead>
          <tr style="background:#FAFAF9">
            <th style="padding:8px 12px;font-size:10px;font-weight:600;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em;text-align:left">Hóspede</th>
            <th style="padding:8px 12px;font-size:10px;font-weight:600;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em;text-align:left">Imóvel</th>
            <th style="padding:8px 12px;font-size:10px;font-weight:600;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em;text-align:left">Data</th>
            <th style="padding:8px 12px;font-size:10px;font-weight:600;color:#A3A3A3;text-transform:uppercase;letter-spacing:0.06em;text-align:center">Form</th>
          </tr>
        </thead>
        <tbody>${upcomingRows}</tbody>
      </table>
      
      <div class="divider"></div>
      
      <p style="text-align:center;margin-bottom:0">
        <a href="https://aircheck.com.br/dashboard" class="btn">Ver painel completo →</a>
      </p>
    `),
  };
}
