import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAirbnbEmail } from "@/lib/parser";

const WEBHOOK_SECRET = process.env.INBOUND_EMAIL_SECRET || "";

export async function POST(req: NextRequest) {
  let fromEmail = "";
  let toEmail = "";
  let subject = "";
  let textBody = "";
  let htmlBody = "";
  let rawPayload = "";
  let logId = "";

  try {
    // Check secret if configured
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get("authorization");
      const querySecret = req.nextUrl.searchParams.get("secret");
      if (authHeader !== `Bearer ${WEBHOOK_SECRET}` && querySecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData();
      
      // Extract all fields
      fromEmail = (formData.get("from") as string) || "";
      toEmail = (formData.get("to") as string) || "";
      subject = (formData.get("subject") as string) || "";
      textBody = (formData.get("text") as string) || "";
      htmlBody = (formData.get("html") as string) || "";
      
      // Build raw payload from all form fields
      const payloadObj: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          payloadObj[key] = value;
        } else {
          payloadObj[key] = `[File: ${(value as File).name}, ${(value as File).size} bytes]`;
        }
      });
      rawPayload = JSON.stringify(payloadObj, null, 2);
      
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = fromEmail.match(/<([^>]+)>/);
      if (emailMatch) fromEmail = emailMatch[1];
    } else {
      // JSON format
      const body = await req.json();
      rawPayload = JSON.stringify(body, null, 2);
      fromEmail = body.from || body.sender || body.envelope?.from || "";
      toEmail = body.to || body.recipient || "";
      subject = body.subject || "";
      textBody = body.text || body.body || body["body-plain"] || "";
      htmlBody = body.html || body["body-html"] || "";

      if (body.emailText) textBody = body.emailText;
      if (body.fromEmail) fromEmail = body.fromEmail;

      const emailMatch = fromEmail.match(/<([^>]+)>/);
      if (emailMatch) fromEmail = emailMatch[1];
    }

    fromEmail = fromEmail.toLowerCase().trim();

    // Log the email immediately (even before parsing)
    const log = await prisma.inboundEmailLog.create({
      data: {
        fromEmail,
        toEmail: toEmail || null,
        subject: subject || null,
        textBody: textBody || null,
        htmlBody: htmlBody ? htmlBody.slice(0, 50000) : null, // cap at 50k chars
        rawPayload: rawPayload ? rawPayload.slice(0, 100000) : null, // cap at 100k
        status: "received",
      },
    });
    logId = log.id;

    // ── Gmail Forwarding Confirmation ────────────────────────
    // Intercept emails from forwarding-noreply@google.com
    // Extract confirmation code + host email, save for onboarding polling
    if (fromEmail === "forwarding-noreply@google.com") {
      const emailContent = textBody || htmlBody || "";
      
      // Extract confirmation code (numeric, typically 9 digits)
      const codeMatch = emailContent.match(/(?:Confirmation code|Código de confirmação|código de verificação)[:\s]+(\d{5,12})/i)
        || emailContent.match(/(\d{7,12})/); // fallback: grab first long number
      const code = codeMatch ? codeMatch[1] : null;

      // Extract host email from subject or body
      // Subject: "Gmail Forwarding Confirmation - Receive Mail from user@example.com"
      // Body: "user@example.com has requested to automatically forward mail..."
      let hostEmail: string | null = null;
      const subjectEmailMatch = subject.match(/from\s+([^\s<>]+@[^\s<>]+)/i);
      if (subjectEmailMatch) hostEmail = subjectEmailMatch[1].toLowerCase().trim();
      if (!hostEmail) {
        const bodyEmailMatch = emailContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:has requested|solicitou)/i);
        if (bodyEmailMatch) hostEmail = bodyEmailMatch[1].toLowerCase().trim();
      }
      // Fallback: find any email that isn't aircheck/google
      if (!hostEmail) {
        const allEmails = emailContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        hostEmail = allEmails.find(e => !e.includes("aircheck") && !e.includes("airchk") && !e.includes("google")) || null;
      }

      await prisma.inboundEmailLog.update({
        where: { id: logId },
        data: {
          status: "gmail_verification",
          parsedData: JSON.stringify({ code, hostEmail }, null, 2),
        },
      });

      return NextResponse.json({
        success: true,
        action: "gmail_verification",
        code,
        hostEmail,
        logId,
      });
    }

    // ── Normal email processing ──────────────────────────────

    // Use text body for parsing, fall back to html
    const emailContent = textBody || htmlBody || "";

    if (!emailContent) {
      await prisma.inboundEmailLog.update({
        where: { id: logId },
        data: { status: "error", error: "Email vazio — sem corpo de texto" },
      });
      return NextResponse.json({ error: "Email vazio", logId }, { status: 400 });
    }

    // Find user
    let userId: string | null = null;

    if (fromEmail) {
      const inbound = await prisma.userInboundEmail.findFirst({
        where: { email: fromEmail },
        select: { userId: true },
      });
      if (inbound) userId = inbound.userId;
    }

    if (!userId) {
      const users = await prisma.user.findMany({ take: 2, select: { id: true } });
      if (users.length === 1) {
        userId = users[0].id;
      } else {
        await prisma.inboundEmailLog.update({
          where: { id: logId },
          data: { status: "error", error: `Remetente não reconhecido: ${fromEmail}` },
        });
        return NextResponse.json({ error: "Remetente não reconhecido", from: fromEmail, logId }, { status: 422 });
      }
    }

    // Parse
    const { results, errors } = parseAirbnbEmail(emailContent);

    // Save parsed data to log
    await prisma.inboundEmailLog.update({
      where: { id: logId },
      data: { parsedData: JSON.stringify({ results, errors }, null, 2) },
    });

    // ── Handle cancellation ──────────────────────────────────
    if (results.isCancellation) {
      if (results.confirmationCode) {
        const existing = await prisma.reservation.findFirst({
          where: { userId, confirmationCode: results.confirmationCode },
        });
        if (existing) {
          await prisma.reservation.update({
            where: { id: existing.id },
            data: { status: "cancelled" },
          });
          await prisma.inboundEmailLog.update({
            where: { id: logId },
            data: { status: "cancellation", reservationId: existing.id },
          });
          return NextResponse.json({
            success: true,
            action: "cancelled",
            reservationId: existing.id,
            confirmationCode: results.confirmationCode,
            logId,
          });
        } else {
          // Cancellation received but no matching reservation found
          await prisma.inboundEmailLog.update({
            where: { id: logId },
            data: {
              status: "cancellation_orphan",
              error: `Cancelamento recebido mas reserva não encontrada: ${results.confirmationCode}`,
            },
          });
          return NextResponse.json({
            message: "Cancelamento recebido mas reserva não encontrada",
            confirmationCode: results.confirmationCode,
            logId,
          }, { status: 200 });
        }
      } else {
        // Cancellation without confirmation code — try matching by guest name
        if (results.guestFullName) {
          const existing = await prisma.reservation.findFirst({
            where: {
              userId,
              guestFullName: results.guestFullName,
              status: { not: "cancelled" },
            },
            orderBy: { createdAt: "desc" },
          });
          if (existing) {
            await prisma.reservation.update({
              where: { id: existing.id },
              data: { status: "cancelled" },
            });
            await prisma.inboundEmailLog.update({
              where: { id: logId },
              data: { status: "cancellation", reservationId: existing.id },
            });
            return NextResponse.json({
              success: true,
              action: "cancelled",
              reservationId: existing.id,
              matchedBy: "guestName",
              logId,
            });
          }
        }
        await prisma.inboundEmailLog.update({
          where: { id: logId },
          data: {
            status: "cancellation_orphan",
            error: "Cancelamento recebido mas sem código ou hóspede para match",
          },
        });
        return NextResponse.json({
          message: "Cancelamento recebido mas não foi possível identificar a reserva",
          logId,
        }, { status: 200 });
      }
    }

    if (results.confidence === "low") {
      await prisma.inboundEmailLog.update({
        where: { id: logId },
        data: { status: "parse_failed", error: `Confiança baixa. Erros: ${errors.join(", ")}` },
      });
      return NextResponse.json({ error: "Não foi possível extrair dados suficientes", errors, logId }, { status: 422 });
    }

    // Find or create property (try airbnbRoomId first, then name)
    const propName = results.propertyName || "Imóvel não identificado";
    let property = null;
    if (results.airbnbRoomId) {
      property = await prisma.property.findFirst({
        where: { userId, airbnbRoomId: results.airbnbRoomId },
      });
      // Update name if we have a better one
      if (property && results.propertyName && property.name !== results.propertyName) {
        property = await prisma.property.update({
          where: { id: property.id },
          data: { name: results.propertyName },
        });
      }
    }
    if (!property) {
      property = await prisma.property.findUnique({
        where: { userId_name: { userId, name: propName } },
      });
    }
    if (!property) {
      property = await prisma.property.create({
        data: { userId, name: propName, airbnbRoomId: results.airbnbRoomId || null },
      });
    } else if (results.airbnbRoomId && !property.airbnbRoomId) {
      property = await prisma.property.update({
        where: { id: property.id },
        data: { airbnbRoomId: results.airbnbRoomId },
      });
    }

    // Check duplicate
    if (results.confirmationCode) {
      const existing = await prisma.reservation.findFirst({
        where: { userId, confirmationCode: results.confirmationCode },
      });
      if (existing) {
        await prisma.inboundEmailLog.update({
          where: { id: logId },
          data: { status: "duplicate", reservationId: existing.id, error: `Duplicata: ${results.confirmationCode}` },
        });
        return NextResponse.json({ message: "Reserva já existe", reservationId: existing.id, logId }, { status: 200 });
      }
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        propertyId: property.id,
        guestFullName: results.guestFullName || "Hóspede",
        guestPhotoUrl: results.guestPhotoUrl || null,
        checkInDate: results.checkInDate || "",
        checkInTime: results.checkInTime || "15:00",
        checkOutDate: results.checkOutDate || "",
        checkOutTime: results.checkOutTime || "12:00",
        numGuests: results.numGuests || 1,
        nights: results.nights,
        confirmationCode: results.confirmationCode,
        hostPayment: results.hostPayment,
        airbnbThreadId: results.airbnbThreadId || null,
        airbnbThreadUrl: results.airbnbThreadUrl || null,
        status: "pending_form",
      },
    });

    // Update log with success
    await prisma.inboundEmailLog.update({
      where: { id: logId },
      data: { status: "success", reservationId: reservation.id },
    });

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      guest: results.guestFullName,
      property: propName,
      confidence: results.confidence,
      logId,
    });
  } catch (e: any) {
    console.error("Inbound email error:", e);

    // Try to update log with error
    if (logId) {
      try {
        await prisma.inboundEmailLog.update({
          where: { id: logId },
          data: { status: "error", error: e.message || "Erro interno" },
        });
      } catch {}
    } else {
      // Create error log if we couldn't even create the initial log
      try {
        await prisma.inboundEmailLog.create({
          data: { fromEmail: fromEmail || "unknown", status: "error", error: e.message || "Erro interno" },
        });
      } catch {}
    }

    return NextResponse.json({ error: "Erro interno", logId }, { status: 500 });
  }
}
