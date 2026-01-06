'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type SessionInfo,
  requestNotificationPermission,
  showSessionNotification,
} from '@/lib/notifications';

export interface Machine {
  id: string;
  name: string;
  status: string;
  config?: {
    projects: string[];
    agentUrl?: string;
  };
}

interface MachineSessionData {
  machineId: string;
  machineName: string;
  agentUrl: string;
  sessions: SessionInfo[];
  lastFetch: number;
  error: string | null;
}

interface SessionPollingContextValue {
  sessionsByMachine: Map<string, MachineSessionData>;
  getSessionsForMachine: (machineId: string) => SessionInfo[];
  refreshMachine: (machineId: string) => Promise<void>;
  setMachines: (machines: Machine[]) => void;
  isLoading: (machineId: string) => boolean;
  getError: (machineId: string) => string | null;
}

const SessionPollingContext = createContext<SessionPollingContextValue | null>(null);

const POLLING_INTERVAL = 3000;
const MACHINES_POLLING_INTERVAL = 30000;
const FETCH_TIMEOUT = 5000;

export function SessionPollingProvider({ children }: { children: ReactNode }) {
  const [machines, setMachinesState] = useState<Machine[]>([]);
  const [sessionsByMachine, setSessionsByMachine] = useState<Map<string, MachineSessionData>>(
    new Map()
  );
  const [loadingMachines, setLoadingMachines] = useState<Set<string>>(new Set());

  const prevSessionsRef = useRef<Map<string, SessionInfo[]>>(new Map());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch machines from API (self-sufficient, doesn't depend on dashboard)
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const response = await fetch('/api/machines');
        if (response.ok) {
          const data = await response.json();
          console.log('[Notifications] Fetched machines:', data.map((m: Machine) => ({ id: m.id, name: m.name, status: m.status })));
          setMachinesState(data);
        }
      } catch (err) {
        console.error('Failed to fetch machines for polling:', err);
      }
    };

    fetchMachines();
    const interval = setInterval(fetchMachines, MACHINES_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const fetchSessionsForMachine = useCallback(
    async (machine: Machine): Promise<MachineSessionData> => {
      const agentUrl = machine.config?.agentUrl || 'localhost:4678';
      const protocol = agentUrl.includes('localhost') ? 'http' : 'https';

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      try {
        const response = await fetch(`${protocol}://${agentUrl}/api/sessions`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Failed to fetch sessions');

        const sessions: SessionInfo[] = await response.json();

        return {
          machineId: machine.id,
          machineName: machine.name,
          agentUrl,
          sessions,
          lastFetch: Date.now(),
          error: null,
        };
      } catch (err) {
        const errorMsg =
          (err as Error).name === 'AbortError'
            ? 'Agent not responding'
            : 'Could not connect to agent';

        return {
          machineId: machine.id,
          machineName: machine.name,
          agentUrl,
          sessions: [],
          lastFetch: Date.now(),
          error: errorMsg,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
    []
  );

  const checkForNotifications = useCallback(
    (machineId: string, machineName: string, newSessions: SessionInfo[]) => {
      const prevSessions = prevSessionsRef.current.get(machineId) || [];

      console.log('[Notifications] Checking sessions:', {
        machineId,
        machineName,
        newSessions: newSessions.map((s) => ({ name: s.name, status: s.status, lastStatusChange: s.lastStatusChange })),
        prevSessions: prevSessions.map((s) => ({ name: s.name, status: s.status, lastStatusChange: s.lastStatusChange })),
      });

      for (const session of newSessions) {
        const prevSession = prevSessions.find((s) => s.name === session.name);
        const isActionable = ['permission', 'stopped', 'waiting'].includes(session.status);

        // New logic: notify if timestamp changed AND status is actionable
        const isNewEvent =
          !prevSession ||
          (session.lastStatusChange !== undefined &&
            session.lastStatusChange !== prevSession.lastStatusChange);

        console.log('[Notifications] Session check:', {
          sessionName: session.name,
          currentStatus: session.status,
          prevStatus: prevSession?.status,
          currentTs: session.lastStatusChange,
          prevTs: prevSession?.lastStatusChange,
          isNewEvent,
          isActionable,
          shouldNotify: isNewEvent && isActionable,
        });

        if (isNewEvent && isActionable) {
          console.log('[Notifications] TRIGGERING notification for:', session.name);
          showSessionNotification(machineId, machineName, session);
        }
      }

      prevSessionsRef.current.set(machineId, [...newSessions]);
    },
    []
  );

  const pollAllMachines = useCallback(async () => {
    const onlineMachines = machines.filter((m) => m.status === 'online');

    console.log('[Notifications] Polling machines:', onlineMachines.length, 'online');

    if (onlineMachines.length === 0) return;

    const results = await Promise.all(onlineMachines.map((machine) => fetchSessionsForMachine(machine)));

    setSessionsByMachine((prev) => {
      const next = new Map(prev);
      for (const result of results) {
        next.set(result.machineId, result);

        const machine = machines.find((m) => m.id === result.machineId);
        if (machine && result.sessions.length > 0) {
          checkForNotifications(result.machineId, machine.name, result.sessions);
        }
      }
      return next;
    });
  }, [machines, fetchSessionsForMachine, checkForNotifications]);

  const refreshMachine = useCallback(
    async (machineId: string) => {
      const machine = machines.find((m) => m.id === machineId);
      if (!machine || machine.status !== 'online') return;

      setLoadingMachines((prev) => new Set(prev).add(machineId));

      const result = await fetchSessionsForMachine(machine);

      setSessionsByMachine((prev) => {
        const next = new Map(prev);
        next.set(result.machineId, result);
        return next;
      });

      checkForNotifications(machineId, machine.name, result.sessions);

      setLoadingMachines((prev) => {
        const next = new Set(prev);
        next.delete(machineId);
        return next;
      });
    },
    [machines, fetchSessionsForMachine, checkForNotifications]
  );

  useEffect(() => {
    if (machines.length === 0) return;

    pollAllMachines();
    const interval = setInterval(pollAllMachines, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [pollAllMachines, machines.length]);

  const value: SessionPollingContextValue = {
    sessionsByMachine,
    getSessionsForMachine: (machineId: string) =>
      sessionsByMachine.get(machineId)?.sessions || [],
    refreshMachine,
    setMachines: setMachinesState,
    isLoading: (machineId: string) => loadingMachines.has(machineId),
    getError: (machineId: string) => sessionsByMachine.get(machineId)?.error || null,
  };

  return (
    <SessionPollingContext.Provider value={value}>{children}</SessionPollingContext.Provider>
  );
}

export function useSessionPolling() {
  const context = useContext(SessionPollingContext);
  if (!context) {
    throw new Error('useSessionPolling must be used within SessionPollingProvider');
  }
  return context;
}
