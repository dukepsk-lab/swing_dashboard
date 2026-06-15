import { useEffect, useRef, useState, useCallback } from 'react';

// Default to same-origin so it works both in dev (Vite proxies /ws) and in
// production when FastAPI serves the built dashboard on its own port.
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : 'ws://localhost:8000/ws');

export function useWebSocket() {
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const [connected, setConnected] = useState(false);
  const [shots, setShots] = useState([]);
  const [lastShot, setLastShot] = useState(null);
  const [currentClub, setCurrentClub] = useState('7 Iron');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [launchMonitor, setLaunchMonitor] = useState({ connected: false, deviceId: null });

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(WS_URL);

      ws.current.onopen = () => {
        setConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };

      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ping') return;

          if (msg.type === 'init') {
            const d = msg.data;
            setShots(d.shots || []);
            setCurrentClub(d.current_club || '7 Iron');
            setSessionInfo({
              session_id: d.session_id,
              start_time: d.session_start,
            });
            setCourseData(d.course || null);
            setLaunchMonitor({ connected: !!d.lm_connected, deviceId: d.lm_device_id || null });
          } else if (msg.type === 'lm_status') {
            setLaunchMonitor({ connected: !!msg.data.connected, deviceId: msg.data.device_id || null });
          } else if (msg.type === 'shot') {
            const shot = msg.data;
            setLastShot(shot);
            setShots(prev => {
              const updated = [shot, ...prev];
              return updated.slice(0, 50);
            });
          } else if (msg.type === 'club_change') {
            setCurrentClub(msg.data.club);
          } else if (msg.type === 'hole_change') {
            setCourseData(msg.data);
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  const setClub = useCallback((club) => send({ action: 'set_club', club }), [send]);
  const nextHole = useCallback(() => send({ action: 'next_hole' }), [send]);

  return { connected, shots, lastShot, currentClub, sessionInfo, courseData, launchMonitor, setClub, nextHole };
}
