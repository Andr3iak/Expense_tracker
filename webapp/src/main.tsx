import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // оставляем старые стили, можно потом заменить на global.css

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);