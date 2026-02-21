import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BonnardProvider } from '@bonnard/react';
import { DashboardViewer } from '@bonnard/react/dashboard';
import '@bonnard/react/styles.css';

interface ViewerConfig {
  token: string;
  baseUrl: string;
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
      fetch('/__bon/content')
        .then((r) => r.text())
        .then(setMd);
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
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        <DashboardViewer content={md} />
      </div>
    </BonnardProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
