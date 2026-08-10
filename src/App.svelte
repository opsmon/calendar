<script>
  import { onDestroy, onMount } from "svelte";
  import {
    DRAFT_KEY,
    LANGUAGE_KEY,
    THEME_KEY,
    translations,
  } from "./lib/i18n.js";
  import {
    buildMapLinks,
    downloadICS,
    emptyEvent,
    fieldIds,
    formatDateBadge,
    formatHumanDateRange,
    formatHumanTimeRange,
    hasEventContent,
    normalizeEvent,
    validateEvent,
  } from "./lib/calendar.js";

  const languages = ["ru", "en"];
  const themes = ["system", "light", "dark"];
  const formats = ["offline", "online", "hybrid"];
  const reminders = ["none", "PT10M", "PT30M", "PT1H", "P1D", "P1W"];

  let data = { ...emptyEvent };
  let errors = {};
  let currentLanguage = "ru";
  let selectedTheme = "system";
  let timezone = "";
  let toastMessage = "";
  let isToastVisible = false;
  let toastTimeout;

  $: t = translations[currentLanguage] || translations.ru;
  $: normalizedData = normalizeEvent(data);
  $: isOnline = normalizedData.format === "online";
  $: hasPreview = hasEventContent(normalizedData);
  $: previewItems = getPreviewItems(normalizedData, t);
  $: dateBadge = normalizedData.startDate ? formatDateBadge(normalizedData.startDate, t.locale) : null;
  $: mapLinks = normalizedData.location ? buildMapLinks(normalizedData.location) : null;

  onMount(() => {
    setLanguage(getInitialLanguage(), false);
    setTheme(localStorage.getItem(THEME_KEY) || "system");
    loadDraft();
    updateTimezoneLabel();
  });

  onDestroy(() => {
    window.clearTimeout(toastTimeout);
  });

  function getFormatLabel(format) {
    return t.formatLabels[format] || format;
  }

  function getReminderLabel(reminder) {
    return t.reminderLabels[reminder] || t.reminderLabels.none;
  }

  function getPreviewItems(event, copy) {
    const labels = copy.preview;
    const items = [];
    const dateText = formatHumanDateRange(event, copy.locale);
    const timeText = formatHumanTimeRange(event, labels.allDay);

    if (dateText) {
      items.push({ label: labels.date, value: dateText });
    }

    if (timeText) {
      items.push({ label: labels.time, value: timeText });
    }

    items.push({ label: labels.format, value: copy.formatLabels[event.format] || event.format });

    if (event.location) {
      items.push({ label: labels.location, value: event.location });
    }

    if (event.description) {
      items.push({ label: labels.description, value: event.description, kind: "description" });
    }

    if (event.eventUrl) {
      items.push({ label: labels.eventUrl, value: event.eventUrl, kind: "link" });
    }

    if (event.registrationUrl) {
      items.push({ label: labels.registrationUrl, value: event.registrationUrl, kind: "link" });
    }

    if (event.organizer) {
      items.push({ label: labels.organizer, value: event.organizer });
    }

    items.push({ label: labels.reminder, value: copy.reminderLabels[event.reminder] || copy.reminderLabels.none });

    return items;
  }

  function handleFormChange() {
    if (data.format === "online" && data.location) {
      data = { ...data, location: "" };
    }

    errors = {};
    saveDraft();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const eventData = normalizeEvent(data);
    const validation = validateEvent(eventData, t.errors);
    data = eventData;
    errors = validation.errors;

    if (!validation.isValid) {
      focusFirstInvalidField(validation.errors);
      return;
    }

    downloadICS(eventData, {
      language: currentLanguage,
      descriptionLabels: t.descriptionLabels,
      getFormatLabel,
    });
    showNotification(t.notification.created);
  }

  function clearForm() {
    data = { ...emptyEvent };
    errors = {};
    sessionStorage.removeItem(DRAFT_KEY);
  }

  function saveDraft() {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(normalizeEvent(data)));
  }

  function loadDraft() {
    const rawDraft = sessionStorage.getItem(DRAFT_KEY);

    if (!rawDraft) {
      return;
    }

    try {
      data = normalizeEvent(JSON.parse(rawDraft));
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }

  function focusFirstInvalidField(validationErrors) {
    const firstKey = Object.keys(validationErrors)[0];
    const control = firstKey ? document.querySelector(`#${fieldIds[firstKey]}`) : null;

    if (control) {
      control.focus();
    }
  }

  function showNotification(message) {
    toastMessage = message;
    isToastVisible = true;
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      isToastVisible = false;
    }, 2600);
  }

  function setTheme(theme) {
    selectedTheme = themes.includes(theme) ? theme : "system";
    localStorage.setItem(THEME_KEY, selectedTheme);

    if (selectedTheme === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", selectedTheme);
    }
  }

  function setLanguage(language, shouldUpdateUrl = true) {
    currentLanguage = translations[language] ? language : "ru";
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    updateDocumentMeta(currentLanguage);

    if (shouldUpdateUrl) {
      updateLanguageUrl(currentLanguage);
    }

    errors = {};
    updateTimezoneLabel();
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

  function updateDocumentMeta(language) {
    const copy = translations[language] || translations.ru;
    document.documentElement.lang = language;
    document.title = copy.metaTitle;
    updateMetaContent('meta[name="description"]', copy.metaDescription);
    updateMetaContent('meta[property="og:title"]', copy.metaTitle);
    updateMetaContent('meta[property="og:description"]', copy.metaDescription);
    updateMetaContent('meta[property="og:locale"]', copy.ogLocale);
  }

  function updateMetaContent(selector, content) {
    const element = document.querySelector(selector);

    if (element) {
      element.setAttribute("content", content);
    }
  }

  function updateTimezoneLabel() {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || t.timezoneFallback;
  }
</script>

<div class="page-shell">
  <header class="header">
    <div>
      <p class="eyebrow">{t.ui.eyebrow}</p>
      <div class="brand-row">
        <span class="brand-mark" aria-hidden="true">
          <span></span>
        </span>
        <h1>{t.ui.brand}</h1>
      </div>
      <p class="lead">{@html t.ui.lead}</p>
      <p class="muted">{t.ui.privacy}</p>
    </div>

    <div class="header-controls">
      <div class="theme-switcher" aria-label={t.ui.languageLabel}>
        <span class="theme-title">{t.ui.language}</span>
        <div class="segmented is-two" role="group" aria-label={t.ui.languageChoiceLabel}>
          {#each languages as language}
            <button
              class:is-active={currentLanguage === language}
              aria-pressed={currentLanguage === language}
              class="theme-button"
              type="button"
              on:click={() => setLanguage(language)}
            >
              {language.toUpperCase()}
            </button>
          {/each}
        </div>
      </div>

      <div class="theme-switcher" aria-label={t.ui.themeLabel}>
        <span class="theme-title">{t.ui.theme}</span>
        <div class="segmented" role="group" aria-label={t.ui.themeChoiceLabel}>
          {#each themes as theme}
            <button
              class:is-active={selectedTheme === theme}
              aria-pressed={selectedTheme === theme}
              class="theme-button"
              type="button"
              on:click={() => setTheme(theme)}
            >
              {t.ui[`theme${theme[0].toUpperCase()}${theme.slice(1)}`]}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </header>

  <main class="app-layout">
    <form
      class="event-form"
      id="event-form"
      novalidate
      on:input={handleFormChange}
      on:change={handleFormChange}
      on:submit={handleSubmit}
    >
      <section class="form-section" aria-labelledby="basic-title">
        <h2 id="basic-title">{t.ui.basicTitle}</h2>

        <div class="field">
          <label for="title">{t.ui.titleLabel}</label>
          <input
            id="title"
            name="title"
            type="text"
            autocomplete="off"
            placeholder={t.ui.titlePlaceholder}
            bind:value={data.title}
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby="title-error"
          >
          <p class="field-error" id="title-error" aria-live="polite">{errors.title || ""}</p>
        </div>

        <div class="field">
          <label for="description">{t.ui.descriptionLabel}</label>
          <textarea
            id="description"
            name="description"
            rows="5"
            placeholder={t.ui.descriptionPlaceholder}
            bind:value={data.description}
            aria-invalid={errors.description ? "true" : "false"}
            aria-describedby="description-error"
          ></textarea>
          <p class="field-error" id="description-error" aria-live="polite">{errors.description || ""}</p>
        </div>

        <div class="two-columns">
          <div class="field">
            <label for="start-date">{t.ui.startDateLabel}</label>
            <input
              id="start-date"
              name="startDate"
              type="date"
              bind:value={data.startDate}
              aria-invalid={errors.startDate ? "true" : "false"}
              aria-describedby="start-date-error"
            >
            <p class="field-error" id="start-date-error" aria-live="polite">{errors.startDate || ""}</p>
          </div>

          <div class:is-hidden={data.allDay} class="field time-field">
            <label for="start-time">{t.ui.startTimeLabel}</label>
            <input
              id="start-time"
              name="startTime"
              type="time"
              disabled={data.allDay}
              bind:value={data.startTime}
              aria-invalid={errors.startTime ? "true" : "false"}
              aria-describedby="start-time-error"
            >
            <p class="field-error" id="start-time-error" aria-live="polite">{errors.startTime || ""}</p>
          </div>
        </div>

        <div class="two-columns">
          <div class="field">
            <label for="end-date">{t.ui.endDateLabel}</label>
            <input
              id="end-date"
              name="endDate"
              type="date"
              bind:value={data.endDate}
              aria-invalid={errors.endDate ? "true" : "false"}
              aria-describedby="end-date-error"
            >
            <p class="field-error" id="end-date-error" aria-live="polite">{errors.endDate || ""}</p>
          </div>

          <div class:is-hidden={data.allDay} class="field time-field">
            <label for="end-time">{t.ui.endTimeLabel}</label>
            <input
              id="end-time"
              name="endTime"
              type="time"
              disabled={data.allDay}
              bind:value={data.endTime}
              aria-invalid={errors.endTime ? "true" : "false"}
              aria-describedby="end-time-error"
            >
            <p class="field-error" id="end-time-error" aria-live="polite">{errors.endTime || ""}</p>
          </div>
        </div>

        <label class="check-row" for="all-day">
          <input id="all-day" name="allDay" type="checkbox" bind:checked={data.allDay}>
          <span>{t.ui.allDayLabel}</span>
        </label>
      </section>

      <section class="form-section" aria-labelledby="extra-title">
        <h2 id="extra-title">{t.ui.extraTitle}</h2>

        <div class="two-columns">
          <div class="field">
            <label for="format">{t.ui.formatLabel}</label>
            <select
              id="format"
              name="format"
              bind:value={data.format}
              aria-invalid={errors.format ? "true" : "false"}
              aria-describedby="format-error"
            >
              {#each formats as format}
                <option value={format}>{t.formatLabels[format]}</option>
              {/each}
            </select>
            <p class="field-error" id="format-error" aria-live="polite">{errors.format || ""}</p>
          </div>

          <div class="field">
            <label for="reminder">{t.ui.reminderLabel}</label>
            <select
              id="reminder"
              name="reminder"
              bind:value={data.reminder}
              aria-invalid={errors.reminder ? "true" : "false"}
              aria-describedby="reminder-error"
            >
              {#each reminders as reminder}
                <option value={reminder}>{t.reminderLabels[reminder]}</option>
              {/each}
            </select>
            <p class="field-error" id="reminder-error" aria-live="polite">{errors.reminder || ""}</p>
          </div>
        </div>

        <div class:is-hidden={isOnline} class="field" id="location-field">
          <label for="location">{t.ui.locationLabel}</label>
          <input
            id="location"
            name="location"
            type="text"
            autocomplete="street-address"
            placeholder={t.ui.locationPlaceholder}
            disabled={isOnline}
            bind:value={data.location}
            aria-invalid={errors.location ? "true" : "false"}
            aria-describedby="location-error"
          >
          <p class="field-error" id="location-error" aria-live="polite">{errors.location || ""}</p>
        </div>

        <div class="field">
          <label for="event-url">{t.ui.eventUrlLabel}</label>
          <input
            id="event-url"
            name="eventUrl"
            type="url"
            inputmode="url"
            placeholder="https://example.com"
            bind:value={data.eventUrl}
            aria-invalid={errors.eventUrl ? "true" : "false"}
            aria-describedby="event-url-error"
          >
          <p class="field-error" id="event-url-error" aria-live="polite">{errors.eventUrl || ""}</p>
        </div>

        <div class="field">
          <label for="registration-url">{t.ui.registrationUrlLabel}</label>
          <input
            id="registration-url"
            name="registrationUrl"
            type="url"
            inputmode="url"
            placeholder="https://example.com/register"
            bind:value={data.registrationUrl}
            aria-invalid={errors.registrationUrl ? "true" : "false"}
            aria-describedby="registration-url-error"
          >
          <p class="field-error" id="registration-url-error" aria-live="polite">{errors.registrationUrl || ""}</p>
        </div>

        <div class="field">
          <label for="organizer">{t.ui.organizerLabel}</label>
          <input
            id="organizer"
            name="organizer"
            type="text"
            autocomplete="organization"
            placeholder={t.ui.organizerPlaceholder}
            bind:value={data.organizer}
            aria-invalid={errors.organizer ? "true" : "false"}
            aria-describedby="organizer-error"
          >
          <p class="field-error" id="organizer-error" aria-live="polite">{errors.organizer || ""}</p>
        </div>
      </section>
    </form>

    <aside class="preview-panel" aria-labelledby="preview-title">
      <div class="preview-heading">
        <h2 id="preview-title">{t.ui.previewTitle}</h2>
        <span class="timezone" id="timezone-label">{timezone}</span>
      </div>
      <div class="preview-card" id="preview" aria-live="polite">
        {#if !hasPreview}
          <p class="empty-preview">{t.ui.emptyPreview}</p>
        {:else}
          <div class="preview-top">
            {#if dateBadge}
              <div class="date-badge" aria-hidden="true">
                <span class="date-badge-month">{dateBadge.month}</span>
                <span class="date-badge-day">{dateBadge.day}</span>
              </div>
            {/if}
            <div>
              <p class="preview-kicker">{getFormatLabel(normalizedData.format)}</p>
              <h3 class="preview-title">{normalizedData.title || t.preview.noTitle}</h3>
            </div>
          </div>
          <dl class="preview-list">
            {#each previewItems as item}
              <div class="preview-item">
                <dt class="meta-label">{item.label}</dt>
                <dd class:description-text={item.kind === "description"} class="meta-value">
                  {#if item.kind === "link"}
                    <a href={item.value} target="_blank" rel="noopener noreferrer">{item.value}</a>
                  {:else}
                    {item.value}
                  {/if}
                </dd>
              </div>
            {/each}
          </dl>
          {#if mapLinks}
            <div class="map-links" aria-label={t.mapLabels.container}>
              <a href={mapLinks.apple} aria-label={t.mapLabels.apple} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              <a href={mapLinks.google} aria-label={t.mapLabels.google} target="_blank" rel="noopener noreferrer">Google Maps</a>
              <a href={mapLinks.yandex} aria-label={t.mapLabels.yandex} target="_blank" rel="noopener noreferrer">{t.mapLabels.yandexText}</a>
              <a href={mapLinks.twoGis} aria-label={t.mapLabels.twoGis} target="_blank" rel="noopener noreferrer">2GIS</a>
            </div>
          {/if}
        {/if}
      </div>
    </aside>

    <div class="actions" aria-label={t.ui.actionsLabel}>
      <button class="button button-primary" type="submit" form="event-form">{t.ui.downloadButton}</button>
      <button class="button button-secondary" type="button" on:click={clearForm}>{t.ui.clearButton}</button>
    </div>
  </main>
</div>

<div class:is-visible={isToastVisible} class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true">
  {toastMessage}
</div>
