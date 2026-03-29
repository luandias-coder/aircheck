"use client";
import { useState, useMemo } from "react";

// ─── TYPES (match dashboard/page.tsx) ───────────────────────────
interface DoormanPhone { id:string; phone:string; name:string|null; label:string|null }
interface Reservation {
  id:string; guestFullName:string; guestPhone:string|null; guestPhotoUrl:string|null;
  checkInDate:string; checkInTime:string; checkOutDate:string; checkOutTime:string;
  numGuests:number; nights:number|null; confirmationCode:string|null; hostPayment:string|null;
  airbnbThreadId:string|null; airbnbThreadUrl:string|null; formToken:string; status:string;
  source?:string; carPlate:string|null; carModel:string|null;
  property:{ id:string; name:string; doormanPhones:DoormanPhone[]; whatsappEnabled?:boolean; condominiumId?:string|null; condominium?:any };
  guests:any[];
}

// ─── PALETTE ────────────────────────────────────────────────────
const B = { primary:"#3B5FE5", light:"#EBF0FF" };
const STATUS_COLORS: Record<string, { bg:string; text:string; border:string }> = {
  pending_form:   { bg:"#FEF3C7", text:"#92400E", border:"#FCD34D" },
  form_filled:    { bg:"#D1FAE5", text:"#065F46", border:"#6EE7B7" },
  sent_to_doorman:{ bg:"#DBEAFE", text:"#1E40AF", border:"#93C5FD" },
  archived:       { bg:"#F3F4F6", text:"#6B7280", border:"#D1D5DB" },
};
const DEFAULT_COLOR = { bg:"#F3F4F6", text:"#374151", border:"#D1D5DB" };

// ─── HELPERS ────────────────────────────────────────────────────
function parseDate(d: string): Date {
  if (!d) return new Date(NaN);
  // ISO format (from Hospitable): "2025-04-03" or "2025-04-03T15:00:00"
  if (d.includes("-")) {
    const iso = d.split("T")[0];
    const [y, m, dd] = iso.split("-").map(Number);
    return new Date(y, m - 1, dd);
  }
  // BR format (from email): "03/04/2025"
  const [dd, mm, yy] = d.split("/").map(Number);
  return new Date(yy, mm - 1, dd);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sunday
}

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_LABELS = ["D","S","T","Q","Q","S","S"];

// ─── COMPONENT ──────────────────────────────────────────────────
export default function CalendarView({ reservations, onSelect }: { reservations: Reservation[]; onSelect: (id: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const goTo = (dir: -1 | 1) => {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setYear(y); setMonth(m);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // Map reservations to their day spans within this month
  const resRows = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    return reservations
      .filter(r => {
        if (r.status === "cancelled") return false;
        const ci = parseDate(r.checkInDate);
        const co = parseDate(r.checkOutDate);
        if (isNaN(ci.getTime()) || isNaN(co.getTime())) return false;
        // Reservation overlaps this month?
        return ci <= monthEnd && co >= monthStart;
      })
      .map(r => {
        const ci = parseDate(r.checkInDate);
        const co = parseDate(r.checkOutDate);
        // Clamp to month bounds
        const startDay = ci < monthStart ? 1 : ci.getDate();
        const endDay = co > monthEnd ? daysInMonth : co.getDate();
        return { ...r, startDay, endDay, ciDate: ci, coDate: co };
      })
      .sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay);
  }, [reservations, year, month, daysInMonth]);

  // Build week rows with reservation bar positions
  const weeks = useMemo(() => {
    const rows: { day: number | null; date: Date | null }[][] = [];
    let dayNum = 1;
    for (let cell = 0; cell < totalCells; cell++) {
      const weekIdx = Math.floor(cell / 7);
      if (!rows[weekIdx]) rows[weekIdx] = [];
      if (cell < firstDay || dayNum > daysInMonth) {
        rows[weekIdx].push({ day: null, date: null });
      } else {
        rows[weekIdx].push({ day: dayNum, date: new Date(year, month, dayNum) });
        dayNum++;
      }
    }
    return rows;
  }, [year, month, daysInMonth, firstDay, totalCells]);

  // For each week, determine which reservations have bars
  const weekBars = useMemo(() => {
    return weeks.map(week => {
      const weekStart = week.find(d => d.day !== null)?.day ?? 0;
      const weekEnd = week.filter(d => d.day !== null).pop()?.day ?? 0;
      if (!weekStart || !weekEnd) return [];

      return resRows
        .filter(r => r.startDay <= weekEnd && r.endDay >= weekStart)
        .map(r => {
          const barStart = Math.max(r.startDay, weekStart);
          const barEnd = Math.min(r.endDay, weekEnd);
          // Column positions (0-indexed within the week's actual days)
          const startCol = week.findIndex(d => d.day === barStart);
          const endCol = week.findIndex(d => d.day === barEnd);
          return { ...r, startCol, endCol, barStart, barEnd };
        });
    });
  }, [weeks, resRows]);

  // Assign vertical slots per week to avoid overlaps
  const weekSlots = useMemo(() => {
    return weekBars.map(bars => {
      const slots: { bar: typeof bars[0]; slot: number }[] = [];
      const occupied: number[][] = []; // occupied[slot] = array of occupied columns

      for (const bar of bars) {
        let slot = 0;
        while (true) {
          if (!occupied[slot]) occupied[slot] = [];
          const conflict = occupied[slot].some(col => col >= bar.startCol && col <= bar.endCol);
          if (!conflict) break;
          slot++;
        }
        for (let c = bar.startCol; c <= bar.endCol; c++) {
          if (!occupied[slot]) occupied[slot] = [];
          occupied[slot].push(c);
        }
        slots.push({ bar, slot });
      }
      return { slots, maxSlot: slots.reduce((m, s) => Math.max(m, s.slot), -1) + 1 };
    });
  }, [weekBars]);

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  return (
    <div style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => goTo(-1)} style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#737373" }}>
          ‹
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A" }}>
            {MONTH_NAMES[month]} {year}
          </span>
          {!isCurrentMonth && (
            <button onClick={goToday} style={{ fontFamily: "Outfit", fontSize: 11, fontWeight: 600, color: B.primary, background: B.light, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
              Hoje
            </button>
          )}
        </div>
        <button onClick={() => goTo(1)} style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#737373" }}>
          ›
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { label: "Pendente", color: STATUS_COLORS.pending_form },
          { label: "Pronta", color: STATUS_COLORS.form_filled },
          { label: "Enviada", color: STATUS_COLORS.sent_to_doorman },
          { label: "Arquivada", color: STATUS_COLORS.archived },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color.bg, border: `1.5px solid ${l.color.border}` }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: "#737373" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 14, overflow: "hidden" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #F0F0F0" }}>
          {DAY_LABELS.map((d, i) => (
            <div key={i} style={{ textAlign: "center", padding: "10px 0", fontSize: 11, fontWeight: 600, color: i === 0 ? "#DC2626" : "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => {
          const slotData = weekSlots[wi];
          const barHeight = 26;
          const barGap = 3;
          const barsAreaHeight = slotData.maxSlot > 0 ? slotData.maxSlot * (barHeight + barGap) : 0;
          const cellMinHeight = 36 + barsAreaHeight;

          return (
            <div key={wi} style={{ position: "relative", borderBottom: wi < weeks.length - 1 ? "1px solid #F0F0F0" : "none" }}>
              {/* Day numbers row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", minHeight: cellMinHeight }}>
                {week.map((cell, ci) => {
                  const isToday = cell.date && isSameDay(cell.date, today);
                  return (
                    <div key={ci} style={{ padding: "6px 0 0", textAlign: "center", background: cell.day === null ? "#FAFAF9" : undefined, borderRight: ci < 6 ? "1px solid #F8F8F8" : "none" }}>
                      {cell.day !== null && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 26, height: 26, borderRadius: "50%", fontSize: 13, fontWeight: isToday ? 700 : 400,
                          color: isToday ? "#fff" : cell.date && cell.date.getDay() === 0 ? "#DC2626" : "#1A1A1A",
                          background: isToday ? B.primary : "transparent",
                        }}>
                          {cell.day}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reservation bars (positioned absolutely) */}
              {slotData.slots.map(({ bar, slot }, bi) => {
                const sc = STATUS_COLORS[bar.status] || DEFAULT_COLOR;
                const isArchived = bar.status === "archived";
                const colWidth = 100 / 7;
                const left = bar.startCol * colWidth;
                const width = (bar.endCol - bar.startCol + 1) * colWidth;
                const top = 34 + slot * (barHeight + barGap);
                const firstName = bar.guestFullName.split(" ")[0];
                const propShort = bar.property.name.length > 12 ? bar.property.name.slice(0, 11) + "…" : bar.property.name;

                // Bar shape: rounded left if reservation starts this week, rounded right if it ends this week
                const startsThisWeek = bar.barStart === bar.startDay;
                const endsThisWeek = bar.barEnd === bar.endDay;
                const borderRadius = `${startsThisWeek ? 6 : 0}px ${endsThisWeek ? 6 : 0}px ${endsThisWeek ? 6 : 0}px ${startsThisWeek ? 6 : 0}px`;

                return (
                  <button
                    key={bar.id + "-" + wi + "-" + bi}
                    onClick={() => onSelect(bar.id)}
                    title={`${bar.guestFullName} · ${bar.property.name} · ${bar.checkInDate} → ${bar.checkOutDate}`}
                    style={{
                      position: "absolute", top, left: `${left}%`, width: `${width}%`, height: barHeight,
                      background: sc.bg, border: `1px solid ${sc.border}`, borderRadius,
                      display: "flex", alignItems: "center", gap: 4, padding: "0 6px",
                      cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap",
                      fontFamily: "Outfit", fontSize: 11, fontWeight: 600, color: sc.text,
                      zIndex: 10, boxSizing: "border-box",
                      opacity: isArchived ? 0.55 : 1,
                      transition: "filter 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.94)")}
                    onMouseLeave={e => (e.currentTarget.style.filter = "none")}
                  >
                    {/* Guest photo or initial */}
                    {startsThisWeek && (
                      bar.guestPhotoUrl ? (
                        <img src={bar.guestPhotoUrl} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${sc.border}` }} />
                      ) : (
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: sc.border, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: sc.text, flexShrink: 0 }}>
                          {bar.guestFullName[0]}
                        </span>
                      )
                    )}
                    {startsThisWeek && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{firstName}</span>}
                    {startsThisWeek && <span style={{ overflow: "hidden", textOverflow: "ellipsis", fontSize: 9, fontWeight: 400, opacity: 0.7 }}>· {propShort}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {resRows.length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: "#A3A3A3" }}>
          <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.3 }}>📅</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Nenhuma reserva em {MONTH_NAMES[month]}</div>
        </div>
      )}
    </div>
  );
}
