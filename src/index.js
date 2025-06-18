import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import './contexts/axios'; // Import axios configuration
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
    <ToastContainer position="bottom-left" rtl />
  </React.StrictMode>
);

reportWebVitals(); 