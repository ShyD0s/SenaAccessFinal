import React, { useState } from 'react';

const FingerprintSimulation = ({ onCaptureComplete }) => {
    const [leftCaptured, setLeftCaptured] = useState(false);
    const [rightCaptured, setRightCaptured] = useState(false);
    const [scanningLeft, setScanningLeft] = useState(false);
    const [scanningRight, setScanningRight] = useState(false);

    const handleScan = (hand) => {
        if (hand === 'left') {
            setScanningLeft(true);
            setTimeout(() => {
                setScanningLeft(false);
                setLeftCaptured(true);
                if (rightCaptured) onCaptureComplete(true);
            }, 2500);
        } else {
            setScanningRight(true);
            setTimeout(() => {
                setScanningRight(false);
                setRightCaptured(true);
                if (leftCaptured) onCaptureComplete(true);
            }, 2500);
        }
    };

    return (
        <div className="fingerprint-simulation-container p-4 glass-box border-success border-opacity-25 mt-4 mx-auto" style={{ maxWidth: '800px' }}>
            <div className="text-center mb-4">
                <h5 className="fw-bold text-success d-flex align-items-center justify-content-center gap-2">
                    <span className="material-symbols-outlined">fingerprint</span>
                    Registro Biométrico (Simulación)
                </h5>
                <p className="small opacity-75 mb-0">Capture sus huellas para habilitar el acceso biométrico</p>
            </div>

            <div className="row g-4 justify-content-center align-items-center">
                {/* Índice Izquierdo */}
                <div className="col-12 col-sm-6 d-flex justify-content-center">
                    <div className={`fingerprint-card py-4 d-flex flex-column align-items-center ${leftCaptured ? 'captured' : ''} ${scanningLeft ? 'scanning' : ''}`} style={{ minWidth: '220px', width: '100%' }}>
                        <div className="scan-container mb-3 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <div className="scan-line"></div>
                            <span className="material-symbols-outlined fingerprint-icon" style={{ fontSize: '50px' }}>fingerprint</span>
                        </div>
                        <h6 className="fw-bold mb-3 small text-center">Índice Izquierdo</h6>
                        <button
                            type="button"
                            className={`btn btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${leftCaptured ? 'btn-success' : 'btn-glow'}`}
                            onClick={() => handleScan('left')}
                            disabled={scanningLeft || leftCaptured}
                            style={{ maxWidth: '180px' }}
                        >
                            {scanningLeft ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : leftCaptured ? (
                                <span className="material-symbols-outlined small">check_circle</span>
                            ) : (
                                <span className="material-symbols-outlined small">sensors</span>
                            )}
                            {scanningLeft ? '' : leftCaptured ? 'VERIFICADO' : 'CAPTURAR'}
                        </button>
                    </div>
                </div>

                {/* Índice Derecho */}
                <div className="col-12 col-sm-6 d-flex justify-content-center">
                    <div className={`fingerprint-card py-4 d-flex flex-column align-items-center ${rightCaptured ? 'captured' : ''} ${scanningRight ? 'scanning' : ''}`} style={{ minWidth: '220px', width: '100%' }}>
                        <div className="scan-container mb-3 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <div className="scan-line"></div>
                            <span className="material-symbols-outlined fingerprint-icon" style={{ fontSize: '50px' }}>fingerprint</span>
                        </div>
                        <h6 className="fw-bold mb-3 small text-center">Índice Derecho</h6>
                        <button
                            type="button"
                            className={`btn btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-2 ${rightCaptured ? 'btn-success' : 'btn-glow'}`}
                            onClick={() => handleScan('right')}
                            disabled={scanningRight || rightCaptured}
                            style={{ maxWidth: '180px' }}
                        >
                            {scanningRight ? (
                                <span className="spinner-border spinner-border-sm" role="status"></span>
                            ) : rightCaptured ? (
                                <span className="material-symbols-outlined small">check_circle</span>
                            ) : (
                                <span className="material-symbols-outlined small">sensors</span>
                            )}
                            {scanningRight ? '' : rightCaptured ? 'VERIFICADO' : 'CAPTURAR'}
                        </button>
                    </div>
                </div>
            </div>

            {leftCaptured && rightCaptured && (
                <div className="alert alert-success mt-4 mb-0 py-2 border-success border-opacity-25 bg-success bg-opacity-10 text-success text-center small fade-in-up">
                    <span className="material-symbols-outlined small align-middle me-1">task_alt</span>
                    Huellas capturadas exitosamente
                </div>
            )}
        </div>
    );
};

export default FingerprintSimulation;
