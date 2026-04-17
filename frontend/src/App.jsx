import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import { PhoneCall, AlertTriangle, Voicemail, Activity, CheckCircle, Clock } from 'lucide-react';
import './index.css';

const SOCKET_URL = 'http://localhost:3001';

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, voicemails: 0, urgent: 0 });
  const [urgentAlert, setUrgentAlert] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initial fetch
    fetchLogs();

    // Socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('urgent_call', (data) => {
      setUrgentAlert(data);
      playAlertSound();
      fetchLogs();
      setTimeout(() => setUrgentAlert(null), 10000);
    });

    newSocket.on('new_voicemail', () => {
      fetchLogs();
    });

    return () => newSocket.close();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/logs`);
      const data = await res.json();
      setLogs(data);
      
      setStats({
        total: data.length,
        voicemails: data.filter(l => l.voicemail_url).length,
        urgent: data.filter(l => l.is_urgent).length
      });
    } catch (error) {
      console.error('Failed to fetch logs', error);
    }
  };

  const playAlertSound = () => {
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/beep-01a.mp3');
    audio.play().catch(e => console.log('Audio play blocked:', e));
  };

  return (
    <div className="dashboard-container">
      {urgentAlert && (
        <div className="alert-popup">
          <AlertTriangle color="white" size={32} />
          <div>
            <div style={{ fontWeight: 'bold' }}>🚨 Urgent Call Incoming</div>
            <div className="phone-number">{urgentAlert.phoneNumber}</div>
          </div>
        </div>
      )}

      <header>
        <div className="title">
          <Activity size={36} color="var(--accent-color)" />
          AI Receptionist Desk
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="active-call-indicator"></span>
          <span style={{ color: 'var(--success-color)', fontWeight: '500' }}>System Online</span>
        </div>
      </header>

      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-title">
            <PhoneCall size={18} />
            Total Calls Handled
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title">
            <Voicemail size={18} color="var(--success-color)" />
            Voicemails Recorded
          </div>
          <div className="stat-value" style={{ color: 'var(--success-color)' }}>{stats.voicemails}</div>
        </div>
        <div className="glass-panel stat-card">
          <div className="stat-title">
            <AlertTriangle size={18} color="var(--urgent-border)" />
            Urgent Escalations
          </div>
          <div className="stat-value" style={{ color: 'var(--urgent-border)' }}>{stats.urgent}</div>
        </div>
      </div>

      <div className="glass-panel logs-container">
        <div className="logs-header">Call History & Voicemails</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="logs-table">
            <thead>
              <tr>
                <th>Caller</th>
                <th>Time</th>
                <th>Status</th>
                <th>Voicemail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div className="phone-number">{log.phone_number}</div>
                    <div className="text-xs">{log.direction.toUpperCase()}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} color="var(--text-secondary)" />
                      {format(new Date(log.timestamp), 'PPpp')}
                    </div>
                  </td>
                  <td>
                    {log.is_urgent ? (
                      <span className="status-badge status-urgent">
                        <AlertTriangle size={14} /> Urgent
                      </span>
                    ) : (
                      <span className="status-badge status-default">
                        <CheckCircle size={14} /> {log.call_status}
                      </span>
                    )}
                  </td>
                  <td>
                    {log.voicemail_url ? (
                      <div className="audio-player">
                        <audio controls src={log.voicemail_url}></audio>
                      </div>
                    ) : (
                      <span className="text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No call logs yet. Wait for a call to arrive.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
