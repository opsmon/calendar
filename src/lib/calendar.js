export const emptyEvent = {
  title: "",
  description: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  allDay: false,
  format: "offline",
  location: "",
  eventUrl: "",
  registrationUrl: "",
  organizer: "",
  reminder: "none",
};

export const fieldIds = {
  title: "title",
  description: "description",
  startDate: "start-date",
  startTime: "start-time",
  endDate: "end-date",
  endTime: "end-time",
  allDay: "all-day",
  format: "format",
  location: "location",
  eventUrl: "event-url",
  registrationUrl: "registration-url",
  organizer: "organizer",
  reminder: "reminder",
};

const reminderDurations = {
  PT10M: "-PT10M",
  PT30M: "-PT30M",
  PT1H: "-PT1H",
  P1D: "-P1D",
  P1W: "-P1W",
};

export function normalizeEvent(value = {}) {
  return {
    ...emptyEvent,
    ...value,
    title: String(value.title || "").trim(),
    description: String(value.description || "").trim(),
    startDate: String(value.startDate || ""),
    startTime: String(value.startTime || ""),
    endDate: String(value.endDate || ""),
    endTime: String(value.endTime || ""),
    allDay: Boolean(value.allDay),
    format: String(value.format || "offline"),
    location: String(value.location || "").trim(),
    eventUrl: String(value.eventUrl || "").trim(),
    registrationUrl: String(value.registrationUrl || "").trim(),
    organizer: String(value.organizer || "").trim(),
    reminder: String(value.reminder || "none"),
  };
}

export function validateEvent(data, messages) {
  const errors = {};

  if (!data.title) {
    errors.title = messages.title;
  }

  if (!data.startDate) {
    errors.startDate = messages.startDate;
  }

  if (!data.allDay && !data.startTime) {
    errors.startTime = messages.startTime;
  }

  if ((data.format === "offline" || data.format === "hybrid") && !data.location) {
    errors.location = messages.location;
  }

  if (data.eventUrl && !isValidHttpUrl(data.eventUrl)) {
    errors.eventUrl = messages.eventUrl;
  }

  if (data.registrationUrl && !isValidHttpUrl(data.registrationUrl)) {
    errors.registrationUrl = messages.registrationUrl;
  }

  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = messages.endDateBeforeStart;
  }

  if (!data.allDay && data.startDate && data.startTime) {
    const start = makeLocalDate(data.startDate, data.startTime);
    const end = getEndDateTime(data);

    if (end && end < start) {
      errors.endTime = messages.endTimeBeforeStart;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function hasEventContent(data) {
  return [
    data.title,
    data.startDate,
    data.startTime,
    data.endDate,
    data.endTime,
    data.description,
    data.location,
    data.eventUrl,
    data.registrationUrl,
    data.organizer,
  ].some(Boolean);
}

export function buildMapLinks(address) {
  const encodedAddress = encodeURIComponent(address.trim());

  return {
    apple: `https://maps.apple.com/?q=${encodedAddress}`,
    google: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    yandex: `https://yandex.ru/maps/?text=${encodedAddress}`,
    twoGis: `https://2gis.ru/search/${encodedAddress}`,
  };
}

export function generateICS(data, options) {
  const description = buildDescription(data, options.descriptionLabels, options.getFormatLabel);
  const uid = `${Date.now()}-${cryptoRandom()}@v-kalendar`;
  const productName = options.language === "ru" ? "В календарь" : "Add to Calendar";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${productName}//ICS Generator//${options.language.toUpperCase()}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
  ];

  if (data.allDay) {
    const end = addDaysToDateString(data.endDate || data.startDate, 1);
    lines.push(`DTSTART;VALUE=DATE:${formatICSAllDayDate(data.startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${formatICSAllDayDate(end)}`);
  } else {
    const start = makeLocalDate(data.startDate, data.startTime);
    const end = getEndDateTime(data);
    lines.push(`DTSTART:${formatICSDate(start)}`);
    lines.push(`DTEND:${formatICSDate(end)}`);
  }

  lines.push(`SUMMARY:${escapeICSValue(data.title)}`);

  if (description) {
    lines.push(`DESCRIPTION:${escapeICSValue(description)}`);
  }

  if (data.location) {
    lines.push(`LOCATION:${escapeICSValue(data.location)}`);
  }

  if (data.eventUrl) {
    lines.push(`URL:${escapeICSValue(data.eventUrl)}`);
  }

  if (data.organizer) {
    lines.push(`ORGANIZER;CN=${escapeICSParamValue(data.organizer)}:mailto:no-reply@example.invalid`);
  }

  if (data.reminder !== "none" && reminderDurations[data.reminder]) {
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:${reminderDurations[data.reminder]}`);
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:${escapeICSValue(data.title)}`);
    lines.push("END:VALARM");
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return `${foldICSLines(lines).join("\r\n")}\r\n`;
}

export function downloadICS(data, options) {
  const ics = generateICS(data, options);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = createFileName(data);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildDescription(data, labels, getFormatLabel) {
  const parts = [];

  if (data.description) {
    parts.push(data.description);
  }

  if (data.eventUrl) {
    parts.push(`${labels.eventUrl}:\n${data.eventUrl}`);
  }

  if (data.registrationUrl) {
    parts.push(`${labels.registrationUrl}:\n${data.registrationUrl}`);
  }

  if (data.organizer) {
    parts.push(`${labels.organizer}:\n${data.organizer}`);
  }

  if (data.format) {
    parts.push(`${labels.format}:\n${getFormatLabel(data.format)}`);
  }

  return parts.join("\n\n");
}

export function getEndDateTime(data) {
  const start = makeLocalDate(data.startDate, data.startTime);
  const endDate = data.endDate || data.startDate;

  if (data.endTime) {
    return makeLocalDate(endDate, data.endTime);
  }

  if (data.endDate && data.endDate !== data.startDate) {
    return makeLocalDate(endDate, data.startTime);
  }

  return new Date(start.getTime() + 60 * 60 * 1000);
}

export function makeLocalDate(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0);
}

export function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join("-");
}

export function formatHumanDateRange(data, locale) {
  if (!data.startDate) {
    return "";
  }

  const start = formatDateForDisplay(data.startDate, locale);
  const endDate = data.endDate || data.startDate;

  if (endDate === data.startDate) {
    return start;
  }

  return `${start} — ${formatDateForDisplay(endDate, locale)}`;
}

export function formatHumanTimeRange(data, allDayLabel) {
  if (data.allDay) {
    return allDayLabel;
  }

  if (!data.startTime) {
    return "";
  }

  if (!data.endTime) {
    return `${data.startTime} — ${addOneHour(data.startTime)}`;
  }

  return `${data.startTime} — ${data.endTime}`;
}

export function createFileName(data) {
  const slug = transliterate(data.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const fallbackDate = data.startDate || new Date().toISOString().slice(0, 10);

  return `${slug || `event-${fallbackDate}`}.ics`;
}

export function formatDateBadge(dateString, locale) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "short" })
    .format(date)
    .replace(".", "");

  return {
    day: pad(day),
    month: monthLabel,
  };
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDateForDisplay(dateString, locale) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addOneHour(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return `${pad((hours + 1) % 24)}:${pad(minutes)}`;
}

function formatICSDate(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function formatICSAllDayDate(dateString) {
  return dateString.replaceAll("-", "");
}

function escapeICSValue(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escapeICSParamValue(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function transliterate(value) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };

  return String(value)
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      const replacement = map[lower] ?? char;
      return char === lower ? replacement : replacement.toUpperCase();
    })
    .join("");
}

function cryptoRandom() {
  if (globalThis.crypto && globalThis.crypto.getRandomValues) {
    const values = new Uint32Array(2);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16)).join("");
  }

  return Math.random().toString(16).slice(2);
}

function foldICSLines(lines) {
  return lines.flatMap((line) => {
    const chunks = [];
    let current = line;

    while (current.length > 74) {
      chunks.push(current.slice(0, 74));
      current = ` ${current.slice(74)}`;
    }

    chunks.push(current);
    return chunks;
  });
}

function pad(value) {
  return String(value).padStart(2, "0");
}
