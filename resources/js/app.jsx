import './bootstrap';
import '../css/app.css';

import React, { Suspense, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';
import PasswordRecovery from './components/PasswordRecovery';
import ResetPassword from './components/ResetPassword';
import Fingerprint from './components/Fingerprint';
import Loading from './components/Loading';
import Admin from './components/Admin';
import Instructor from './components/Instructor';
import Aprendiz from './components/Aprendiz';
import LandingPage from './components/LandingPage';

console.log("Iniciando aplicación React...");
// Componente principal de la aplicación
const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // Efecto para aplicar el tema seleccionado y guardarlo en localStorage
    useEffect(() => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Función para alternar entre temas
    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    console.log("Renderizando componente App...");
    return (
        <BrowserRouter>
            {/* Botón de Modo Claro/Oscuro */}
            <button 
                onClick={toggleTheme}
                className="theme-toggle-btn"
                aria-label="Toggle theme"
            >
                <span className="material-symbols-outlined">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
            </button>

            <div style={{color: 'var(--text-color)', position: 'fixed', bottom: 10, right: 10, background: 'var(--glass-bg)', padding: '5px', zIndex: 9999, borderRadius: '5px', fontSize: '12px'}}>
            </div>
            <Suspense fallback={<div className="text-white text-center mt-5">Cargando componentes...</div>}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/password-recovery" element={<PasswordRecovery />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/fingerprint" element={<Fingerprint />} />
                    <Route path="/loading" element={<Loading />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/instructor" element={<Instructor />} />
                    <Route path="/aprendiz" element={<Aprendiz />} />
                    <Route path="*" element={<div style={{color: 'var(--text-color)'}}>404 - Página no encontrada</div>} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

const rootElement = document.getElementById('app');
if (rootElement) {
    console.log("Elemento #app encontrado. Montando...");
    try {
        const root = ReactDOM.createRoot(rootElement);
        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>
        );
        console.log("Montado ejecutado sin errores inmediatos.");
    } catch (err) {
        console.error("Error durante el renderizado de App.jsx", err);
    }
} else {
    console.error("No se encontró el elemento \"app\" en el DOM.");
}
