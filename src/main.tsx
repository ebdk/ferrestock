import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('No se encontró el contenedor principal.');
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
