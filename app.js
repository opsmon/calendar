const DRAFT_KEY = "ics-generator-draft";
const THEME_KEY = "ics-generator-theme";

const form = document.querySelector("#event-form");
const preview = document.querySelector("#preview");
const clearButton = document.querySelector("#clear-button");
const toast = document.querySelector("#toast");
const timezoneLabel = document.querySelector("#timezone-label");
const locationField = document.querySelector("#location-field");
const themeButtons = Array.from(document.querySelectorAll("[data-theme-choice]"));
const timeFields = Array.from(document.querySelectorAll(".time-field"));

const formatLabels = {
  offline: "Офлайн",
  online: "Онлайн",
  hybrid: "Гибрид",
};

const reminderLabels = {
  none: "Без напоминания",
  PT10M: "За 10 минут",
  PT30M: "За 30 минут",
  PT1H: "За 1 час",
  P1D: "За 1 день",
  P1W: "За 1 неделю",
};

const reminderDurations = {
  PT10M: "-PT10M",
  PT30M: "-PT30M",
  PT1H: "-PT1H",
  P1D: "-P1D",
  P1W: "-P1W",
};

const fieldIds = {
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

function getFormData() {
  const formData = new FormData(form);

  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    startDate: String(formData.get("startDate") || ""),
    startTime: String(formData.get("startTime") || ""),
    endDate: String(formData.get("endDate") || ""),
    endTime: String(formData.get("endTime") || ""),
    allDay: formData.get("allDay") === "on",
    format: String(formData.get("format") || "offline"),
    location: String(formData.get("location") || "").trim(),
    eventUrl: String(formData.get("eventUrl") || "").trim(),
    registrationUrl: String(formData.get("registrationUrl") || "").trim(),
    organizer: String(formData.get("organizer") || "").trim(),
    reminder: String(formData.get("reminder") || "none"),
  };
}

function validateEvent(data) {
  const errors = {};

  if (!data.title) {
    errors.title = "Укажите название события.";
  }

  if (!data.startDate) {
    errors.startDate = "Укажите дату начала.";
  }

  if (!data.allDay && !data.startTime) {
    errors.startTime = "Укажите время начала.";
  }

  if ((data.format === "offline" || data.format === "hybrid") && !data.location) {
    errors.location = "Для офлайн- и гибридного события нужен адрес.";
  }

  if (data.eventUrl && !isValidHttpUrl(data.eventUrl)) {
    errors.eventUrl = "Введите корректную ссылку с http или https.";
  }

  if (data.registrationUrl && !isValidHttpUrl(data.registrationUrl)) {
    errors.registrationUrl = "Введите корректную ссылку с http или https.";
  }

  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = "Дата окончания не может быть раньше даты начала.";
  }

  if (!data.allDay && data.startDate && data.startTime) {
    const start = makeLocalDate(data.startDate, data.startTime);
    const end = getEndDateTime(data);

    if (end && end < start) {
      errors.endTime = "Окончание не может быть раньше начала.";
    }
  }

  if (data.allDay && data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = "Дата окончания не может быть раньше даты начала.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function renderErrors(errors) {
  Object.entries(fieldIds).forEach(([key, id]) => {
    const control = document.querySelector(`#${id}`);
    const error = document.querySelector(`#${id}-error`);

    if (!control || !error) {
      return;
    }

    const message = errors[key] || "";
    error.textContent = message;
    control.setAttribute("aria-invalid", message ? "true" : "false");
    control.setAttribute("aria-describedby", `${id}-error`);
  });
}

function renderPreview(data) {
  const hasContent = [
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

  if (!hasContent) {
    preview.innerHTML = '<p class="empty-preview">Заполните данные события — здесь появится предпросмотр.</p>';
    return;
  }

  const items = [];
  const dateText = formatHumanDateRange(data);
  const timeText = formatHumanTimeRange(data);

  if (dateText) {
    items.push(makePreviewItem("Дата", dateText));
  }

  if (timeText) {
    items.push(makePreviewItem("Время", timeText));
  }

  items.push(makePreviewItem("Формат", formatLabels[data.format] || data.format));

  if (data.location) {
    items.push(makePreviewItem("Местоположение", data.location));
  }

  if (data.description) {
    items.push(makePreviewItem("Описание", data.description, "description-text"));
  }

  if (data.eventUrl) {
    items.push(makePreviewLinkItem("Сайт мероприятия", data.eventUrl));
  }

  if (data.registrationUrl) {
    items.push(makePreviewLinkItem("Регистрация", data.registrationUrl));
  }

  if (data.organizer) {
    items.push(makePreviewItem("Организатор", data.organizer));
  }

  items.push(makePreviewItem("Напоминание", reminderLabels[data.reminder] || reminderLabels.none));

  const mapLinks = data.location ? renderMapLinks(data.location) : "";
  const title = data.title || "Без названия";

  preview.innerHTML = `
    <div>
      <h3 class="preview-title">${escapeHTML(title)}</h3>
    </div>
    <dl class="preview-list">
      ${items.join("")}
    </dl>
    ${mapLinks}
  `;
}

function makePreviewItem(label, value, extraClass = "") {
  return `
    <div class="preview-item">
      <dt class="meta-label">${escapeHTML(label)}</dt>
      <dd class="meta-value ${extraClass}">${escapeHTML(value)}</dd>
    </div>
  `;
}

function makePreviewLinkItem(label, href) {
  const safeHref = escapeAttribute(href);

  return `
    <div class="preview-item">
      <dt class="meta-label">${escapeHTML(label)}</dt>
      <dd class="meta-value">
        <a href="${safeHref}" target="_blank" rel="noopener noreferrer">${escapeHTML(href)}</a>
      </dd>
    </div>
  `;
}

function renderMapLinks(address) {
  const links = buildMapLinks(address);

  return `
    <div class="map-links" aria-label="Открыть адрес в картах">
      <a href="${escapeAttribute(links.apple)}" aria-label="Открыть адрес в Apple Maps" target="_blank" rel="noopener noreferrer">Apple Maps</a>
      <a href="${escapeAttribute(links.google)}" aria-label="Открыть адрес в Google Maps" target="_blank" rel="noopener noreferrer">Google Maps</a>
      <a href="${escapeAttribute(links.yandex)}" aria-label="Открыть адрес в Яндекс Картах" target="_blank" rel="noopener noreferrer">Яндекс Карты</a>
      <a href="${escapeAttribute(links.twoGis)}" aria-label="Открыть адрес в 2ГИС" target="_blank" rel="noopener noreferrer">2ГИС</a>
    </div>
  `;
}

function generateICS(data) {
  const description = buildDescription(data);
  const uid = `${Date.now()}-${cryptoRandom()}@v-kalendar`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//В календарь//ICS Generator//RU",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
  ];

  if (data.allDay) {
    const start = data.startDate;
    const end = addDaysToDateString(data.endDate || data.startDate, 1);
    lines.push(`DTSTART;VALUE=DATE:${formatICSAllDayDate(start)}`);
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

function downloadICS(data) {
  const ics = generateICS(data);
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

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(getFormData()));
}

function loadDraft() {
  const rawDraft = localStorage.getItem(DRAFT_KEY);

  if (!rawDraft) {
    return;
  }

  try {
    const draft = JSON.parse(rawDraft);
    Object.entries(fieldIds).forEach(([key, id]) => {
      const control = document.querySelector(`#${id}`);

      if (!control || !(key in draft)) {
        return;
      }

      if (control.type === "checkbox") {
        control.checked = Boolean(draft[key]);
      } else {
        control.value = draft[key];
      }
    });
  } catch {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function clearForm() {
  form.reset();
  localStorage.removeItem(DRAFT_KEY);
  renderErrors({});
  updateConditionalFields();
  renderPreview(getFormData());
}

function showNotification(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showNotification.timeoutId);
  showNotification.timeoutId = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function buildMapLinks(address) {
  const encodedAddress = encodeURIComponent(address.trim());

  return {
    apple: `https://maps.apple.com/?q=${encodedAddress}`,
    google: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    yandex: `https://yandex.ru/maps/?text=${encodedAddress}`,
    twoGis: `https://2gis.ru/search/${encodedAddress}`,
  };
}

function applyTheme(theme) {
  const selectedTheme = ["system", "light", "dark"].includes(theme) ? theme : "system";

  if (selectedTheme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", selectedTheme);
  }

  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeChoice === selectedTheme;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function buildDescription(data) {
  const parts = [];

  if (data.description) {
    parts.push(data.description);
  }

  if (data.eventUrl) {
    parts.push(`Сайт мероприятия:\n${data.eventUrl}`);
  }

  if (data.registrationUrl) {
    parts.push(`Регистрация:\n${data.registrationUrl}`);
  }

  if (data.organizer) {
    parts.push(`Организатор:\n${data.organizer}`);
  }

  if (data.format) {
    parts.push(`Формат:\n${formatLabels[data.format] || data.format}`);
  }

  return parts.join("\n\n");
}

function updateConditionalFields() {
  const data = getFormData();
  const isOnline = data.format === "online";
  const locationInput = document.querySelector("#location");

  locationField.classList.toggle("is-hidden", isOnline);
  locationInput.disabled = isOnline;

  if (isOnline) {
    locationInput.value = "";
  }

  timeFields.forEach((field) => {
    const control = field.querySelector("input");
    field.classList.toggle("is-hidden", data.allDay);
    control.disabled = data.allDay;
  });
}

function handleFormInput() {
  updateConditionalFields();
  saveDraft();
  renderErrors({});
  renderPreview(getFormData());
}

function handleSubmit(event) {
  event.preventDefault();

  const data = getFormData();
  const validation = validateEvent(data);
  renderErrors(validation.errors);
  renderPreview(data);

  if (!validation.isValid) {
    focusFirstInvalidField(validation.errors);
    return;
  }

  downloadICS(data);
  showNotification("Файл календаря создан.");
}

function focusFirstInvalidField(errors) {
  const firstKey = Object.keys(errors)[0];
  const control = firstKey ? document.querySelector(`#${fieldIds[firstKey]}`) : null;

  if (control) {
    control.focus();
  }
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getEndDateTime(data) {
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

function makeLocalDate(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes] = timeString.split(":").map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0);
}

function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function formatHumanDateRange(data) {
  if (!data.startDate) {
    return "";
  }

  const start = formatDateForDisplay(data.startDate);
  const endDate = data.endDate || data.startDate;

  if (endDate === data.startDate) {
    return start;
  }

  return `${start} — ${formatDateForDisplay(endDate)}`;
}

function formatHumanTimeRange(data) {
  if (data.allDay) {
    return "Весь день";
  }

  if (!data.startTime) {
    return "";
  }

  if (!data.endTime) {
    return `${data.startTime} — ${addOneHour(data.startTime)}`;
  }

  return `${data.startTime} — ${data.endTime}`;
}

function formatDateForDisplay(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addOneHour(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return `${pad((hours + 1) % 24)}:${pad(minutes)}`;
}

function createFileName(data) {
  const slug = transliterate(data.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  const fallbackDate = data.startDate || new Date().toISOString().slice(0, 10);

  return `${slug || `event-${fallbackDate}`}.ics`;
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
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(2);
    window.crypto.getRandomValues(values);
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

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function init() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "локальный часовой пояс";
  timezoneLabel.textContent = timezone;

  applyTheme(localStorage.getItem(THEME_KEY) || "system");
  loadDraft();
  updateConditionalFields();
  renderPreview(getFormData());

  form.addEventListener("input", handleFormInput);
  form.addEventListener("change", handleFormInput);
  form.addEventListener("submit", handleSubmit);
  clearButton.addEventListener("click", clearForm);

  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeChoice;
      localStorage.setItem(THEME_KEY, theme);
      applyTheme(theme);
    });
  });
}

init();
