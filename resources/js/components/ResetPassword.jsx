import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [password_confirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== password_confirmation) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    code,
                    password,
                    password_confirmation
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Contraseña actualizada correctamente.');
                setTimeout(() => {
                    navigate('/'); // Navigate to login
                }, 2000);
            } else {
                setError(data.message || 'Error al actualizar la contraseña.');
            }
        } catch (err) {
            setError('Error de conexión. Inténtalo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="glass-box password p-4 p-md-5 mx-3" style={{ maxWidth: '400px', width: '100%' }}>
                <div className="text-center mb-4">
                    <h2 className="fw-bold">SENA</h2>
                    <h4 className="mb-3">Bienvenido al CCyS</h4>
                    <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png?rev=40" className="logosena mb-3" alt="Logo SENA" />
                    <h5 className="fw-light text-warning">Nueva Contraseña</h5>
                </div>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="user-box">
                        <input
                            type="text"
                            name="code"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            maxLength={10}
                        />
                        <label>Código de Recuperación</label>
                    </div>

                    <div className="user-box">
                        <input
                            type="password"
                            name="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <label>Nueva Contraseña</label>
                    </div>

                    <div className="user-box">
                        <input
                            type="password"
                            name="password_confirmation"
                            required
                            value={password_confirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                        />
                        <label>Confirmar Contraseña</label>
                    </div>

                    <div className="d-grid gap-2">
                        <button className="btn btn-glow w-100 fw-bold" type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : 'Cambiar Contraseña'}
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <Link to="/password-recovery" className="custom-link fw-bold">Volver a solicitar código</Link>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResetPassword;
