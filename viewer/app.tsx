// Polyfill Node.js Buffer for gray-matter (used by dashboard parser)
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BonnardProvider } from '@bonnard/react';
import { DashboardViewer } from '@bonnard/react/dashboard';
import '@bonnard/react/styles.css';

type Tab = 'dashboard' | 'source';

function useIsDark() {
  const [dark, setDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return dark;
}

interface ViewerConfig {
  token: string;
  baseUrl: string;
  orgTheme?: Record<string, unknown> | null;
}

function SourceView({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const dark = useIsDark();
  const lines = content.split('\n');
  const gutterWidth = String(lines.length).length;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div style={{ position: 'relative', maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 8,
          border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          backgroundColor: dark ? '#1f2937' : '#f9fafb',
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            zIndex: 10,
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif',
            border: `1px solid ${dark ? '#4b5563' : '#d1d5db'}`,
            borderRadius: 6,
            backgroundColor: dark ? '#374151' : '#fff',
            cursor: 'pointer',
            color: dark ? '#d1d5db' : '#374151',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        <pre
          style={{
            overflowX: 'auto',
            padding: 16,
            fontSize: 13,
            lineHeight: 1.7,
            margin: 0,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            color: dark ? '#e5e7eb' : 'inherit',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} style={{ display: 'flex' }}>
              <span
                style={{
                  display: 'inline-block',
                  minWidth: `${gutterWidth}ch`,
                  marginRight: 16,
                  textAlign: 'right',
                  color: dark ? '#6b7280' : '#9ca3af',
                  userSelect: 'none',
                }}
              >
                {i + 1}
              </span>
              <code style={{ whiteSpace: 'pre' }}>{line}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function App() {
  const [md, setMd] = useState('');
  const [config, setConfig] = useState<ViewerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const dark = useIsDark();

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
          fontFamily: 'system-ui, sans-serif',
          borderBottom: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          backgroundColor: dark ? '#111827' : '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: dark ? '#fbbf24' : '#92400e',
            backgroundColor: dark ? '#78350f' : '#fef3c7',
            borderBottom: `1px solid ${dark ? '#92400e' : '#fde68a'}`,
          }}
        >
          <span style={{ fontSize: 15 }}>&#9679;</span>
          Local preview — not deployed
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 16px',
          }}
        >
          {(['dashboard', 'source'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '4px 12px',
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 500,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: tab === t ? (dark ? '#1f2937' : '#f3f4f6') : 'transparent',
                color: tab === t ? (dark ? '#f3f4f6' : '#111827') : (dark ? '#9ca3af' : '#6b7280'),
              }}
            >
              {t === 'dashboard' ? 'Dashboard' : 'Source'}
            </button>
          ))}
        </div>
      </div>
      {tab === 'dashboard' ? (
        <DashboardViewer content={md} />
      ) : (
        <SourceView content={md} />
      )}
    </BonnardProvider>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
