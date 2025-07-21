// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App.jsx';
import { ApiContext, API_BASE_URL } from '../apiConfig.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApiContext.Provider value={API_BASE_URL}>
    <App />
  </ApiContext.Provider>
);
