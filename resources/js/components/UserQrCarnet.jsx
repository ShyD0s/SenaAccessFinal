import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { showAlert } from './CustomAlert';

const UserQrCarnet = ({ currentUser, onClose, asModal = false }) => {
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [generating, setGenerating] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [windowTotal, setWindowTotal] = useState(30);
    const carnetRef = useRef(null);
    const timerRef = useRef(null);

    // Obtener el token dinámico y generar el QR
    const fetchDynamicQr = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        try {
            const response = await axios.get('/api/my-qr-token');
            const data = response.data;

            const qrPayload = JSON.stringify({
                app: data.app || 'SENA_ACCESS',
                ver: data.ver || 2,
                id_usuario: data.id_usuario,
                user_identification: data.user_identification,
                user_name: data.user_name,
                role: data.role,
                time_window: data.time_window,
                timestamp: data.timestamp,
                token: data.token
            });

            const url = await QRCode.toDataURL(qrPayload, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });

            setQrDataUrl(url);
            const remaining = data.expires_in || 30;
            setTimeLeft(remaining);
            if (data.window_seconds) setWindowTotal(data.window_seconds);
            setGenerating(false);
            if (isManual) showAlert('Código QR actualizado correctamente', 'success');
        } catch (error) {
            console.warn('Error obteniendo token dinámico de servidor, usando fallback:', error);
            // Fallback con datos locales si la red falla momentáneamente
            if (currentUser) {
                const nowSec = Math.floor(Date.now() / 1000);
                const localWindow = Math.floor(nowSec / 30);
                const localPayload = JSON.stringify({
                    app: 'SENA_ACCESS',
                    ver: 1,
                    id_usuario: currentUser.id_usuario,
                    user_identification: currentUser.user_identification || '',
                    user_name: `${currentUser.user_name || ''} ${currentUser.user_lastname || ''}`.trim(),
                    user_email: currentUser.user_email || '',
                    user_coursenumber: currentUser.user_coursenumber || 0,
                    role: currentUser.role?.rol_name || '',
                    time_window: localWindow,
                    timestamp: nowSec
                });

                try {
                    const fallbackUrl = await QRCode.toDataURL(localPayload, {
                        width: 280,
                        margin: 2,
                        color: { dark: '#000000', light: '#ffffff' },
                        errorCorrectionLevel: 'H'
                    });
                    setQrDataUrl(fallbackUrl);
                } catch (e) {
                    console.error('Error generando fallback QR:', e);
                }
            }
            setTimeLeft(30);
            setGenerating(false);
        } finally {
            setIsRefreshing(false);
        }
    }, [currentUser]);

    // Efecto para inicializar la carga del QR dinámico
    useEffect(() => {
        fetchDynamicQr();
    }, [fetchDynamicQr]);

    // Efecto del temporizador que cuenta regresivamente segundo a segundo
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    fetchDynamicQr();
                    return windowTotal;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fetchDynamicQr, windowTotal]);

    // Descargar el carnet completo como imagen usando html2canvas
    const handleDownloadCarnet = async () => {
        if (!carnetRef.current || generating) return;
        setDownloading(true);
        try {
            // Ocultar el footer con los botones antes de capturar
            const footer = carnetRef.current.querySelector('.carnet-footer');
            const dynamicBar = carnetRef.current.querySelector('.carnet-dynamic-bar');
            if (footer) footer.style.display = 'none';
            if (dynamicBar) dynamicBar.style.display = 'none';

            const canvas = await html2canvas(carnetRef.current, {
                backgroundColor: null,
                scale: 3,
                useCORS: true,
                allowTaint: true,
                logging: false,
            });

            if (footer) footer.style.display = '';
            if (dynamicBar) dynamicBar.style.display = '';

            const link = document.createElement('a');
            link.download = `Carnet_SENA_${currentUser?.user_identification || currentUser?.user_name || 'usuario'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showAlert('Carnet descargado con éxito', 'success');
        } catch (err) {
            console.error('Error al descargar carnet:', err);
            showAlert('Error al generar la imagen del carnet', 'error');
        } finally {
            setDownloading(false);
        }
    };

    // Icono dinámico según el rol
    const getRolIcon = (rolName) => {
        const rol = (rolName || '').toLowerCase();
        if (rol === 'aprendiz') return 'school';
        if (rol === 'instructor') return 'person_book';
        if (rol === 'admin') return 'admin_panel_settings';
        if (rol === 'funcionario') return 'badge';
        return 'badge';
    };

    const progressPercentage = Math.max(0, Math.min(100, (timeLeft / windowTotal) * 100));

    const content = (
        <div className="carnet-digital-wrapper fade-in-up">
            <div className="carnet-card glass-box mx-auto" ref={carnetRef}>
                {/* Encabezado del Carnet */}
                <div className="carnet-header d-flex align-items-center justify-content-between p-3 border-bottom border-success border-opacity-25">
                    <div className="d-flex align-items-center gap-2">
                        <img src="/Icons/logoSena.png" alt="SENA" style={{ height: '36px' }} />
                        <div>
                            <h6 className="mb-0 fw-bold" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>
                                SENA <span className="text-success neon-text">ACCESS</span>
                            </h6>
                            <span className="carnet-official-badge">
                                CARNET DIGITAL OFICIAL
                            </span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-success" style={{ fontSize: '28px' }} title="Oficial">
                        verified
                    </span>
                </div>

                {/* Cuerpo del Carnet */}
                <div className="carnet-body p-4 text-center">
                    {/* Foto o Avatar */}
                    <div className="user-avatar-lg mx-auto mb-3 shadow overflow-hidden border border-2 border-success border-opacity-50" style={{ width: '90px', height: '90px' }}>
                        {currentUser?.profile_photo_path ? (
                            <img src={currentUser.profile_photo_path} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '2rem' }}>
                                {currentUser?.user_name?.[0]}{currentUser?.user_lastname?.[0]}
                            </span>
                        )}
                    </div>

                    {/* Datos Principales */}
                    <h4 className="fw-bold mb-1" style={{ fontSize: '1.35rem' }}>
                        {currentUser?.user_name} {currentUser?.user_lastname}
                    </h4>
                    <span className={`carnet-role-badge role-${(currentUser?.role?.rol_name || 'default').toLowerCase()} mb-2`}>
                        {currentUser?.role?.rol_name || 'Usuario'}
                    </span>

                    {/* Barra de Seguridad Dinámica */}
                    <div className="carnet-dynamic-bar my-2 p-2 rounded-3 bg-dark bg-opacity-25 border border-success border-opacity-20">
                        <div className="d-flex align-items-center justify-content-between mb-1 small">
                            <span className="dynamic-qr-badge py-1 px-2" style={{ fontSize: '0.68rem' }}>
                                <span className="dynamic-qr-pulse"></span>
                                QR DINÁMICO ACTIVO
                            </span>
                            <div className="d-flex align-items-center gap-1">
                                <span className="opacity-75 small" style={{ fontSize: '0.72rem' }}>
                                    Expira en <strong>{timeLeft}s</strong>
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-link p-0 text-success ms-1"
                                    onClick={() => fetchDynamicQr(true)}
                                    disabled={isRefreshing || generating}
                                    title="Actualizar código QR ahora"
                                    style={{ lineHeight: 1 }}
                                >
                                    <span className={`material-symbols-outlined small ${isRefreshing ? 'dynamic-qr-rotating' : ''}`} style={{ fontSize: '18px' }}>
                                        sync
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Barra de progreso de tiempo restante */}
                        <div className="dynamic-qr-progress-track">
                            <div
                                className="dynamic-qr-progress-bar"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Código QR Generado */}
                    <div className="carnet-qr-box mx-auto my-3 p-2 bg-white rounded-4 shadow-sm position-relative" style={{ width: '210px', height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {generating ? (
                            <div className="spinner-border text-success" role="status">
                                <span className="visually-hidden">Generando QR...</span>
                            </div>
                        ) : qrDataUrl ? (
                            <img
                                src={qrDataUrl}
                                alt="Código QR Personal Dinámico"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    opacity: isRefreshing ? 0.6 : 1,
                                    transition: 'opacity 0.2s ease'
                                }}
                            />
                        ) : (
                            <span className="text-danger small">Error generando QR</span>
                        )}
                    </div>

                    <p className="small opacity-75 mb-3" style={{ fontSize: '0.76rem' }}>
                        Por tu seguridad, este código se renueva automáticamente cada 30 segundos. Muestra tu pantalla al ingresar al centro.
                    </p>

                    {/* Metadatos del Aprendiz / Usuario */}
                    <div className="row g-2 text-start small">
                        <div className="col-6">
                            <div className="user-info-box p-2 rounded-3">
                                <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>DOCUMENTO</span>
                                <span className="fw-bold text-truncate d-block">{currentUser?.user_identification || 'No registrado'}</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="user-info-box p-2 rounded-3">
                                <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>FICHA</span>
                                <span className="fw-bold text-truncate d-block">{currentUser?.user_coursenumber || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="user-info-box p-2 rounded-3">
                                <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>PROGRAMA</span>
                                <span className="fw-bold text-truncate d-block">{currentUser?.user_program || 'General'}</span>
                            </div>
                        </div>
                        {/* ROL en el contenedor */}
                        <div className="col-6">
                            <div className="user-info-box p-2 rounded-3 d-flex align-items-center gap-2">
                                <span className="material-symbols-outlined text-success" style={{ fontSize: '18px' }}>
                                    {getRolIcon(currentUser?.role?.rol_name)}
                                </span>
                                <div className="overflow-hidden">
                                    <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>ROL</span>
                                    <span className="fw-bold text-truncate d-block" style={{ textTransform: 'capitalize' }}>
                                        {currentUser?.role?.rol_name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pie del Carnet con Acciones */}
                <div className="carnet-footer p-3 border-top border-success border-opacity-15 d-flex gap-2">
                    <button
                        type="button"
                        className="btn btn-success btn-sm flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2"
                        style={{ borderRadius: '12px' }}
                        onClick={handleDownloadCarnet}
                        disabled={downloading || generating}
                    >
                        <span className="material-symbols-outlined small">
                            {downloading ? 'hourglass_empty' : 'id_card'}
                        </span>
                        {downloading ? 'Generando...' : 'Descargar Carnet'}
                    </button>
                    {asModal && onClose && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm px-3 py-2"
                            style={{ borderRadius: '12px' }}
                            onClick={onClose}
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    if (asModal) {
        return (
            <div className="equipment-modal-overlay" onClick={onClose}>
                <div style={{ maxWidth: '440px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default UserQrCarnet;
