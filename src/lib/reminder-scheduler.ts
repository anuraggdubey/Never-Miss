import { GoogleAuth } from "google-auth-library";
import type { NotificationRhythm } from "./models";
import { getNextOccurrenceIso, getUtcDateForLocal } from "./utils";

type SchedulableMoment = {
  date: string;
  time?: string;
  alertDate?: string;
  alertTime?: string;
};

type ReminderType = "day_before" | "ten_minutes_before" | "custom";

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing on the server.`);
  return value;
}

function getScheduleTimes(moment: SchedulableMoment, rhythm: NotificationRhythm, timeZone: string) {
  if (moment.alertDate && moment.alertTime) {
    const customAlertUtc = getUtcDateForLocal(moment.alertDate, moment.alertTime, timeZone);
    if (customAlertUtc.getTime() > Date.now()) {
      return [{
        type: "custom" as const,
        scheduleTime: customAlertUtc.toISOString(),
      }];
    }
    return [];
  }

  const eventUtc = getUtcDateForLocal(moment.date, moment.time, timeZone);
  const schedules: Array<{ type: ReminderType; scheduleTime: string }> = [];

  if (rhythm === "day_before" || rhythm === "both") {
    schedules.push({
      type: "day_before",
      scheduleTime: new Date(eventUtc.getTime() - (24 * 60 * 60 * 1000)).toISOString(),
    });
  }

  if (moment.time && (rhythm === "ten_minutes_before" || rhythm === "both")) {
    schedules.push({
      type: "ten_minutes_before",
      scheduleTime: new Date(eventUtc.getTime() - (10 * 60 * 1000)).toISOString(),
    });
  }

  return schedules.filter((item) => new Date(item.scheduleTime).getTime() > Date.now());
}

function makeTaskId(uid: string, momentId: string, type: ReminderType, date: string, time?: string) {
  return `${uid}_${momentId}_${type}_${date}_${time ?? "09-00"}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 450);
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Unable to get Google Cloud access token.");
  return token;
}

export async function scheduleReminderTasks(params: {
  uid: string;
  momentId: string;
  moment: SchedulableMoment;
  notificationRhythm: NotificationRhythm;
  timeZone: string;
}) {
  const projectId = getRequiredEnv("CLOUD_TASKS_PROJECT_ID");
  const location = getRequiredEnv("CLOUD_TASKS_LOCATION");
  const queue = getRequiredEnv("CLOUD_TASKS_QUEUE");
  const appBaseUrl = getRequiredEnv("APP_BASE_URL").replace(/\/$/, "");
  const cronSecret = getRequiredEnv("CRON_SECRET");

  const parent = `projects/${projectId}/locations/${location}/queues/${queue}`;
  const schedules = getScheduleTimes(params.moment, params.notificationRhythm, params.timeZone);
  const accessToken = await getAccessToken();
  const occurrenceDate = getNextOccurrenceIso(params.moment.date, params.timeZone);

  await Promise.all(schedules.map(async ({ type, scheduleTime }) => {
    const taskId = makeTaskId(params.uid, params.momentId, type, occurrenceDate, params.moment.time);
    const response = await fetch(`https://cloudtasks.googleapis.com/v2/${parent}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        task: {
          name: `${parent}/tasks/${taskId}`,
          scheduleTime,
          httpRequest: {
            httpMethod: "POST",
            url: `${appBaseUrl}/api/tasks/reminder-dispatch`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
            body: Buffer.from(JSON.stringify({
              uid: params.uid,
              momentId: params.momentId,
              reminderType: type,
              expectedDate: occurrenceDate,
              expectedSourceDate: params.moment.date,
              expectedAlertDate: params.moment.alertDate ?? null,
              expectedAlertTime: params.moment.alertTime ?? null,
              expectedTime: params.moment.time ?? null,
            })).toString("base64"),
          },
        },
      }),
    });

    if (response.ok || response.status === 409) {
      return;
    }

    const payload = await response.text();
    throw new Error(`Cloud Tasks create failed: ${payload}`);
  }));
}
