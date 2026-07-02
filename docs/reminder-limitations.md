# Reminder Limitations (Local-First)

The AI Tutor Assistant uses a **local-first** reminder system. There is no backend, push server, or cloud notification service. All reminders are triggered client-side. This document explains what works, what does not, and the trade-offs.

---

## How Reminders Work

1. **Polling** — Every 60 seconds, the `ReminderService` checks all enabled reminders against the current time. If a reminder is due (by `scheduledTime` + `repeatDays`, or by `scheduledDate`), it fires.
2. **Trigger tracking** — Reminders are tracked per-day via `localStorage` to avoid duplicate notifications for the same reminder on the same day.
3. **Three delivery channels** — Browser Notification API, Chrome extension notifications/alarms, and an in-app callback for dashboard display.

---

## Delivery Channel Limitations

### 1. Browser Notifications (`Notification` API)

| Limitation | Detail |
|---|---|
| **Page must be open** | Notifications only fire while the IELTS website tab is open. Closing the tab stops all polling. |
| **Permission required** | The user must grant `Notification.requestPermission()`. Denied or default blocks all notifications silently. |
| **No background delivery** | Without a service worker or push server, notifications cannot arrive when the page is closed. |
| **Single-origin scope** | Notifications are tied to the page's origin. They do not persist across browser restarts if the page is not loaded. |
| **Mobile behavior** | Mobile browsers often suppress or delay notifications from web pages. Results vary by OS and browser. |

### 2. Chrome Extension Alarms (`chrome.alarms`)

| Limitation | Detail |
|---|---|
| **Extension-only** | Only applies when the user has installed the IELTS Chrome extension. |
| **Requires extension open** | Alarms persist in the extension service worker, but notification delivery requires the extension to be active. |
| **`chrome.notifications` availability** | The extension background script can show notifications, but the main website cannot. |
| **Permission** | Requires `"alarms"` and `"notifications"` permissions in the extension manifest. |

### 3. In-App Reminders (Event Callback)

| Limitation | Detail |
|---|---|
| **Requires active subscription** | The dashboard or other components must subscribe via `reminderService.onReminder()`. Without a subscriber, in-app reminders are lost. |
| **Same-tab only** | Reminder callbacks only fire in the JavaScript context that initialized the service. Multi-tab or cross-device delivery is not supported. |
| **No persistence** | In-app reminders exist only at the moment of the callback. They are not queued or stored for later viewing. |

---

## Timing & Reliability

| Issue | Description |
|---|---|
| **No exact-second precision** | The 60-second polling interval means reminders fire within ±60 seconds of the scheduled time. |
| **Time zone dependency** | All reminders use the browser's local time zone. If the user changes time zones while travelling, previously scheduled times shift accordingly. |
| **`localStorage` eviction** | Safari and some mobile browsers may clear `localStorage` after 7 days of inactivity. Reminder configuration and trigger state would be reset. |
| **Dexie (IndexedDB) eviction** | IndexedDB may be evicted under storage pressure, especially on mobile. Reminder records could be lost if the browser needs space. |
| **No cross-device sync** | Reminders configured on one device will not appear on another. Each device maintains its own `localStorage` and IndexedDB. |

---

## Missed Tasks & Exam Countdown

- **Missed task detection** compares `TutorMemory.lastStudyDate` (set when the user interacts with the tutor) against yesterday's date. If the API is not called after study activity, the check may be inaccurate.
- **Exam countdown** relies on `TutorMemory.examDate` (set in Preferences). If the user does not set an exam date, countdown reminders are not created.

---

## Reminder Types

| Type | Condition | Notes |
|---|---|---|
| Daily Study | User-set time, repeats daily | Most reliable; created by default |
| Vocabulary Review | User-set time, daily | Disabled by default; user must enable |
| Mistake Review | User-set time, Mon/Wed/Fri | Disabled by default |
| Writing Draft | User-set time, Tue/Thu/Sat | Disabled by default |
| Exam Countdown | Based on `TutorMemory.examDate` | Only created if exam date is set; updates message dynamically as exam approaches |
| Missed Task | User-set time, weekdays | Disabled by default; fires only after a skipped study day |
| Custom | User-defined schedule | Fully configurable via the service API |

---

## Best Practices to Work Around Limitations

1. **Keep the tab open** during study sessions to receive timely reminders.
2. **Install the Chrome extension** for more reliable alarm-based reminders.
3. **Grant notification permission** in both the website and extension.
4. **Set a realistic reminder time** that matches when you usually study.
5. **Check the dashboard** periodically — in-app reminders accumulate while the page is open.
6. **Do not rely on reminders alone** — use them as a supplement to your own schedule.

---

## Future Improvements (Requires Backend)

The following are **not supported** without a backend server:

- Push notifications (Web Push API / FCM)
- Cross-device reminder sync
- Persistent reminder queue across browser restarts
- Email reminders
- SMS reminders
- Server-side scheduling (e.g., cron jobs)
- Delivery receipts or retry logic

---

*Last updated: July 2026*
