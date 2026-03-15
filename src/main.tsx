// StoryChain - Main Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Import global styles if any
import './styles/index.css';

// Mount React app
const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}