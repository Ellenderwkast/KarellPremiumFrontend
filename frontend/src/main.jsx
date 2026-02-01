import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="758550286236-50pcuhofp7ukgd59j8r36rmo2mmvej6r.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
