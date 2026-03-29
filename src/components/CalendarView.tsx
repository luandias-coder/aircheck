"use client";
import { useState, useMemo } from "react";

// ─── TYPES (match dashboard/page.tsx) ───────────────────────────
interface DoormanPhone { id:string; phone:string; name:string|null; label:string|null }
interface PropertyInfo { id:string; name:string; photoUrl?:string|null }
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
const DEFAULT_SC = { bg:"#F3F4F6", text:"#374151", border:"#D1D5DB" };

// ─── HELPERS ────────────────────────────────────────────────────
function parseDate(d: string): Date {
  if (!d) return new Date(NaN);
  if (d.includes("-")) {
    const [y, m, dd] = d.split("T")[0].split("-").map(Number);
    return new Date(y, m - 1, dd);
  }
  const [dd, mm, yy] = d.split("/").map(Number);
  return new Date(yy, mm - 1, dd);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getDaysInMonth(y: number, m: number): number { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfWeek(y: number, m: number): number { return new Date(y, m, 1).getDay(); }

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAY_LABELS = ["D","S","T","Q","Q","S","S"];

// ─── COMPONENT ──────────────────────────────────────────────────
export default function CalendarView({ reservations, properties, onSelect }: {
  reservations: Reservation[];
  properties: PropertyInfo[];
  onSelect: (id: string) => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
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

  // ─── Property lookup with photo ───────────────────────────
  const propLookup = useMemo(() => {
    const map: Record<string, PropertyInfo> = {};
    properties.forEach(p => { map[p.id] = p; });
    return map;
  }, [properties]);

  // ─── Reservations mapped to this month ────────────────────
  const resRows = useMemo(() => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    return reservations
      .filter(r => {
        if (r.status === "cancelled") return false;
        const ci = parseDate(r.checkInDate);
        const co = parseDate(r.checkOutDate);
        if (isNaN(ci.getTime()) || isNaN(co.getTime())) return false;
        return ci <= monthEnd && co >= monthStart;
      })
      .map(r => {
        const ci = parseDate(r.checkInDate);
        const co = parseDate(r.checkOutDate);
        const startDay = ci < monthStart ? 1 : ci.getDate();
        const endDay = co > monthEnd ? daysInMonth : co.getDate();
        const isRealStart = ci >= monthStart;
        const isRealEnd = co <= monthEnd;
        return { ...r, startDay, endDay, isRealStart, isRealEnd };
      });
  }, [reservations, year, month, daysInMonth]);

  // Properties that have reservations this month (sorted)
  const activeProperties = useMemo(() => {
    const ids = new Set(resRows.map(r => r.property.id));
    const list: PropertyInfo[] = [];
    ids.forEach(id => {
      const full = propLookup[id];
      if (full) list.push(full);
      else {
        const fromRes = resRows.find(r => r.property.id === id);
        if (fromRes) list.push({ id, name: fromRes.property.name });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [resRows, propLookup]);

  // ─── Turnover detection (same-day checkout → checkin) ─────
  const turnovers = useMemo(() => {
    const halfStarts = new Set<string>();
    const halfEnds = new Set<string>();

    for (const r of resRows) {
      if (r.isRealStart) {
        const hasPred = resRows.some(o => o.id !== r.id && o.property.id === r.property.id && o.endDay === r.startDay && o.isRealEnd);
        if (hasPred) halfStarts.add(`${r.property.id}-${r.startDay}`);
      }
      if (r.isRealEnd) {
        const hasSucc = resRows.some(o => o.id !== r.id && o.property.id === r.property.id && o.startDay === r.endDay && o.isRealStart);
        if (hasSucc) halfEnds.add(`${r.property.id}-${r.endDay}`);
      }
    }
    return { halfStarts, halfEnds };
  }, [resRows]);

  // ─── Build weeks ──────────────────────────────────────────
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

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const barHeight = 24;
  const propRowHeight = barHeight + 6;
  const thumbSize = 28;
  const gutterWidth = thumbSize + 8;

  return (
    <div style={{ fontFamily: "Outfit, sans-serif" }}>
      {/* Month navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={() => goTo(-1)} style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#737373" }}>‹</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A" }}>{MONTH_NAMES[month]} {year}</span>
          {!isCurrentMonth && (
            <button onClick={goToday} style={{ fontFamily: "Outfit", fontSize: 11, fontWeight: 600, color: B.primary, background: B.light, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Hoje</button>
          )}
        </div>
        <button onClick={() => goTo(1)} style={{ background: "none", border: "1px solid #E5E5E5", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#737373" }}>›</button>
      </div>

      {/* Status legend */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
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
        {/* Day headers — with gutter offset */}
        <div style={{ display: "flex", borderBottom: "1px solid #F0F0F0" }}>
          <div style={{ width: gutterWidth, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ textAlign: "center", padding: "10px 0", fontSize: 11, fontWeight: 600, color: i === 0 ? "#DC2626" : "#A3A3A3", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Week sections */}
        {weeks.map((week, wi) => {
          const weekStart = week.find(d => d.day !== null)?.day ?? 0;
          const weekEnd = week.filter(d => d.day !== null).pop()?.day ?? 0;

          return (
            <div key={wi} style={{ borderBottom: wi < weeks.length - 1 ? "1px solid #F0F0F0" : "none" }}>
              {/* Day numbers */}
              <div style={{ display: "flex" }}>
                <div style={{ width: gutterWidth, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {week.map((cell, ci) => {
                    const isToday = cell.date && isSameDay(cell.date, today);
                    return (
                      <div key={ci} style={{ padding: "6px 0 2px", textAlign: "center", background: cell.day === null ? "#FAFAF9" : undefined, borderRight: ci < 6 ? "1px solid #F8F8F8" : "none" }}>
                        {cell.day !== null && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 24, height: 24, borderRadius: "50%", fontSize: 12, fontWeight: isToday ? 700 : 400,
                            color: isToday ? "#fff" : cell.date!.getDay() === 0 ? "#DC2626" : "#1A1A1A",
                            background: isToday ? B.primary : "transparent",
                          }}>{cell.day}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* One row per property */}
              {activeProperties.map((prop, pi) => {
                const bars = weekStart && weekEnd ? resRows
                  .filter(r => r.property.id === prop.id && r.startDay <= weekEnd && r.endDay >= weekStart)
                  .map(r => {
                    const barStart = Math.max(r.startDay, weekStart);
                    const barEnd = Math.min(r.endDay, weekEnd);
                    const startCol = week.findIndex(d => d.day === barStart);
                    const endCol = week.findIndex(d => d.day === barEnd);
                    const isRealStartInWeek = barStart === r.startDay;
                    const isRealEndInWeek = barEnd === r.endDay;
                    const isHalfStart = isRealStartInWeek && turnovers.halfStarts.has(`${r.property.id}-${r.startDay}`);
                    const isHalfEnd = isRealEndInWeek && turnovers.halfEnds.has(`${r.property.id}-${r.endDay}`);
                    return { ...r, startCol, endCol, barStart, barEnd, isRealStartInWeek, isRealEndInWeek, isHalfStart, isHalfEnd };
                  }) : [];

                const hasBars = bars.length > 0;

                return (
                  <div key={prop.id} style={{ display: "flex", height: propRowHeight, background: pi % 2 === 1 ? "#FAFBFC" : undefined }}>
                    {/* Property thumbnail */}
                    <div style={{ width: gutterWidth, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {hasBars && (
                        prop.photoUrl ? (
                          <img src={prop.photoUrl} alt={prop.name} title={prop.name} style={{ width: thumbSize, height: thumbSize, borderRadius: 6, objectFit: "cover", border: "1.5px solid #E5E5E5" }} />
                        ) : (
                          <div title={prop.name} style={{ width: thumbSize, height: thumbSize, borderRadius: 6, background: B.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: B.primary, border: "1.5px solid #E5E5E5" }}>
                            {prop.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                          </div>
                        )
                      )}
                    </div>

                    {/* Bars area */}
                    <div style={{ flex: 1, position: "relative" }}>
                      {bars.map((bar, bi) => {
                        const sc = STATUS_COLORS[bar.status] || DEFAULT_SC;
                        const isArchived = bar.status === "archived";
                        const colWidth = 100 / 7;

                        let leftPct = bar.startCol * colWidth;
                        let rightPct = (bar.endCol + 1) * colWidth;
                        if (bar.isHalfStart) leftPct += colWidth / 2;
                        if (bar.isHalfEnd) rightPct -= colWidth / 2;
                        const widthPct = rightPct - leftPct;

                        const startsThisWeek = bar.isRealStartInWeek;
                        const endsThisWeek = bar.isRealEndInWeek;
                        const borderRadius = `${startsThisWeek ? 6 : 0}px ${endsThisWeek ? 6 : 0}px ${endsThisWeek ? 6 : 0}px ${startsThisWeek ? 6 : 0}px`;

                        const firstName = bar.guestFullName.split(" ")[0];

                        return (
                          <button
                            key={bar.id + "-" + wi + "-" + bi}
                            onClick={() => onSelect(bar.id)}
                            title={`${bar.guestFullName} · ${bar.property.name} · ${bar.checkInDate} → ${bar.checkOutDate}`}
                            style={{
                              position: "absolute", top: 3, left: `${leftPct}%`, width: `${widthPct}%`, height: barHeight,
                              background: sc.bg, border: `1px solid ${sc.border}`, borderRadius,
                              display: "flex", alignItems: "center", gap: 4, padding: "0 5px",
                              cursor: "pointer", overflow: "hidden", whiteSpace: "nowrap",
                              fontFamily: "Outfit", fontSize: 11, fontWeight: 600, color: sc.text,
                              zIndex: 10, boxSizing: "border-box",
                              opacity: isArchived ? 0.5 : 1,
                              transition: "filter 0.15s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.94)")}
                            onMouseLeave={e => (e.currentTarget.style.filter = "none")}
                          >
                            {startsThisWeek && (
                              bar.guestPhotoUrl ? (
                                <img src={bar.guestPhotoUrl} alt="" style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${sc.border}` }} />
                              ) : (
                                <span style={{ width: 16, height: 16, borderRadius: "50%", background: sc.border, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: sc.text, flexShrink: 0 }}>
                                  {bar.guestFullName[0]}
                                </span>
                              )
                            )}
                            {startsThisWeek && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{firstName}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
