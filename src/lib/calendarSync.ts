// Calendar sync utilities for Google Calendar and iCal export

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
}

// iCal export functionality
export function generateICalFile(events: CalendarEvent[]): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FocusQuest//Task Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:FocusQuest Tasks`,
    `X-WR-TIMEZONE:${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    ''
  ];

  events.forEach(event => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    const startFormatted = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endFormatted = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    ical.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@focusquest.app`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:${event.title}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      `CATEGORIES:${event.category}`,
      `PRIORITY:${event.urgency === 'high' ? '1' : event.urgency === 'medium' ? '5' : '9'}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
      ''
    );
  });

  ical.push('END:VCALENDAR');
  
  return ical.join('\r\n');
}

export function downloadICalFile(events: CalendarEvent[], filename: string = 'focusquest-tasks.ics') {
  const icalContent = generateICalFile(events);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Google Calendar integration (requires Google Calendar API setup)
export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  discoveryDocs: string[];
  scope: string;
}

export async function initializeGoogleCalendar(config: GoogleCalendarConfig): Promise<boolean> {
  try {
    // Load Google API script
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Initialize gapi
    await new Promise((resolve, reject) => {
      (window as any).gapi.load('client:auth2', () => {
        (window as any).gapi.client.init({
          apiKey: config.apiKey,
          clientId: config.clientId,
          discoveryDocs: config.discoveryDocs,
          scope: config.scope
        }).then(resolve).catch(reject);
      });
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize Google Calendar:', error);
    return false;
  }
}

export async function authenticateGoogleCalendar(): Promise<boolean> {
  try {
    const authInstance = (window as any).gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn();
    return user.isSignedIn();
  } catch (error) {
    console.error('Google Calendar authentication failed:', error);
    return false;
  }
}

export async function createGoogleCalendarEvent(event: CalendarEvent): Promise<boolean> {
  try {
    const calendarEvent = {
      summary: event.title,
      description: event.description || `Category: ${event.category}\nUrgency: ${event.urgency}`,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      colorId: getGoogleCalendarColorId(event.category)
    };

    const response = await (window as any).gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: calendarEvent
    });

    return response.status === 200;
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    return false;
  }
}

function getGoogleCalendarColorId(category: string): string {
  const colorMap: Record<string, string> = {
    'study': '1',    // Blue
    'work': '2',     // Green
    'chores': '3',   // Purple
    'self-care': '4', // Red
    'other': '5'     // Yellow
  };
  return colorMap[category] || '5';
}

export async function syncTasksToGoogleCalendar(events: CalendarEvent[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const event of events) {
    const result = await createGoogleCalendarEvent(event);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}
