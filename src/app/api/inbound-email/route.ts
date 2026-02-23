import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAirbnbEmail } from "@/lib/parser";

// This webhook receives emails forwarded via SendGrid Inbound Parse, Mailgun, or similar.
// The email service sends a POST with the email content.
// We look up the sender's email to find which user it belongs to, then parse and create a reservation.

// Verify webhook secret (optional but recommended)
const WEBHOOK_SECRET = process.env.INBOUND_EMAIL_SECRET || "";

export async function POST(req: NextRequest) {
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
    let fromEmail = "";
    let emailText = "";

    if (contentType.includes("multipart/form-data")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData();
      fromEmail = (formData.get("from") as string) || "";
      emailText = (formData.get("text") as string) || (formData.get("html") as string) || "";
      // Extract email from "Name <email@domain.com>" format
      const emailMatch = fromEmail.match(/<([^>]+)>/);
      if (emailMatch) fromEmail = emailMatch[1];

      // If no plain text, try subject + text combined
      if (!emailText) {
        const subject = (formData.get("subject") as string) || "";
        emailText = subject + "\n" + ((formData.get("text") as string) || "");
      }
    } else {
      // JSON format (Mailgun, custom, or direct API call)
      const body = await req.json();
      fromEmail = body.from || body.sender || body.envelope?.from || "";
      emailText = body.text || body.body || body["body-plain"] || body.html || "";

      // Also support direct text submission
      if (body.emailText) emailText = body.emailText;
      if (body.fromEmail) fromEmail = body.fromEmail;

      const emailMatch = fromEmail.match(/<([^>]+)>/);
      if (emailMatch) fromEmail = emailMatch[1];
    }

    fromEmail = fromEmail.toLowerCase().trim();

    if (!emailText) {
      return NextResponse.json({ error: "Email vazio" }, { status: 400 });
    }

    // Find user by their registered inbound email
    let userId: string | null = null;

    if (fromEmail) {
      // Look up: which user has this email configured as an inbound email?
      const inbound = await prisma.userInboundEmail.findFirst({
        where: { email: fromEmail },
        select: { userId: true },
      });
      if (inbound) userId = inbound.userId;
    }

    if (!userId) {
      // If only one user exists (single-tenant mode), use that user
      const users = await prisma.user.findMany({ take: 2, select: { id: true } });
      if (users.length === 1) {
        userId = users[0].id;
      } else {
        return NextResponse.json({
          error: "Remetente não reconhecido. Configure o email nas configurações.",
          from: fromEmail,
        }, { status: 422 });
      }
    }

    // Parse the email
    const { results, errors } = parseAirbnbEmail(emailText);
    if (results.confidence === "low") {
      return NextResponse.json({ error: "Não foi possível extrair dados suficientes", errors }, { status: 422 });
    }

    // Find or create property
    const propName = results.propertyName || "Imóvel não identificado";
    let property = await prisma.property.findUnique({
      where: { userId_name: { userId, name: propName } },
    });
    if (!property) {
      property = await prisma.property.create({ data: { userId, name: propName } });
    }

    // Check for duplicate (same confirmation code)
    if (results.confirmationCode) {
      const existing = await prisma.reservation.findFirst({
        where: { userId, confirmationCode: results.confirmationCode },
      });
      if (existing) {
        return NextResponse.json({ message: "Reserva já existe", reservationId: existing.id }, { status: 200 });
      }
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        propertyId: property.id,
        guestFullName: results.guestFullName || "Hóspede",
        checkInDate: results.checkInDate || "",
        checkInTime: results.checkInTime || "15:00",
        checkOutDate: results.checkOutDate || "",
        checkOutTime: results.checkOutTime || "12:00",
        numGuests: results.numGuests || 1,
        nights: results.nights,
        confirmationCode: results.confirmationCode,
        hostPayment: results.hostPayment,
        guestMessage: results.guestMessage,
        status: "pending_form",
      },
    });

    return NextResponse.json({
      success: true,
      reservationId: reservation.id,
      guest: results.guestFullName,
      property: propName,
      confidence: results.confidence,
    });
  } catch (e) {
    console.error("Inbound email error:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
