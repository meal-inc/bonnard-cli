// Polyfill Node.js Buffer for gray-matter (used by dashboard parser)
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BonnardProvider } from '@bonnard/react';
import { DashboardViewer } from '@bonnard/react/dashboard';
import '@bonnard/react/styles.css';

interface ViewerConfig {
  token: string;
  baseUrl: string;
  orgTheme?: Record<string, unknown> | null;
}

function App() {
  const [md, setMd] = useState('');
  const [config, setConfig] = useState<ViewerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/__bon/config').then((r) => r.json()),
      fetch('/__bon/content').then((r) => r.text()),
    ])
      .then(([cfg, content]) => {
        setConfig(cfg as ViewerConfig);
        setMd(content);
      })
      .catch((err) => setError(err.message));

    // SSE for live reload on file changes
    const es = new EventSource('/__bon/events');
    es.onmessage = () => {
      Promise.all([
        fetch('/__bon/config').then((r) => r.json()),
        fetch('/__bon/content').then((r) => r.text()),
      ]).then(([cfg, content]) => {
        setConfig(cfg as ViewerConfig);
        setMd(content);
        setError(null);
      }).catch((err) => setError(`Reload failed: ${err.message}`));
    };
    es.onerror = () => {
      setError('Lost connection to dev server. Is it still running?');
    };
    return () => es.close();
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#dc2626' }}>Failed to load dashboard</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#666' }}>
        Loading...
      </div>
    );
  }

  return (
    <BonnardProvider
      config={{
        fetchToken: async () => config.token,
        baseUrl: config.baseUrl,
      }}
      orgTheme={config.orgTheme}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '6px 16px',
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 500,
          color: '#92400e',
          backgroundColor: '#fef3c7',
          borderBottom: '1px solid #fde68a',
        }}
      >
        <span style={{ fontSize: 15 }}>&#9679;</span>
        Local preview — not deployed
      </div>
      <DashboardViewer content={md} />
    </BonnardProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
