import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';

const Login = () => {
    // HOOK: useNavigate maneja las redirecciones post-login hacia los paneles de control.
    const navigate = useNavigate();

    // HOOK: Múltiples useState para almacenar temporalmente los datos del formulario (email, password) mientras el usuario escribe.
    const [user_email, setEmail] = useState(''); // Estado para almacenar email del usuario
    const [user_password, setPassword] = useState(''); // Estado para almacenar contraseña del usuario
    const [showPassword, setShowPassword] = useState(false); // Estado para alternar visibilidad de contraseña
    const [isGuestMode, setIsGuestMode] = useState(false); // Estado para alternar modo invitado
    const [guestData, setGuestData] = useState({ // Estado para almacenar datos de invitado
        user_name: '',
        user_identification: ''
    });

    // Funcion para manejar el envio del formulario de login
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', {
                user_email,
                user_password
            });

            // guardar token y rol en localStorage para uso futuro
            localStorage.setItem('access_token', response.data.access_token);
            localStorage.setItem('user_role', response.data.role);

            alert(response.data.message);
            // Handle role-based navigation or storing tokens
            const userRole = response.data.role.toLowerCase();
            if (userRole === 'admin') {
                navigate('/admin');
            } else if (userRole === 'instructor') {
                navigate('/instructor');
            } else if (userRole === 'aprendiz') {
                navigate('/aprendiz');
            } else {
                navigate('/loading');
            }
        } catch (error) {
            if (error.response) {
                alert(error.response.data.message || 'Error en el inicio de sesión');
            } else {
                alert('Error al conectar con el servidor.');
            }
        }
    };

    // Funcion para alternar visibilidad de contraseña
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Funcion para manejar el envio del formulario de invitado
    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/register-guest', guestData);
            alert(response.data.message);
            setIsGuestMode(false);
            setGuestData({ user_name: '', user_identification: '' });
            navigate('/loading');
        } catch (error) {
            alert('Error al registrar ingreso de invitado');
        }
    };

    if (isGuestMode) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-90 fade-in-up">
                <div className="glass-box p-4 p-md-5 mx-3">
                    <div className="text-center mb-4">
                        <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png?rev=40" className="logosena mb-3" alt="Logo SENA" />
                        <h2 className="fw-bold mb-0">Invitado</h2>
                        <h5 className="fw-light text-success">Ingreso Rapido</h5>
                        <hr className="border-success opacity-25" />
                        <p className="mt-3 small opacity-75">Ingrese sus datos básicos para registrar su entrada</p>
                    </div>

                    <form onSubmit={handleGuestSubmit}>
                        <div className="user-box">
                            <input
                                type="text"
                                required
                                placeholder=" "
                                value={guestData.user_identification}
                                onChange={(e) => setGuestData({ ...guestData, user_identification: e.target.value })}
                            />
                            <label>Número de Documento</label>
                        </div>
                        <div className="user-box">
                            <input
                                type="text"
                                required
                                placeholder=" "
                                value={guestData.user_name}
                                // Funcion para generar los datos de invitado (guest)
                                onChange={(e) => setGuestData({ ...guestData, user_name: e.target.value })}
                            />
                            <label>Nombre Completo</label>
                        </div>

                        <div className="d-grid gap-3 mt-4">
                            <button className="btn btn-glow btn-primary-login w-100 fw-bold py-3" type="submit">
                                REGISTRAR INGRESO
                            </button>
                            <button
                                type="button"
                                className="btn btn-glow w-100"
                                onClick={() => setIsGuestMode(false)}
                            >
                                VOLVER AL LOGIN
                            </button>
                        </div>
                    </form>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-90 fade-in-up">
            <div className="glass-box p-4 p-md-5 mx-3">
                <div className="text-center mb-4">
                    <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png?rev=40" className="logosena mb-3" alt="Logo SENA" />
                    <h2 className="landing-title fw-bold mb-0">Sena <span className="neon-text">Access</span></h2>
                    <h5 className="fw-light text-success">Acceso CCyS</h5>
                    <hr className="border-success opacity-25" />
                    <h4 className="mt-3 fw-bold">Iniciar Sesión</h4>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="user-box">
                        <input
                            type="email"
                            name="user_email"
                            required
                            placeholder=" "
                            value={user_email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label>Correo electrónico</label>
                    </div>
                    <div className="user-box">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="user_password"
                            required
                            placeholder=" "
                            value={user_password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label>Contraseña</label>
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                    <line x1="12" y1="5" x2="12" y2="2" />
                                    <line x1="5" y1="8" x2="3" y2="5" />
                                    <line x1="19" y1="8" x2="21" y2="5" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 10c4 6 16 6 20 0" />
                                    <line x1="12" y1="15" x2="12" y2="18" />
                                    <line x1="7" y1="14" x2="5" y2="17" />
                                    <line x1="17" y1="14" x2="19" y2="17" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="d-grid gap-3 mb-4">
                        <button className="btn btn-glow btn-primary-login w-100 fw-bold py-3 d-flex align-items-center justify-content-center gap-2" type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                // Icono de flecha de inicio de sesión
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            INGRESAR
                        </button>

                        <div className="position-relative text-center my-2">
                            <hr className="border-secondary opacity-25" />
                            <span className="position-absolute top-50 start-50 translate-middle theme-bg theme-text px-3 small opacity-50">O</span>
                        </div>

                        <button
                            type="button"
                            className="btn btn-glow w-100 fw-bold"
                            onClick={() => setIsGuestMode(true)}
                        >
                            INVITADO
                        </button>
                    </div>
                </form>

                <div className="mt-4 text-center">
                    <p className="mb-2 theme-text opacity-75 small">¿No estás registrado? <Link to="/register" className="custom-link fw-bold text-success">¡Regístrate aquí!</Link></p>
                    <p className="mb-4 theme-text opacity-75 small">¿Olvidaste tu contraseña? <Link to="/password-recovery" className="custom-link fw-bold text-success">Recuperar</Link></p>

                    <div className="d-grid gap-2">
                        <Link to="/fingerprint" className="btn btn-glow w-100 d-flex align-items-center justify-content-center gap-2" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <span className="material-symbols-outlined" style={{ color: '#02d914', fontSize: '24px' }}>fingerprint</span>
                            ACCESO CON HUELLA
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Login;
