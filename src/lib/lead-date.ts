export type LeadDateSource = {
  lead_entry_date?: string | null;
  created_at?: string | null;
};

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function getLeadEffectiveTimestamp(lead: LeadDateSource) {
  return lead.lead_entry_date || lead.created_at || null;
}

export function getInclusiveDayBounds(fromDate: Date, toDate: Date = fromDate) {
  const from = new Date(fromDate);
  from.setHours(0, 0, 0, 0);

  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function getInclusiveDayBoundsFromDateStrings(from: string, to: string = from) {
  return getInclusiveDayBounds(parseDateOnly(from), parseDateOnly(to));
}

export function buildLeadDateFilter(fromIso: string, toIso: string) {
  return `and(lead_entry_date.gte.${fromIso},lead_entry_date.lte.${toIso}),and(lead_entry_date.is.null,created_at.gte.${fromIso},created_at.lte.${toIso})`;
}

export function isLeadWithinBounds(lead: LeadDateSource, fromIso?: string | null, toIso?: string | null) {
  const effectiveTimestamp = getLeadEffectiveTimestamp(lead);
  if (!effectiveTimestamp) return false;

  const leadTime = new Date(effectiveTimestamp).getTime();
  if (Number.isNaN(leadTime)) return false;

  if (fromIso) {
    const fromTime = new Date(fromIso).getTime();
    if (!Number.isNaN(fromTime) && leadTime < fromTime) return false;
  }

  if (toIso) {
    const toTime = new Date(toIso).getTime();
    if (!Number.isNaN(toTime) && leadTime > toTime) return false;
  }

  return true;
}