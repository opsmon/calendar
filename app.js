const DRAFT_KEY = "ics-generator-draft";
const THEME_KEY = "ics-generator-theme";
const LANGUAGE_KEY = "ics-generator-language";

const form = document.querySelector("#event-form");
const preview = document.querySelector("#preview");
const clearButton = document.querySelector("#clear-button");
const toast = document.querySelector("#toast");
const timezoneLabel = document.querySelector("#timezone-label");
const locationField = document.querySelector("#location-field");
const themeButtons = Array.from(document.querySelectorAll("[data-theme-choice]"));
const languageButtons = Array.from(document.querySelectorAll("[data-language-choice]"));
const timeFields = Array.from(document.querySelectorAll(".time-field"));

let currentLanguage = "ru";

const translations = {
  ru: {
    locale: "ru-RU",
    ogLocale: "ru_RU",
    metaTitle: "В календарь — генератор ICS",
    metaDescription: "Создайте событие и скачайте файл ICS для Apple Calendar, Android, Google Calendar и Outlook.",
    ui: {
      actionsLabel: "Основные действия",
      allDayLabel: "Весь день",
      basicTitle: "Основные данные",
      brand: "В календарь",
      clearButton: "Очистить",
      descriptionLabel: "Описание",
      descriptionPlaceholder: "Конференция для DevOps, SRE и platform-инженеров.",
      downloadButton: "Скачать .ics",
      emptyPreview: "Заполните данные события — здесь появится предпросмотр.",
      endDateLabel: "Дата окончания",
      endTimeLabel: "Время окончания",
      eventUrlLabel: "Ссылка на мероприятие",
      extraTitle: "Дополнительно",
      eyebrow: "Черновик хранится только в текущей сессии.",
      formatHybrid: "Гибрид",
      formatLabel: "Формат мероприятия",
      formatOffline: "Офлайн",
      formatOnline: "Онлайн",
      language: "Язык",
      languageChoiceLabel: "Выбор языка",
      languageLabel: "Язык",
      lead: "Создайте событие и скачайте готовый файл <code>.ics</code>.",
      locationLabel: "Местоположение",
      locationPlaceholder: "Санкт-Петербург, Экспофорум",
      organizerLabel: "Организатор",
      organizerPlaceholder: "Название организатора",
      previewTitle: "Предпросмотр",
      privacy: "Все данные обрабатываются только в вашем браузере.",
      registrationUrlLabel: "Ссылка на регистрацию",
      reminder10m: "За 10 минут",
      reminder30m: "За 30 минут",
      reminder1d: "За 1 день",
      reminder1h: "За 1 час",
      reminder1w: "За 1 неделю",
      reminderLabel: "Напоминание",
      reminderNone: "Без напоминания",
      startDateLabel: "Дата начала",
      startTimeLabel: "Время начала",
      theme: "Тема",
      themeChoiceLabel: "Выбор темы",
      themeDark: "Тёмная",
      themeLabel: "Тема оформления",
      themeLight: "Светлая",
      themeSystem: "Системная",
      titleLabel: "Название события",
      titlePlaceholder: "DevOops 2026",
    },
    formatLabels: {
      offline: "Офлайн",
      online: "Онлайн",
      hybrid: "Гибрид",
    },
    reminderLabels: {
      none: "Без напоминания",
      PT10M: "За 10 минут",
      PT30M: "За 30 минут",
      PT1H: "За 1 час",
      P1D: "За 1 день",
      P1W: "За 1 неделю",
    },
    errors: {
      title: "Укажите название события.",
      startDate: "Укажите дату начала.",
      startTime: "Укажите время начала.",
      location: "Для офлайн- и гибридного события нужен адрес.",
      eventUrl: "Введите корректную ссылку с http или https.",
      registrationUrl: "Введите корректную ссылку с http или https.",
      endDateBeforeStart: "Дата окончания не может быть раньше даты начала.",
      endTimeBeforeStart: "Окончание не может быть раньше начала.",
    },
    preview: {
      allDay: "Весь день",
      date: "Дата",
      description: "Описание",
      eventUrl: "Сайт мероприятия",
      format: "Формат",
      location: "Местоположение",
      noTitle: "Без названия",
      organizer: "Организатор",
      registrationUrl: "Регистрация",
      reminder: "Напоминание",
      time: "Время",
    },
    descriptionLabels: {
      eventUrl: "Сайт мероприятия",
      format: "Формат",
      organizer: "Организатор",
      registrationUrl: "Регистрация",
    },
    mapLabels: {
      container: "Открыть адрес в картах",
      apple: "Открыть адрес в Apple Maps",
      google: "Открыть адрес в Google Maps",
      yandex: "Открыть адрес в Яндекс Картах",
      twoGis: "Открыть адрес в 2ГИС",
      yandexText: "Яндекс Карты",
    },
    notification: {
      created: "Файл календаря создан.",
    },
    timezoneFallback: "локальный часовой пояс",
  },
  en: {
    locale: "en-US",
    ogLocale: "en_US",
    metaTitle: "Add to Calendar — ICS generator",
    metaDescription: "Create an event and download an ICS file for Apple Calendar, Android, Google Calendar, and Outlook.",
    ui: {
      actionsLabel: "Primary actions",
      allDayLabel: "All day",
      basicTitle: "Event details",
      brand: "Add to Calendar",
      clearButton: "Clear",
      descriptionLabel: "Description",
      descriptionPlaceholder: "A conference for DevOps, SRE, and platform engineers.",
      downloadButton: "Download .ics",
      emptyPreview: "Fill in the event details and the preview will appear here.",
      endDateLabel: "End date",
      endTimeLabel: "End time",
      eventUrlLabel: "Event link",
      extraTitle: "Additional details",
      eyebrow: "Drafts are stored only for the current session.",
      formatHybrid: "Hybrid",
      formatLabel: "Event format",
      formatOffline: "Offline",
      formatOnline: "Online",
      language: "Language",
      languageChoiceLabel: "Language selection",
      languageLabel: "Language",
      lead: "Create an event and download a ready <code>.ics</code> file.",
      locationLabel: "Location",
      locationPlaceholder: "Saint Petersburg, Expoforum",
      organizerLabel: "Organizer",
      organizerPlaceholder: "Organizer name",
      previewTitle: "Preview",
      privacy: "All data is processed only in your browser.",
      registrationUrlLabel: "Registration link",
      reminder10m: "10 minutes before",
      reminder30m: "30 minutes before",
      reminder1d: "1 day before",
      reminder1h: "1 hour before",
      reminder1w: "1 week before",
      reminderLabel: "Reminder",
      reminderNone: "No reminder",
      startDateLabel: "Start date",
      startTimeLabel: "Start time",
      theme: "Theme",
      themeChoiceLabel: "Theme selection",
      themeDark: "Dark",
      themeLabel: "Theme",
      themeLight: "Light",
      themeSystem: "System",
      titleLabel: "Event title",
      titlePlaceholder: "DevOops 2026",
    },
    formatLabels: {
      offline: "Offline",
      online: "Online",
      hybrid: "Hybrid",
    },
    reminderLabels: {
      none: "No reminder",
      PT10M: "10 minutes before",
      PT30M: "30 minutes before",
      PT1H: "1 hour before",
      P1D: "1 day before",
      P1W: "1 week before",
    },
    errors: {
      title: "Enter the event title.",
      startDate: "Choose the start date.",
      startTime: "Choose the start time.",
      location: "Offline and hybrid events need a location.",
      eventUrl: "Enter a valid link with http or https.",
      registrationUrl: "Enter a valid link with http or https.",
      endDateBeforeStart: "The end date cannot be earlier than the start date.",
      endTimeBeforeStart: "The end time cannot be earlier than the start time.",
    },
    preview: {
      allDay: "All day",
      date: "Date",
      description: "Description",
      eventUrl: "Event website",
      format: "Format",
      location: "Location",
      noTitle: "Untitled event",
      organizer: "Organizer",
      registrationUrl: "Registration",
      reminder: "Reminder",
      time: "Time",
    },
    descriptionLabels: {
      eventUrl: "Event website",
      format: "Format",
      organizer: "Organizer",
      registrationUrl: "Registration",
    },
    mapLabels: {
      container: "Open location in maps",
      apple: "Open location in Apple Maps",
      google: "Open location in Google Maps",
      yandex: "Open location in Yandex Maps",
      twoGis: "Open location in 2GIS",
      yandexText: "Yandex Maps",
    },
    notification: {
      created: "Calendar file created.",
    },
    timezoneFallback: "local time zone",
  },
};

const reminderDurations = {
  PT10M: "-PT10M",
  PT30M: "-PT30M",
  PT1H: "-PT1H",
  P1D: "-P1D",
  P1W: "-P1W",
};

function getTranslations() {
  return translations[currentLanguage] || translations.ru;
}

function getFormatLabel(format) {
  const { formatLabels } = getTranslations();
  return formatLabels[format] || format;
}

function getReminderLabel(reminder) {
  const { reminderLabels } = getTranslations();
  return reminderLabels[reminder] || reminderLabels.none;
}

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
  const messages = getTranslations().errors;

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

  if (data.allDay && data.startDate && data.endDate && data.endDate < data.startDate) {
    errors.endDate = messages.endDateBeforeStart;
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
  const labels = getTranslations().preview;
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
    preview.innerHTML = `<p class="empty-preview">${escapeHTML(getTranslations().ui.emptyPreview)}</p>`;
    return;
  }

  const items = [];
  const dateText = formatHumanDateRange(data);
  const timeText = formatHumanTimeRange(data);

  if (dateText) {
    items.push(makePreviewItem(labels.date, dateText));
  }

  if (timeText) {
    items.push(makePreviewItem(labels.time, timeText));
  }

  items.push(makePreviewItem(labels.format, getFormatLabel(data.format)));

  if (data.location) {
    items.push(makePreviewItem(labels.location, data.location));
  }

  if (data.description) {
    items.push(makePreviewItem(labels.description, data.description, "description-text"));
  }

  if (data.eventUrl) {
    items.push(makePreviewLinkItem(labels.eventUrl, data.eventUrl));
  }

  if (data.registrationUrl) {
    items.push(makePreviewLinkItem(labels.registrationUrl, data.registrationUrl));
  }

  if (data.organizer) {
    items.push(makePreviewItem(labels.organizer, data.organizer));
  }

  items.push(makePreviewItem(labels.reminder, getReminderLabel(data.reminder)));

  const mapLinks = data.location ? renderMapLinks(data.location) : "";
  const title = data.title || labels.noTitle;
  const dateBadge = data.startDate ? renderDateBadge(data.startDate) : "";

  preview.innerHTML = `
    <div class="preview-top">
      ${dateBadge}
      <div>
        <p class="preview-kicker">${escapeHTML(getFormatLabel(data.format))}</p>
        <h3 class="preview-title">${escapeHTML(title)}</h3>
      </div>
    </div>
    <dl class="preview-list">
      ${items.join("")}
    </dl>
    ${mapLinks}
  `;
}

function renderDateBadge(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const monthLabel = new Intl.DateTimeFormat(getTranslations().locale, { month: "short" })
    .format(date)
    .replace(".", "");

  return `
    <div class="date-badge" aria-hidden="true">
      <span class="date-badge-month">${escapeHTML(monthLabel)}</span>
      <span class="date-badge-day">${pad(day)}</span>
    </div>
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
  const labels = getTranslations().mapLabels;

  return `
    <div class="map-links" aria-label="${escapeAttribute(labels.container)}">
      <a href="${escapeAttribute(links.apple)}" aria-label="${escapeAttribute(labels.apple)}" target="_blank" rel="noopener noreferrer">Apple Maps</a>
      <a href="${escapeAttribute(links.google)}" aria-label="${escapeAttribute(labels.google)}" target="_blank" rel="noopener noreferrer">Google Maps</a>
      <a href="${escapeAttribute(links.yandex)}" aria-label="${escapeAttribute(labels.yandex)}" target="_blank" rel="noopener noreferrer">${escapeHTML(labels.yandexText)}</a>
      <a href="${escapeAttribute(links.twoGis)}" aria-label="${escapeAttribute(labels.twoGis)}" target="_blank" rel="noopener noreferrer">2GIS</a>
    </div>
  `;
}

function generateICS(data) {
  const description = buildDescription(data);
  const uid = `${Date.now()}-${cryptoRandom()}@v-kalendar`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${currentLanguage === "ru" ? "В календарь" : "Add to Calendar"}//ICS Generator//${currentLanguage.toUpperCase()}`,
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
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(getFormData()));
}

function loadDraft() {
  const rawDraft = sessionStorage.getItem(DRAFT_KEY);

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
    sessionStorage.removeItem(DRAFT_KEY);
  }
}

function clearForm() {
  form.reset();
  sessionStorage.removeItem(DRAFT_KEY);
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

function applyLanguage(language) {
  currentLanguage = translations[language] ? language : "ru";
  localStorage.setItem(LANGUAGE_KEY, currentLanguage);

  const { metaDescription, metaTitle, ogLocale, ui } = getTranslations();
  document.documentElement.lang = currentLanguage;
  document.title = metaTitle;
  updateMetaContent('meta[name="description"]', metaDescription);
  updateMetaContent('meta[property="og:title"]', metaTitle);
  updateMetaContent('meta[property="og:description"]', metaDescription);
  updateMetaContent('meta[property="og:locale"]', ogLocale);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key && key in ui) {
      element.textContent = ui[key];
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;
    if (key && key in ui) {
      element.innerHTML = ui[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key && key in ui) {
      element.setAttribute("placeholder", ui[key]);
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key && key in ui) {
      element.setAttribute("aria-label", ui[key]);
    }
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.languageChoice === currentLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function getInitialLanguage() {
  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");

  if (requestedLanguage && translations[requestedLanguage]) {
    return requestedLanguage;
  }

  return localStorage.getItem(LANGUAGE_KEY) || "ru";
}

function updateLanguageUrl(language) {
  const url = new URL(window.location.href);

  if (language === "ru") {
    url.searchParams.delete("lang");
  } else {
    url.searchParams.set("lang", language);
  }

  window.history.replaceState({}, "", url);
}

function updateMetaContent(selector, content) {
  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute("content", content);
  }
}

function updateTimezoneLabel() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || getTranslations().timezoneFallback;
  timezoneLabel.textContent = timezone;
}

function buildDescription(data) {
  const parts = [];
  const labels = getTranslations().descriptionLabels;

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
  showNotification(getTranslations().notification.created);
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
    return getTranslations().preview.allDay;
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

  return new Intl.DateTimeFormat(getTranslations().locale, {
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
  applyLanguage(getInitialLanguage());
  updateTimezoneLabel();
  applyTheme(localStorage.getItem(THEME_KEY) || "system");
  localStorage.removeItem(DRAFT_KEY);
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

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyLanguage(button.dataset.languageChoice);
      updateLanguageUrl(currentLanguage);
      updateTimezoneLabel();
      renderErrors({});
      renderPreview(getFormData());
    });
  });
}

init();
