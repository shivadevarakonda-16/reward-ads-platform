import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#151517',
                color: '#fff',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff'
                }
              },
              error: {
                iconTheme: {
                  primary: '#EB0028',
                  secondary: '#fff'
                }
              }
            }}
          />
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
