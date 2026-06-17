import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './index.css';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('=== Global error handler ===');
  console.error('Message:', event.message);
  console.error('Filename:', event.filename);
  console.error('Line:', event.lineno, 'Column:', event.colno);
  console.error('Error object:', event.error);
  console.error('===========================');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('=== Unhandled promise rejection ===');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
  console.error('===================================');
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      onError: (error) => {
        console.error('[QueryClient] Query error:', error);
      },
    },
    mutations: {
      onError: (error, variables, context) => {
        console.error('[QueryClient] Mutation error:', { error, variables, context });
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
