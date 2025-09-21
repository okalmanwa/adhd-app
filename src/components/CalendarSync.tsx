'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Download, Upload, Settings, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Task } from '@/types/rewards';
import { 
  downloadICalFile, 
  initializeGoogleCalendar, 
  authenticateGoogleCalendar, 
  syncTasksToGoogleCalendar,
  CalendarEvent 
} from '@/lib/calendarSync';

interface CalendarSyncProps {
  tasks: Task[];
  onClose: () => void;
}

export function CalendarSync({ tasks, onClose }: CalendarSyncProps) {
  const [isGoogleCalendarReady, setIsGoogleCalendarReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert tasks to calendar events
  const convertTasksToEvents = (tasks: Task[]): CalendarEvent[] => {
    return tasks
      .filter(task => !task.completed && task.start_time && task.end_time)
      .map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || `Category: ${task.category}\nUrgency: ${task.urgency}`,
        startTime: task.start_time!,
        endTime: task.end_time!,
        category: task.category,
        urgency: task.urgency
      }));
  };

  const events = convertTasksToEvents(tasks);

  useEffect(() => {
    // Initialize Google Calendar API
    const initGoogleCalendar = async () => {
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events'
      };

      if (config.clientId && config.apiKey) {
        const ready = await initializeGoogleCalendar(config);
        setIsGoogleCalendarReady(ready);
      }
    };

    initGoogleCalendar();
  }, []);

  const handleICalDownload = () => {
    if (events.length === 0) {
      setError('No tasks available to export. Tasks need start and end times.');
      return;
    }

    try {
      downloadICalFile(events, `focusquest-tasks-${new Date().toISOString().split('T')[0]}.ics`);
      setError(null);
    } catch (err) {
      setError('Failed to generate iCal file');
    }
  };

  const handleGoogleCalendarAuth = async () => {
    if (!isGoogleCalendarReady) {
      setError('Google Calendar API not initialized. Please check your configuration.');
      return;
    }

    try {
      const authenticated = await authenticateGoogleCalendar();
      setIsAuthenticated(authenticated);
      setError(null);
    } catch (err) {
      setError('Failed to authenticate with Google Calendar');
    }
  };

  const handleGoogleCalendarSync = async () => {
    if (!isAuthenticated) {
      setError('Please authenticate with Google Calendar first');
      return;
    }

    if (events.length === 0) {
      setError('No tasks available to sync. Tasks need start and end times.');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncTasksToGoogleCalendar(events);
      setSyncResult(result);
    } catch (err) {
      setError('Failed to sync with Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-mint-400 to-lavender-400">
              Calendar Sync
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* iCal Export */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <Download size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Export to iCal</h3>
                <p className="text-sm text-gray-400">Download tasks as .ics file for any calendar app</p>
              </div>
            </div>
            
            <button
              onClick={handleICalDownload}
              disabled={events.length === 0}
              className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                events.length === 0
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300'
              }`}
            >
              <Download size={18} />
              <span>Download iCal File ({events.length} tasks)</span>
            </button>
          </div>

          {/* Google Calendar Sync */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                <Calendar size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Google Calendar</h3>
                <p className="text-sm text-gray-400">Sync tasks directly to your Google Calendar</p>
              </div>
            </div>

            {!isGoogleCalendarReady ? (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                Google Calendar API not configured. Please add your Google API credentials to environment variables.
              </div>
            ) : !isAuthenticated ? (
              <button
                onClick={handleGoogleCalendarAuth}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 font-medium transition-all"
              >
                <Upload size={18} />
                <span>Connect Google Calendar</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle size={16} />
                  <span>Connected to Google Calendar</span>
                </div>
                
                <button
                  onClick={handleGoogleCalendarSync}
                  disabled={isSyncing || events.length === 0}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isSyncing || events.length === 0
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300'
                  }`}
                >
                  {isSyncing ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>
                    {isSyncing ? 'Syncing...' : `Sync to Google Calendar (${events.length} tasks)`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle size={16} />
                <span className="font-medium">Sync Complete</span>
              </div>
              <p className="text-sm text-green-200">
                Successfully synced {syncResult.success} tasks. 
                {syncResult.failed > 0 && ` ${syncResult.failed} failed.`}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 mb-1">
                <XCircle size={16} />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <Settings size={16} className="text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Note:</p>
                <p>Only tasks with start and end times can be synced to calendars. Completed tasks are excluded.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
