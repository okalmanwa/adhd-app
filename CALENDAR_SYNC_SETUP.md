# Calendar Sync Setup Guide

This guide will help you set up Google Calendar and iCal sync functionality for your FocusQuest app.

## Features

- **iCal Export**: Download tasks as .ics files for any calendar app
- **Google Calendar Sync**: Direct sync to Google Calendar (requires API setup)

## iCal Export (No Setup Required)

iCal export works immediately without any configuration. Users can:
- Download tasks as .ics files
- Import into any calendar app (Apple Calendar, Outlook, etc.)
- Only tasks with start and end times are included

## Google Calendar Sync Setup

To enable Google Calendar sync, you need to set up Google Calendar API:

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add your domain to authorized origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
5. Download the credentials JSON file

### 3. Get API Key

1. In "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key

### 4. Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
```

### 5. Restart Your Development Server

```bash
npm run dev
```

## Usage

### iCal Export
1. Click the calendar sync button (📅) in the daily view
2. Click "Download iCal File"
3. Import the .ics file into your preferred calendar app

### Google Calendar Sync
1. Click the calendar sync button (📅) in the daily view
2. Click "Connect Google Calendar"
3. Authorize the app in the popup
4. Click "Sync to Google Calendar"

## Troubleshooting

### Google Calendar Not Working
- Check that environment variables are set correctly
- Ensure Google Calendar API is enabled
- Verify OAuth credentials are configured properly
- Check browser console for error messages

### iCal File Issues
- Make sure tasks have both start and end times
- Check that the file downloads successfully
- Try importing into a different calendar app

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor API usage in Google Cloud Console
