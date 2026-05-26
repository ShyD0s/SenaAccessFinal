import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
// Componente de registro que permite a los usuarios crear una cuenta, con validación de campos y manejo de errores devueltos por la API
const Register = () => {
    // HOOK: useNavigate se utiliza para devolver al usuario al Login después de registrarse exitosamente.
    const navigate = useNavigate();

    // HOOK: useState almacena un objeto completo con todos los datos ingresados en los múltiples inputs del formulario de registro.
    const [formData, setFormData] = useState({
        user_identification: '',
        user_name: '',
        user_lastname: '',
        user_email: '',
        user_password: '',
        user_password_confirmation: '',
        user_coursenumber: '',
        user_program: ''
    });
    // Estado para almacenar errores de validación devueltos por la API, esto para mostrar mensajes de error específicos debajo de cada campo del formulario
    const [errors, setErrors] = useState({});
    // Estado para controlar la visibilidad de las contraseñas y mostrar un spinner de carga mientras se procesa el registro
    const [showPassword, setShowPassword] = useState(false);
    // Estado para controlar la visibilidad del spinner de carga
    const [loading, setLoading] = useState(false);
    // Función para manejar cambios en los campos del formulario, actualizando el estado formData y limpiando errores
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Limpiar error del campo que se está editando
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica de contraseñas en cliente
        if (formData.user_password !== formData.user_password_confirmation) {
            setErrors({ user_password_confirmation: ['Las contraseñas no coinciden'] });
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            const response = await axios.post('/api/register', formData);
            alert(response.data.message);
            navigate('/');
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                alert('Error al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex flex-column align-items-center fade-in-up">
            <div className="glass-box register-box p-4 p-md-5 mx-3 shadow-lg my-5" style={{ maxWidth: '850px', border: '1px solid rgba(2, 217, 20, 0.2)' }}>
                <div className="text-center mb-5">
                    <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png?rev=40" className="logosena mb-3" alt="Logo SENA" style={{ width: '80px' }} />
                    <h2 className="fw-bold mb-1" style={{ fontSize: '2rem', letterSpacing: '-1px' }}>Sena<span style={{ color: 'var(--primary-color)' }}>Access</span></h2>
                    <p className="theme-text opacity-75 small">Crea tu cuenta institucional para acceder al centro</p>
                    <div className="d-flex justify-content-center mt-3">
                        <hr className="border-success opacity-25 w-50" />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-2">
                    {/* Sección: Información Personal */}
                    <div className="mb-4">
                        <div className="d-flex align-items-center gap-2 mb-3 text-success opacity-75">
                            <span className="material-symbols-outlined small">person</span>
                            <span className="text-uppercase small fw-bold" style={{ letterSpacing: '1px' }}>Información Personal</span>
                        </div>
                        <div className="row g-4">
                            <div className="col-md-12 user-box mb-0">
                                <input type="text" name="user_identification" required placeholder=" " value={formData.user_identification} onChange={handleChange} className={errors.user_identification ? 'border-danger' : ''} />
                                <label>Número de Identificación</label>
                                {errors.user_identification && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_identification[0]}</div>}
                            </div>
                            <div className="col-md-6 user-box mb-0">
                                <input type="text" name="user_name" required placeholder=" " value={formData.user_name} onChange={handleChange} />
                                <label>Nombres</label>
                                {errors.user_name && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_name[0]}</div>}
                            </div>
                            <div className="col-md-6 user-box mb-0">
                                <input type="text" name="user_lastname" required placeholder=" " value={formData.user_lastname} onChange={handleChange} />
                                <label>Apellidos</label>
                                {errors.user_lastname && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_lastname[0]}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Sección: Información Académica */}
                    <div className="mb-4 pt-2">
                        <div className="d-flex align-items-center gap-2 mb-3 text-success opacity-75">
                            <span className="material-symbols-outlined small">school</span>
                            <span className="text-uppercase small fw-bold" style={{ letterSpacing: '1px' }}>Formación Académica</span>
                        </div>
                        <div className="row g-4">
                            <div className="col-md-12 user-box mb-0">
                                <input type="email" name="user_email" required placeholder=" " value={formData.user_email} onChange={handleChange} />
                                <label>Correo Electrónico Institucional</label>
                                {errors.user_email && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_email[0]}</div>}
                            </div>
                            <div className="col-md-5 user-box mb-0">
                                <input type="number" name="user_coursenumber" required placeholder=" " value={formData.user_coursenumber} onChange={handleChange} />
                                <label>Número de Ficha</label>
                                {errors.user_coursenumber && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_coursenumber[0]}</div>}
                            </div>
                            <div className="col-md-7 user-box mb-0">
                                <input type="text" name="user_program" required placeholder=" " value={formData.user_program} onChange={handleChange} />
                                <label>Programa de Formación</label>
                                {errors.user_program && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_program[0]}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Sección: Seguridad */}
                    <div className="mb-5 pt-2">
                        <div className="d-flex align-items-center gap-2 mb-3 text-success opacity-75">
                            <span className="material-symbols-outlined small">lock</span>
                            <span className="text-uppercase small fw-bold" style={{ letterSpacing: '1px' }}>Seguridad de la Cuenta</span>
                        </div>
                        <div className="row g-4">
                            <div className="col-md-6 user-box mb-0">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="user_password"
                                    required
                                    placeholder=" "
                                    value={formData.user_password}
                                    onChange={handleChange}
                                />
                                <label>Crear Contraseña</label>
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ top: '10px' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                                {errors.user_password && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_password[0]}</div>}
                            </div>
                            <div className="col-md-6 user-box mb-0">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="user_password_confirmation"
                                    required
                                    placeholder=" "
                                    value={formData.user_password_confirmation}
                                    onChange={handleChange}
                                />
                                <label>Confirmar Contraseña</label>
                                {errors.user_password_confirmation && <div className="text-danger mt-1 small d-flex align-items-center gap-1"><span className="material-symbols-outlined small" style={{ fontSize: '14px' }}>error</span> {errors.user_password_confirmation[0]}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                        <button
                            className="btn btn-glow btn-primary-login w-100 fw-bold py-3 d-flex align-items-center justify-content-center gap-2"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    PROCESANDO...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                    CREAR CUENTA
                                </>
                            )}
                        </button>
                        <Link to="/login" className="btn btn-glow w-100 text-center text-decoration-none d-flex align-items-center justify-content-center gap-2">
                            <span className="material-symbols-outlined">login</span>
                            VOLVER AL LOGIN
                        </Link>
                    </div>
                </form>
            </div>

            <Footer />
        </div>
    );
};

export default Register;
