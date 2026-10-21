import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';
import { showAlert } from './CustomAlert';

// Generador de sonido 'beep' de confirmación de escaneo
export const playScanBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1840, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        // En caso de que el AudioContext esté restringido
    }
};

const AccessControlScanner = ({ onIngresoCreated, initialIngresos = [] }) => {
    const scannerInstanceRef = useRef(null);
    const fileInputRef = useRef(null);
    const cooldownRef = useRef(false);

    // Estados de configuración de escaneo
    const [cameraActive, setCameraActive] = useState(false);
    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState('');
    const [ingresoPlace, setIngresoPlace] = useState('Entrada Principal');
    const [customPlace, setCustomPlace] = useState('');
    const [isCustomPlace, setIsCustomPlace] = useState(false);

    // Estados de procesamiento
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [lastScanResult, setLastScanResult] = useState(null);
    const [recentIngresos, setRecentIngresos] = useState(initialIngresos);

    // Registro manual por documento
    const [manualDoc, setManualDoc] = useState('');
    const [manualLoading, setManualLoading] = useState(false);

    // Sincronizar historial inicial
    useEffect(() => {
        if (initialIngresos && initialIngresos.length > 0) {
            setRecentIngresos(initialIngresos);
        }
    }, [initialIngresos]);

    const activePlace = isCustomPlace ? (customPlace.trim() || 'Entrada Principal') : ingresoPlace;

    // Detener la cámara de manera segura
    const stopCamera = async () => {
        if (scannerInstanceRef.current) {
            try {
                if (scannerInstanceRef.current.isScanning) {
                    await scannerInstanceRef.current.stop();
                }
                scannerInstanceRef.current.clear();
            } catch (err) {
                console.warn('Advertencia al detener cámara:', err);
            }
            scannerInstanceRef.current = null;
        }
        setCameraActive(false);
    };

    // Iniciar la cámara seleccionada
    const startCamera = async (cameraIdToUse) => {
        try {
            setErrorMessage('');
            await stopCamera();

            const html5QrCode = new Html5Qrcode('access-control-reader');
            scannerInstanceRef.current = html5QrCode;

            const cameraConfig = cameraIdToUse
                ? { deviceId: { exact: cameraIdToUse } }
                : { facingMode: 'environment' };

            await html5QrCode.start(
                cameraConfig,
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    handleQrDetected(decodedText);
                },
                () => {
                    // Frame scan skip
                }
            );

            setCameraActive(true);
        } catch (err) {
            console.error('Error al iniciar cámara:', err);
            setCameraActive(false);
            if (err.name === 'NotAllowedError' || String(err).includes('Permission')) {
                setErrorMessage('Permiso de cámara denegado. Concede permisos de cámara en tu navegador.');
            } else if (err.name === 'NotFoundError' || String(err).includes('NotFound')) {
                setErrorMessage('No se encontró ninguna cámara disponible en tu dispositivo.');
            } else {
                setErrorMessage('No fue posible abrir la cámara web. Puedes probar subiendo una imagen o ingresar el documento.');
            }
        }
    };

    // Alternar encendido/apagado de la cámara
    const toggleCamera = () => {
        if (cameraActive) {
            stopCamera();
        } else {
            startCamera(selectedCameraId);
        }
    };

    // Cargar dispositivos de cámara disponibles
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then(devices => {
                if (devices && devices.length > 0) {
                    setCameras(devices);
                    setSelectedCameraId(devices[0].id);
                }
            })
            .catch(err => {
                console.warn('No se pudieron listar cámaras con anterioridad:', err);
            });

        return () => {
            stopCamera();
        };
    }, []);

    // Procesar código QR detectado y registrar ingreso
    const handleQrDetected = async (rawQrString) => {
        if (cooldownRef.current || isProcessing) return;
        cooldownRef.current = true;
        setIsProcessing(true);
        playScanBeep();

        try {
            const response = await axios.post('/api/admin/ingresos/scan', {
                qr_data: rawQrString,
                ingreso_place: activePlace
            });

            const data = response.data;
            setLastScanResult({
                status: 'success',
                user: data.user,
                ingreso: data.ingreso,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            });

            // Actualizar lista de ingresos recientes
            setRecentIngresos(prev => [data.ingreso, ...prev]);
            if (onIngresoCreated) onIngresoCreated(data.ingreso);

            showAlert(
                `✅ ${data.user?.user_name} ${data.user?.user_lastname} (${data.user?.role?.rol_name || 'Usuario'}) registrado en ${activePlace}`,
                'success'
            );
        } catch (error) {
            console.error('Error al registrar ingreso:', error);
            const errData = error.response?.data;
            const message = errData?.message || 'Error al validar el código QR.';

            setLastScanResult({
                status: 'error',
                message: message,
                expired: !!errData?.expired,
                timestamp: new Date().toLocaleTimeString()
            });

            if (errData?.expired) {
                showAlert('⚠️ El código QR ha expirado. El usuario debe actualizar su carnet digital.', 'warning');
            } else {
                showAlert(`❌ ${message}`, 'error');
            }
        } finally {
            setIsProcessing(false);
            // Pausa de 3.5 segundos para evitar re-escaneo accidental continuo del mismo carnet
            setTimeout(() => {
                cooldownRef.current = false;
            }, 3500);
        }
    };

    // Escanear archivo de imagen
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            await stopCamera();
            const html5QrCode = new Html5Qrcode('access-control-reader');
            scannerInstanceRef.current = html5QrCode;

            const decodedText = await html5QrCode.scanFile(file, true);
            await handleQrDetected(decodedText);
        } catch (err) {
            console.error('Error escaneando imagen:', err);
            showAlert('No se detectó un código QR válido en la imagen seleccionada.', 'error');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Registrar ingreso manual por documento
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const doc = manualDoc.trim();
        if (!doc) return;

        setManualLoading(true);
        try {
            const response = await axios.post('/api/admin/ingresos/scan', {
                qr_data: doc,
                ingreso_place: activePlace
            });

            const data = response.data;
            playScanBeep();
            setLastScanResult({
                status: 'success',
                user: data.user,
                ingreso: data.ingreso,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            });

            setRecentIngresos(prev => [data.ingreso, ...prev]);
            if (onIngresoCreated) onIngresoCreated(data.ingreso);
            showAlert(`✅ Ingreso manual registrado: ${data.user?.user_name} ${data.user?.user_lastname}`, 'success');
            setManualDoc('');
        } catch (error) {
            const message = error.response?.data?.message || 'Usuario no encontrado por documento.';
            showAlert(`❌ ${message}`, 'error');
        } finally {
            setManualLoading(false);
        }
    };

    // Icono según rol
    const getRolBadgeClass = (rolName) => {
        const r = (rolName || '').toLowerCase();
        if (r === 'admin') return 'bg-danger text-danger border-danger';
        if (r === 'instructor') return 'bg-primary text-primary border-primary';
        return 'bg-success text-success border-success';
    };

    return (
        <div className="access-scanner-container fade-in-up">
            {/* Título de la interfaz */}
            <div className="text-center mb-4">
                <h2 className="fw-bold mb-1" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                    Control de <span style={{ color: 'var(--primary-color)' }}>Acceso</span> y Registro QR
                </h2>
                <p className="opacity-75 small">
                    Habilita la lectura para escanear el carnet digital de cualquier usuario y registrar su ingreso oficial con verificación de seguridad.
                </p>
            </div>

            {/* Panel de Configuración y Controles Superiores */}
            <div className="glass-box p-3 p-md-4 mb-4 access-control-card">
                <div className="row g-3 align-items-center">
                    {/* Botón principal para Habilitar / Detener Cámara */}
                    <div className="col-12 col-md-5 d-flex gap-2">
                        <button
                            type="button"
                            className={`btn ${cameraActive ? 'btn-outline-danger' : 'btn-success'} w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm`}
                            style={{ borderRadius: '16px', fontSize: '0.95rem' }}
                            onClick={toggleCamera}
                        >
                            <span className="material-symbols-outlined">
                                {cameraActive ? 'videocam_off' : 'qr_code_scanner'}
                            </span>
                            {cameraActive ? 'Detener Cámara' : 'Habilitar Lectura de QR'}
                        </button>
                    </div>

                    {/* Selector de Punto de Ingreso */}
                    <div className="col-12 col-md-7">
                        <div className="d-flex flex-column gap-1">
                            <label className="form-label opacity-75 small mb-0 d-flex align-items-center gap-1">
                                <span className="material-symbols-outlined text-success" style={{ fontSize: '18px' }}>location_on</span>
                                Punto de Ingreso Actual
                            </label>
                            <div className="d-flex gap-2">
                                {!isCustomPlace ? (
                                    <select
                                        className="form-select form-select-sm py-2"
                                        style={{ borderRadius: '12px' }}
                                        value={ingresoPlace}
                                        onChange={(e) => {
                                            if (e.target.value === 'CUSTOM') {
                                                setIsCustomPlace(true);
                                            } else {
                                                setIngresoPlace(e.target.value);
                                            }
                                        }}
                                    >
                                        <option value="Entrada Principal">Entrada Principal</option>
                                    </select>
                                ) : (
                                    <div className="input-group input-group-sm">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Nombre del punto."
                                            value={customPlace}
                                            onChange={(e) => setCustomPlace(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setIsCustomPlace(false)}
                                        >
                                            <span className="material-symbols-outlined small">arrow_back</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controles secundarios: Selector de cámara física y subida de archivo */}
                <div className="d-flex flex-wrap align-items-center justify-content-between mt-3 pt-3 border-top border-success border-opacity-15 gap-2 small">
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge px-2 py-1 d-flex align-items-center gap-1 ${cameraActive ? 'scanner-status-active' : 'scanner-status-inactive'}`}>
                            <span className={cameraActive ? 'dynamic-qr-pulse' : ''} style={{ width: '6px', height: '6px' }}></span>
                            {cameraActive ? 'Cámara Activa' : 'Cámara En Espera'}
                        </span>

                        {cameras.length > 1 && (
                            <select
                                className="form-select form-select-sm py-1 px-2 border-success border-opacity-25"
                                style={{ borderRadius: '10px', fontSize: '0.78rem' }}
                                value={selectedCameraId}
                                onChange={(e) => {
                                    setSelectedCameraId(e.target.value);
                                    if (cameraActive) startCamera(e.target.value);
                                }}
                            >
                                {cameras.map(cam => (
                                    <option key={cam.id} value={cam.id}>
                                        📷 {cam.label || `Cámara ${cam.id.slice(0, 6)}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="d-none"
                            onChange={handleFileUpload}
                        />
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1 px-3 py-1"
                            style={{ borderRadius: '10px', fontSize: '0.78rem' }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                        >
                            <span className="material-symbols-outlined small">photo_camera_back</span>
                            Escanear Imagen / Foto
                        </button>
                    </div>
                </div>
            </div>

            {/* Área Principal: Visor de Escaneo y Panel de Resultados en Tiempo Real */}
            <div className="row g-4 mb-4">
                {/* Columna Izquierda: Visor del Escáner */}
                <div className="col-12 col-lg-6">
                    <div className="glass-box p-3 access-control-card h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small d-flex align-items-center gap-1">
                                <span className="material-symbols-outlined text-success" style={{ fontSize: '18px' }}>
                                    center_focus_weak
                                </span>
                                Visor de Lectura QR
                            </span>
                            {isProcessing && (
                                <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 d-flex align-items-center gap-1">
                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                    Validando...
                                </span>
                            )}
                        </div>

                        {/* Viewport del lector Html5Qrcode */}
                        <div className="qr-scanner-viewport-wrapper position-relative rounded-4 overflow-hidden shadow-lg border border-2 border-success border-opacity-30 flex-grow-1" style={{ minHeight: '340px' }}>
                            <div id="access-control-reader" style={{ width: '100%', height: '100%', minHeight: '340px', background: '#000' }}></div>

                            {/* Línea láser y esquinas cuando la cámara está activa */}
                            {cameraActive && (
                                <>
                                    <div className="qr-scan-laser"></div>
                                    <div className="qr-target-corners">
                                        <span className="corner top-left"></span>
                                        <span className="corner top-right"></span>
                                        <span className="corner bottom-left"></span>
                                        <span className="corner bottom-right"></span>
                                    </div>
                                </>
                            )}

                            {/* Standby / Error cuando la cámara no está activa */}
                            {!cameraActive && (
                                <div className="position-absolute inset-0 d-flex flex-column align-items-center justify-content-center p-4 text-center access-standby-box" style={{ top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}>
                                    {errorMessage ? (
                                        <>
                                            <span className="material-symbols-outlined text-warning mb-2" style={{ fontSize: '48px' }}>
                                                videocam_off
                                            </span>
                                            <p className="small text-danger mb-3" style={{ maxWidth: '320px' }}>{errorMessage}</p>
                                            <button
                                                type="button"
                                                className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
                                                onClick={() => startCamera(selectedCameraId)}
                                            >
                                                <span className="material-symbols-outlined small">refresh</span>
                                                Reintentar Cámara
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="stat-icon p-3 rounded-circle mb-3 shadow" style={{ width: '70px', height: '70px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
                                                    qr_code_scanner
                                                </span>
                                            </div>
                                            <h5 className="fw-bold mb-1">Escáner Desactivado</h5>
                                            <p className="small opacity-75 mb-3" style={{ maxWidth: '300px' }}>
                                                Presiona el botón de abajo para activar la cámara web y comenzar el control de accesos.
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-success btn-sm px-4 py-2 d-flex align-items-center gap-2 shadow"
                                                style={{ borderRadius: '12px' }}
                                                onClick={() => startCamera(selectedCameraId)}
                                            >
                                                <span className="material-symbols-outlined small">videocam</span>
                                                Activar Cámara Ahora
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Fallback de Registro Manual por Documento */}
                        <div className="mt-3 pt-3 border-top border-success border-opacity-15">
                            <form onSubmit={handleManualSubmit}>
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                    <label className="form-label opacity-75 small mb-0">
                                        ¿Sin cámara o problema con la pantalla? Registro por documento:
                                    </label>
                                </div>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text">
                                        <span className="material-symbols-outlined small">badge</span>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Número de cédula o documento..."
                                        value={manualDoc}
                                        onChange={(e) => setManualDoc(e.target.value)}
                                        disabled={manualLoading}
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-success d-flex align-items-center gap-1"
                                        disabled={manualLoading || !manualDoc.trim()}
                                    >
                                        {manualLoading ? (
                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                        ) : (
                                            <span className="material-symbols-outlined small">check</span>
                                        )}
                                        Registrar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Columna Derecha: Tarjeta del Último Usuario Escaneado y Verificado */}
                <div className="col-12 col-lg-6">
                    <div className="glass-box p-4 access-control-card h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-success border-opacity-20">
                            <span className="fw-bold small d-flex align-items-center gap-2">
                                <span className="material-symbols-outlined text-success" style={{ fontSize: '20px' }}>
                                    verified_user
                                </span>
                                Último Ingreso Escaneado
                            </span>
                            {lastScanResult?.timestamp && (
                                <span className="opacity-50 small" style={{ fontSize: '0.75rem' }}>
                                    Hora: {lastScanResult.timestamp}
                                </span>
                            )}
                        </div>

                        {lastScanResult ? (
                            lastScanResult.status === 'success' && lastScanResult.user ? (
                                <div className="access-live-result-card p-3 rounded-4 glass-box flex-grow-1 d-flex flex-column justify-content-between">
                                    <div>
                                        {/* Cabecera del usuario con avatar */}
                                        <div className="d-flex align-items-center gap-3 mb-3">
                                            <div
                                                className="user-avatar-lg shadow overflow-hidden border border-2 border-success"
                                                style={{ width: '64px', height: '64px', borderRadius: '18px', margin: 0 }}
                                            >
                                                {lastScanResult.user.profile_photo_path ? (
                                                    <img
                                                        src={lastScanResult.user.profile_photo_path}
                                                        alt="Foto"
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '1.4rem' }}>
                                                        {lastScanResult.user.user_name?.[0]}{lastScanResult.user.user_lastname?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="mb-0 fw-bold" style={{ fontSize: '1.25rem' }}>
                                                    {lastScanResult.user.user_name} {lastScanResult.user.user_lastname}
                                                </h4>
                                                <div className="d-flex align-items-center gap-2 mt-1">
                                                    <span className={`carnet-role-badge role-${(lastScanResult.user.role?.rol_name || 'default').toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '3px 12px' }}>
                                                        {lastScanResult.user.role?.rol_name || 'Usuario'}
                                                    </span>
                                                    <span className="access-granted-badge px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                                        ✅ ACCESO CONCEDIDO
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Datos del usuario */}
                                        <div className="row g-2 small mb-3">
                                            <div className="col-6">
                                                <div className="user-info-box p-2 rounded-3">
                                                    <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>DOCUMENTO</span>
                                                    <span className="fw-bold text-truncate d-block">{lastScanResult.user.user_identification || 'S/N'}</span>
                                                </div>
                                            </div>
                                            <div className="col-6">
                                                <div className="user-info-box p-2 rounded-3">
                                                    <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>FICHA</span>
                                                    <span className="fw-bold text-truncate d-block">{lastScanResult.user.user_coursenumber || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="user-info-box p-2 rounded-3">
                                                    <span className="opacity-50 d-block" style={{ fontSize: '0.68rem' }}>PROGRAMA</span>
                                                    <span className="fw-bold text-truncate d-block">{lastScanResult.user.user_program || 'General'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Equipos Relacionados */}
                                        <div className="p-2 rounded-3 bg-dark bg-opacity-25 border border-success border-opacity-20 mb-2">
                                            <div className="d-flex align-items-center justify-content-between mb-1">
                                                <span className="small fw-bold d-flex align-items-center gap-1">
                                                    <span className="material-symbols-outlined text-success" style={{ fontSize: '16px' }}>devices</span>
                                                    Equipos Autorizados al Ingresar:
                                                </span>
                                                <span className="badge bg-success bg-opacity-15 text-success" style={{ fontSize: '0.65rem' }}>
                                                    {lastScanResult.user.ingreso_equipos?.length || 0} Registrado(s)
                                                </span>
                                            </div>

                                            {lastScanResult.user.ingreso_equipos && lastScanResult.user.ingreso_equipos.length > 0 ? (
                                                <div className="d-flex flex-column gap-1 mt-1">
                                                    {lastScanResult.user.ingreso_equipos.map(eq => (
                                                        <div key={eq.id_ingreso_equipo} className="d-flex justify-content-between align-items-center p-1 px-2 rounded bg-dark bg-opacity-35 small">
                                                            <span className="text-truncate">
                                                                <strong>{eq.equipo_type}:</strong> {eq.equipo_brand} {eq.equipo_model}
                                                            </span>
                                                            <code className="text-success small ms-2">{eq.equipo_serial}</code>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="opacity-50 small d-block">Sin equipos portátiles declarados en el sistema.</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pie con detalles del registro de ingreso */}
                                    <div className="pt-2 border-top border-success border-opacity-15 d-flex justify-content-between align-items-center small">
                                        <span className="opacity-75">
                                            Lugar: <strong className="text-success">{lastScanResult.ingreso?.ingreso_place || activePlace}</strong>
                                        </span>
                                        <span className="badge bg-success bg-opacity-20 text-success">
                                            Ingreso Oficial #{lastScanResult.ingreso?.id_ingreso}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-4 bg-danger bg-opacity-10 border border-danger border-opacity-30 text-center my-auto">
                                    <span className="material-symbols-outlined text-danger mb-2" style={{ fontSize: '42px' }}>
                                        {lastScanResult.expired ? 'timer_off' : 'error'}
                                    </span>
                                    <h5 className="fw-bold text-danger mb-1">
                                        {lastScanResult.expired ? 'Código QR Expirado' : 'Lectura No Autorizada'}
                                    </h5>
                                    <p className="small opacity-75 mb-0">
                                        {lastScanResult.message}
                                    </p>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-5 opacity-50 my-auto">
                                <span className="material-symbols-outlined mb-2" style={{ fontSize: '48px' }}>
                                    qr_code_2
                                </span>
                                <h6 className="fw-bold mb-1">A la espera de lectura</h6>
                                <p className="small mb-0">
                                    Enfoca un carnet digital frente a la cámara web activa para procesar la entrada de forma automática.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Historial de Ingresos de Hoy */}
            <div className="glass-box p-4 access-control-card">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-success border-opacity-20 flex-wrap gap-2">
                    <div>
                        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                            <span className="material-symbols-outlined text-success">history</span>
                            Ingresos Registrados Hoy
                        </h5>
                        <span className="opacity-50 small" style={{ fontSize: '0.72rem' }}>
                            Monitoreo en tiempo real de entradas validadas
                        </span>
                    </div>
                    <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30 px-3 py-2 fw-bold" style={{ fontSize: '0.8rem' }}>
                        Total Hoy: {recentIngresos.filter(i => new Date(i.ingreso_datetime).toDateString() === new Date().toDateString()).length}
                    </span>
                </div>

                <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '35vh' }}>
                    <table className="table admin-table mb-0">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Identificación / Rol</th>
                                <th>Fecha y Hora</th>
                                <th>Punto de Acceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentIngresos.length > 0 ? (
                                recentIngresos.slice(0, 20).map((ing, idx) => (
                                    <tr key={ing.id_ingreso || idx} className={idx === 0 && lastScanResult?.status === 'success' ? 'table-success bg-opacity-10' : ''}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle bg-success text-dark d-flex align-items-center justify-content-center fw-bold overflow-hidden" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                                    {ing.user?.profile_photo_path ? (
                                                        <img src={ing.user.profile_photo_path} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <>{ing.user?.user_name?.[0]}{ing.user?.user_lastname?.[0]}</>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="fw-bold d-block">{ing.user?.user_name} {ing.user?.user_lastname}</span>
                                                    <span className="small opacity-50">{ing.user?.user_email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <span className="fw-semibold d-block">{ing.user?.user_identification || 'S/N'}</span>
                                                <span className={`carnet-role-badge role-${(ing.user?.role?.rol_name || 'default').toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                                    {ing.user?.role?.rol_name || 'Usuario'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center gap-1 small">
                                                <span className="material-symbols-outlined opacity-50 small">schedule</span>
                                                {new Date(ing.ingreso_datetime).toLocaleString()}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 small">
                                                {ing.ingreso_place}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 opacity-50">
                                        No hay ingresos registrados en esta sesión.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccessControlScanner;
