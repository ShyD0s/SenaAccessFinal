import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import Navbar from './Navbar';
import FingerprintSimulation from './FingerprintSimulation';

const Aprendiz = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'comprobantes', 'profile'
    const [ingresos, setIngresos] = useState([]);
    const [equipmentList, setEquipmentList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProfile, setEditingProfile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        user_identification: '',
        user_name: '',
        user_lastname: '',
        user_email: '',
        user_password: '',
        user_coursenumber: '',
        user_program: ''
    });

    useEffect(() => { // Logica para cargar los datos del usuario, haciendo el uso de useEffect
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [userMeResponse, ingresosResponse, equipmentResponse] = await Promise.all([ // Realiza múltiples solicitudes al backend para obtener la información del usuario, sus ingresos y los equipos registrados, utilizando Promise.all para optimizar la carga de datos y reducir el tiempo de espera
                    axios.get('/api/user'),
                    axios.get('/api/my-ingresos'),
                    axios.get('/api/my-equipment')
                ]);

                setCurrentUser(userMeResponse.data);
                setIngresos(ingresosResponse.data);
                setEquipmentList(equipmentResponse.data);

                setFormData({ // Set inicial del formulario de edición de perfil con los datos obtenidos del backend, permitiendo que el usuario vea su información actual y pueda editarla fácilmente sin tener que ingresar todos los datos desde cero
                    user_identification: userMeResponse.data.user_identification || '',
                    user_name: userMeResponse.data.user_name,
                    user_lastname: userMeResponse.data.user_lastname,
                    user_email: userMeResponse.data.user_email,
                    user_password: '',
                    user_coursenumber: userMeResponse.data.user_coursenumber,
                    user_program: userMeResponse.data.user_program,
                    profile_photo_path: userMeResponse.data.profile_photo_path || null
                });
            } catch (error) { // catch para manejar errores en la carga de los datos 
                console.error('Error cargando datos: ', error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_role');
                    navigate('/login');
                }
            } finally { // Finally para asegurar que el estado de carga se actualice correctamente independientemente de si la solicitud fue exitosa o si ocurrió un error, evitando que la interfaz quede en un estado de carga indefinido
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key !== 'profile_photo_path') {
                    data.append(key, formData[key]);
                }
            });
            if (selectedFile) {
                data.append('image', selectedFile);
            }
            data.append('_method', 'PUT');

            const response = await axios.post('/api/my-profile', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setCurrentUser(response.data);
            alert('Perfil actualizado con éxito');
            setEditingProfile(false);
            setSelectedFile(null);
        } catch (error) {
            alert('Error al actualizar perfil: ' + (error.response?.data?.message || 'Error desconocido'));
        }
    };

    if (loading) return <div className="text-white text-center mt-5">Cargando...</div>;

    const renderView = () => {
        if (editingProfile) {
            return (
                <div className="fade-in-up">
                    <div className="glass-box p-4 mb-5 mx-auto fade-in-up" style={{ maxWidth: '850px' }}>
                        <div className="section-header">
                            <h3 className="mb-0">Editar Mi Perfil</h3>
                        </div>
                        <div className="admin-scrollable-container" style={{ maxHeight: '55vh' }}>
                            <form onSubmit={handleUpdateProfile}>
                                <div className="row">
                                    <div className="col-12 mb-3 text-center">
                                        <div className="user-avatar-lg mx-auto mb-2 shadow overflow-hidden border border-success" style={{ width: '120px', height: '120px' }}>
                                            {selectedFile ? (
                                                <img src={URL.createObjectURL(selectedFile)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : formData.profile_photo_path ? (
                                                <img src={formData.profile_photo_path} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>add_a_photo</span>
                                            )}
                                        </div>
                                        <label className="btn btn-outline-success btn-sm cursor-pointer">
                                            <span className="material-symbols-outlined small me-1">upload</span>
                                            {selectedFile || formData.profile_photo_path ? 'Cambiar Foto' : 'Subir Foto'}
                                            <input type="file" className="d-none" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </div>

                                    <div className="col-12 mb-4">
                                        <FingerprintSimulation onCaptureComplete={() => { }} />
                                    </div>

                                    <div className="col-md-4 mb-3">
                                        <label className="form-label opacity-75 small">N° Documento</label>
                                        <input type="text" name="user_identification" className="form-control bg-dark text-white border-success" value={formData.user_identification} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label opacity-75 small">Nombre</label>
                                        <input type="text" name="user_name" className="form-control bg-dark text-white border-success" value={formData.user_name} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label opacity-75 small">Apellido</label>
                                        <input type="text" name="user_lastname" className="form-control bg-dark text-white border-success" value={formData.user_lastname} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label opacity-75 small">Email Institucional</label>
                                        <input type="email" name="user_email" className="form-control bg-dark text-white border-success" value={formData.user_email} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label opacity-75 small">Nueva Contraseña (Opcional)</label>
                                        <input type="password" name="user_password" placeholder="Mínimo 6 caracteres..." className="form-control bg-dark text-white border-success" value={formData.user_password} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label opacity-75 small">Ficha</label>
                                        <input type="number" name="user_coursenumber" className="form-control bg-dark text-white border-success" value={formData.user_coursenumber} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label opacity-75 small">Programa</label>
                                        <input type="text" name="user_program" className="form-control bg-dark text-white border-success" value={formData.user_program} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="d-flex gap-2 mt-4">
                                    <button type="submit" className="btn btn-success action-btn flex-grow-1 py-2">
                                        <span className="material-symbols-outlined">save</span> Guardar Cambios
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary action-btn px-4" onClick={() => setEditingProfile(false)}>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            );
        }

        switch (view) {
            case 'dashboard':
                return (
                    <div className="fade-in-up">
                        <div className="text-center mb-5">
                            <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                                Dashboard <span style={{ color: 'var(--primary-color)' }}>Aprendiz</span>
                            </h2>
                            <p className="opacity-75">Bienvenid@, {currentUser?.user_name}. Aquí tienes un resumen de tu actividad.</p>
                        </div>

                        <div className="stats-container mx-auto">
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>history</span>
                                </div>
                                <div className="stat-info">
                                    <h4>Mis Ingresos</h4>
                                    <p>{ingresos.length}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>devices</span>
                                </div>
                                <div className="stat-info">
                                    <h4>Equipos Registrados</h4>
                                    <p>{equipmentList.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'comprobantes':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1200px' }}>
                            <div className="section-header">
                                <h3 className="mb-0">Mis Comprobantes de Equipo</h3>
                                <p className="opacity-50 small">Registros de tus dispositivos ingresados al centro</p>
                            </div>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table table-dark admin-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Equipo</th>
                                            <th>Marca/Modelo</th>
                                            <th>Serial</th>
                                            <th>Fecha de Ingreso</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipmentList.length > 0 ? equipmentList.map(item => (
                                            <tr key={item.id_ingreso_equipo}>
                                                <td><span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{item.equipo_type}</span></td>
                                                <td>{item.equipo_brand} {item.equipo_model}</td>
                                                <td><code>{item.equipo_serial}</code></td>
                                                <td>{new Date(item.entry_datetime).toLocaleString()}</td>
                                                <td>
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2">Registrado</span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-4 opacity-50">No tienes equipos registrados.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'historial':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
                            <div className="section-header">
                                <h3 className="mb-0">Mi Historial de Accesos</h3>
                                <p className="opacity-50 small">Registros de tus ingresos al centro de formación</p>
                            </div>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table table-dark admin-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Ubicación / Punto</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ingresos.length > 0 ? ingresos.map(ingreso => (
                                            <tr key={ingreso.id_ingreso}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="material-symbols-outlined opacity-50" style={{ fontSize: '18px' }}>calendar_today</span>
                                                        {new Date(ingreso.ingreso_datetime).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2" style={{ fontSize: '0.75rem' }}>
                                                        {ingreso.ingreso_place}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2 text-success small fw-bold">
                                                        <span className="material-symbols-outlined small">verified_user</span>
                                                        INGRESADO
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="3" className="text-center py-4 opacity-50">No se encontraron registros de ingreso.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'profile':
                return (
                    <div className="fade-in-up container glass-box p-5 mx-auto" style={{ maxWidth: '600px' }}>
                        <div className="text-center mb-4">
                            <div className="rounded-circle bg-success mx-auto d-flex align-items-center justify-content-center mb-3 shadow overflow-hidden" style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold', color: '#000' }}>
                                {currentUser?.profile_photo_path ? (
                                    <img src={currentUser.profile_photo_path} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{currentUser?.user_name?.[0]}{currentUser?.user_lastname?.[0]}</>
                                )}
                            </div>
                            <h3 className="mb-1">{currentUser?.user_name} {currentUser?.user_lastname}</h3>
                            <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-3 py-1">
                                {currentUser?.role?.rol_name || 'Aprendiz'}
                            </span>
                        </div>

                        <div className="row text-start mt-4 g-4">
                            <div className="col-12">
                                <label className="form-label opacity-50 small mb-1">Identificación</label>
                                <div className="p-3 bg-dark bg-opacity-25 rounded border border-success border-opacity-10">
                                    {currentUser?.user_identification || 'No registrada'}
                                </div>
                            </div>
                            <div className="col-12">
                                <label className="form-label opacity-50 small mb-1">Correo Institucional</label>
                                <div className="p-3 bg-dark bg-opacity-25 rounded border border-success border-opacity-10">
                                    {currentUser?.user_email}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label opacity-50 small mb-1">Ficha</label>
                                <div className="p-3 bg-dark bg-opacity-25 rounded border border-success border-opacity-10">
                                    {currentUser?.user_coursenumber}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label opacity-50 small mb-1">Programa</label>
                                <div className="p-3 bg-dark bg-opacity-25 rounded border border-success border-opacity-10">
                                    {currentUser?.user_program}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3 border-top border-success border-opacity-10">
                            <button className="btn btn-outline-success w-100 py-3 d-flex align-items-center justify-content-center gap-2" onClick={() => setEditingProfile(true)}>
                                <span className="material-symbols-outlined">edit</span>
                                Editar Información de Mi Perfil
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const aprendizLinks = [ // Definicion de enlaces para el navbar
        { label: 'DASHBOARD', icon: 'dashboard', view: 'dashboard' },
        { label: 'HISTORIAL DE ACCESOS', icon: 'history', view: 'historial' },
        { label: 'COMPROBANTES', icon: 'description', view: 'comprobantes' }
    ];

    return ( // Estructura principal
        <div className="min-vh-100 d-flex flex-column fade-in-up" style={{ background: 'transparent' }}>
            <Navbar
                currentUser={currentUser}
                view={view}
                setView={(newView) => {
                    setView(newView);
                    setEditingProfile(false);
                }}
                links={aprendizLinks}
            />

            <main className="container-fluid px-4 px-md-5 py-2 flex-grow-1">
                {renderView()}
            </main>

            <Footer />
        </div>
    );
};

export default Aprendiz;
