import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";

/**
 * GET /api/detect-provider?domain=suaempresa.com.br
 * 
 * Does MX lookup to detect the actual email provider, even when the domain
 * is custom (e.g., Google Workspace, Microsoft 365).
 * 
 * Returns: { provider: "gmail" | "outlook" | "yahoo" | "other" }
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")?.toLowerCase().trim();
  
  if (!domain) {
    return NextResponse.json({ provider: "other" });
  }

  // Quick check for known domains first (no DNS needed)
  if (["gmail.com", "googlemail.com"].includes(domain)) {
    return NextResponse.json({ provider: "gmail" });
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com", "hotmail.com.br", "outlook.com.br"].includes(domain)) {
    return NextResponse.json({ provider: "outlook" });
  }
  if (["yahoo.com", "yahoo.com.br", "ymail.com"].includes(domain)) {
    return NextResponse.json({ provider: "yahoo" });
  }
  if (["zoho.com", "zohomail.com", "zohomail.eu"].includes(domain)) {
    return NextResponse.json({ provider: "zoho" });
  }

  try {
    const mxRecords = await dns.resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      return NextResponse.json({ provider: "other" });
    }

    // Check MX records for known providers
    const exchanges = mxRecords.map(r => r.exchange.toLowerCase());
    const allExchanges = exchanges.join(" ");

    // Google Workspace: aspmx.l.google.com, alt1.aspmx.l.google.com, *.googlemail.com
    if (allExchanges.includes("google.com") || allExchanges.includes("googlemail.com")) {
      return NextResponse.json({ provider: "gmail" });
    }

    // Microsoft 365: *.mail.protection.outlook.com, *.olc.protection.outlook.com
    if (allExchanges.includes("outlook.com") || allExchanges.includes("microsoft.com")) {
      return NextResponse.json({ provider: "outlook" });
    }

    // Yahoo: *.yahoodns.net, *.am0.yahoodns.net
    if (allExchanges.includes("yahoodns.net") || allExchanges.includes("yahoo.com")) {
      return NextResponse.json({ provider: "yahoo" });
    }

    // Zoho
    if (allExchanges.includes("zoho.com") || allExchanges.includes("zoho.eu")) {
      return NextResponse.json({ provider: "zoho" });
    }

    return NextResponse.json({ provider: "other" });
  } catch (err) {
    // DNS lookup failed (timeout, NXDOMAIN, etc.)
    console.error(`[detect-provider] MX lookup failed for ${domain}:`, err);
    return NextResponse.json({ provider: "other" });
  }
}
