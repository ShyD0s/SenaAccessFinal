import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const Fingerprint = () => {
    const navigate = useNavigate();
    const [leftCaptured, setLeftCaptured] = useState(false);
    const [rightCaptured, setRightCaptured] = useState(false);
    const [scanningLeft, setScanningLeft] = useState(false);
    const [scanningRight, setScanningRight] = useState(false);
    // Función para simular el proceso de escaneo de huellas, 
    // activando animaciones y estados correspondientes para cada mano
    const handleScan = (hand) => {
        if (hand === 'left') {
            setScanningLeft(true);
            setTimeout(() => {
                setScanningLeft(false);
                setLeftCaptured(true);
            }, 2500);
        } else {
            setScanningRight(true);
            setTimeout(() => {
                setScanningRight(false);
                setRightCaptured(true);
            }, 2500);
        }
    };

    const allCaptured = leftCaptured && rightCaptured;

    return (
        <div className="d-flex flex-column align-items-center min-vh-100 py-5 fade-in-up">
            <div className="glass-box my-auto py-5 shadow-lg" style={{ width: '95%', maxWidth: '1000px', border: '1px solid rgba(2, 217, 20, 0.2)' }}>
                <div className="text-center mb-5">
                    <span className="material-symbols-outlined text-success mb-2" style={{ fontSize: '48px' }}>fingerprint</span>
                    <h2 className="fw-bold mb-1" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>
                        Acceso con <span style={{ color: 'var(--primary-color)' }}>Huella</span>
                    </h2>
                    <p className="theme-text opacity-75">Verificación biométrica para ingreso al Centro de Formación</p>
                    <div className="d-flex justify-content-center mt-3">
                        <hr className="border-success opacity-25 w-25" />
                    </div>
                </div>

                {/* Grid con mayor separación horizontal y vertical */}
                <div className="container-fluid px-md-5">
                    <div className="row g-5 justify-content-center">
                        {/* Índice Izquierdo */}
                        <div className="col-lg-5 col-md-6 d-flex justify-content-center">
                            <div className={`fingerprint-card w-100 ${leftCaptured ? 'captured' : ''} ${scanningLeft ? 'scanning' : ''}`}>
                                <div className="scan-container">
                                    <div className="scan-line"></div>
                                    <span className="material-symbols-outlined fingerprint-icon">fingerprint</span>
                                </div>
                                <h4 className="fw-bold mb-3 text-center" style={{ color: 'var(--text-color)' }}>Índice Izquierdo</h4>
                                
                                <button 
                                    className={`btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${leftCaptured ? 'btn-success' : 'btn-glow'}`}
                                    onClick={() => handleScan('left')}
                                    disabled={scanningLeft || leftCaptured}
                                >
                                    {scanningLeft ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            ESCANEANDO...
                                        </>
                                    ) : leftCaptured ? (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            VERIFICADO
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">sensors</span>
                                            CAPTURAR
                                        </>
                                    )}
                                </button>

                                <div className="mt-3 small opacity-75 text-center" style={{ color: 'var(--text-color)' }}>
                                    {scanningLeft ? 'Procesando biometría...' : leftCaptured ? 'Identidad confirmada' : 'Esperando captura'}
                                </div>
                            </div>
                        </div>

                        {/* Índice Derecho */}
                        <div className="col-lg-5 col-md-6 d-flex justify-content-center">
                            <div className={`fingerprint-card w-100 ${rightCaptured ? 'captured' : ''} ${scanningRight ? 'scanning' : ''}`}>
                                <div className="scan-container">
                                    <div className="scan-line"></div>
                                    <span className="material-symbols-outlined fingerprint-icon">fingerprint</span>
                                </div>
                                <h4 className="fw-bold mb-3 text-center" style={{ color: 'var(--text-color)' }}>Índice Derecho</h4>
                                
                                <button 
                                    className={`btn w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${rightCaptured ? 'btn-success' : 'btn-glow'}`}
                                    onClick={() => handleScan('right')}
                                    disabled={scanningRight || rightCaptured}
                                >
                                    {scanningRight ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                            ESCANEANDO...
                                        </>
                                    ) : rightCaptured ? (
                                        <>
                                            <span className="material-symbols-outlined">check_circle</span>
                                            VERIFICADO
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">sensors</span>
                                            CAPTURAR
                                        </>
                                    )}
                                </button>

                                <div className="mt-3 small opacity-75 text-center" style={{ color: 'var(--text-color)' }}>
                                    {scanningRight ? 'Procesando biometría...' : rightCaptured ? 'Identidad confirmada' : 'Esperando captura'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5 px-4 mx-auto" style={{ maxWidth: '750px' }}>
                    <button 
                        className={`btn w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${allCaptured ? 'btn-success btn-primary-login shadow-lg' : 'btn-outline-secondary opacity-50'}`}
                        disabled={!allCaptured}
                        onClick={() => navigate('/loading')}
                        style={{ letterSpacing: '2px' }}
                    >
                        {allCaptured ? (
                            <>
                                <span className="material-symbols-outlined">login</span>
                                FINALIZAR Y CONTINUAR
                            </>
                        ) : (
                            'COMPLETE AMBAS VERIFICACIONES PARA CONTINUAR'
                        )}
                    </button>
                    
                    <div className="mt-4">
                        <Link to="/" className="custom-link small text-uppercase fw-bold opacity-100" style={{ letterSpacing: '1px', color: 'var(--text-color)', textDecoration: 'none' }}>
                            <span className="material-symbols-outlined align-middle me-1" style={{ fontSize: '18px' }}>arrow_back</span>
                            Volver al inicio de sesión
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Fingerprint;
