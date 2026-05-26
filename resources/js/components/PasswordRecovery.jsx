import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const PasswordRecovery = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Código enviado correctamente.');
                setTimeout(() => {
                    navigate('/reset-password');
                }, 2000);
            } else {
                setError(data.message || 'Error al enviar el código.');
            }
        } catch (err) {
            setError('Error de conexión. Inténtalo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="glass-box password p-4 p-md-5 mx-3">
                <div className="text-center mb-4">
                    <h2 className="fw-bold">SENA</h2>
                    <h4 className="mb-3">Bienvenido al CCyS</h4>
                    <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png?rev=40" className="logosena mb-3" alt="Logo SENA" />
                    <h5 className="fw-light text-warning">Recuperar Contraseña</h5>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="user-box">
                        <input
                            type="email"
                            name="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <label>Correo Electrónico</label>
                    </div>
                    <div className="d-grid gap-2">
                        <button className="btn btn-glow w-100 fw-bold" type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Código'}
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <p className="mb-2 theme-text">¿Recordaste tu contraseña? <Link to="/" className="custom-link fw-bold">Inicia sesión</Link></p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PasswordRecovery;
