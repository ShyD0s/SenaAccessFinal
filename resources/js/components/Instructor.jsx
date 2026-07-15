import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import Navbar from './Navbar';
import Novedades from './Novedades';

const Instructor = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTermIngresos, setSearchTermIngresos] = useState('');
    const [myEquipmentList, setMyEquipmentList] = useState([]);
    const [novedades, setNovedades] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [usersResponse, ingresosResponse, userMeResponse, myEquipmentResponse, novedadesResponse] = await Promise.all([
                    axios.get('/api/admin/users'),
                    axios.get('/api/my-ingresos'),
                    axios.get('/api/user'),
                    axios.get('/api/my-equipment'),
                    axios.get('/api/my-novedades')
                ]);
                setUsers(usersResponse.data);
                setIngresos(ingresosResponse.data);
                setCurrentUser(userMeResponse.data);
                setMyEquipmentList(myEquipmentResponse.data);
                setNovedades(novedadesResponse.data);
            } catch (error) {
                console.error('Error cargando datos: ', error);
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user_role');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredIngresos = ingresos.filter(ingreso => {
        const search = searchTermIngresos.toLowerCase();
        const userName = `${ingreso.user?.user_name} ${ingreso.user?.user_lastname}`.toLowerCase();
        return (
            userName.includes(search) ||
            ingreso.user?.user_email.toLowerCase().includes(search) ||
            ingreso.ingreso_place.toLowerCase().includes(search)
        );
    });


    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return (
                    <div className="fade-in-up">
                        <div className="text-center mb-5">
                            <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                                Panel de <span style={{ color: 'var(--primary-color)' }}>Instructor</span>
                            </h2>
                            <p className="opacity-75">Visualización y gestión de registros de acceso</p>
                        </div>
                        <div className="stats-container mx-auto">
                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('novedad_historial')}>
                                <div className="stat-icon"><span className="material-symbols-outlined">group</span></div>
                                <div className="stat-info"><h4>Mis Novedades</h4><p>{novedades.length}</p></div>
                            </div>
                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('historial')}>
                                <div className="stat-icon"><span className="material-symbols-outlined">login</span></div>
                                <div className="stat-info"><h4>Mis Ingresos</h4><p>{ingresos.length}</p></div>
                            </div>
                        </div>
                    </div>
                );
            case 'historial':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                <h3 className="mb-0">Mi Historial de Accesos</h3>
                                <div className="input-group search-input-group" style={{ maxWidth: '350px' }}>
                                    <span className="input-group-text"><span className="material-symbols-outlined">search</span></span>
                                    <input type="text" className="form-control" placeholder="Buscar..." value={searchTermIngresos} onChange={(e) => setSearchTermIngresos(e.target.value)} />
                                </div>
                            </div>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table admin-table mb-0">
                                    <thead><tr><th>Usuario</th><th>Fecha y Hora</th><th>Ubicación</th></tr></thead>
                                    <tbody>
                                        {filteredIngresos.map(ingreso => (
                                            <tr key={ingreso.id_ingreso}>
                                                <td>{ingreso.user?.user_name} {ingreso.user?.user_lastname}</td>
                                                <td>{new Date(ingreso.ingreso_datetime).toLocaleString()}</td>
                                                <td><span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">{ingreso.ingreso_place}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'novedad_form':
                return <Novedades currentUser={currentUser} initialMode="form" />;
            case 'novedad_historial':
                return <Novedades currentUser={currentUser} initialMode="history" />;
            case 'mis_equipos':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
                            <h3 className="mb-4">Mis Comprobantes de Equipo</h3>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table admin-table mb-0">
                                    <thead><tr><th>Equipo</th><th>Marca/Modelo</th><th>Serial</th><th>Observaciones</th><th>Fecha</th></tr></thead>
                                    <tbody>
                                        {myEquipmentList.length > 0 ? myEquipmentList.map(item => (
                                            <tr key={item.id_ingreso_equipo}>
                                                <td><span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{item.equipo_type}</span></td>
                                                <td>{item.equipo_brand} {item.equipo_model}</td>
                                                <td><code>{item.equipo_serial}</code></td>
                                                <td className="small opacity-75">{item.equipo_observations || 'Sin observaciones'}</td>
                                                <td>{new Date(item.entry_datetime).toLocaleString()}</td>
                                            </tr>
                                        )) : <tr><td colSpan="5" className="text-center py-4 opacity-50">No tienes equipos registrados.</td></tr>}
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
                            <div className="rounded-circle bg-success mx-auto d-flex align-items-center justify-content-center mb-3 shadow overflow-hidden" style={{ width: '100px', height: '100px', fontSize: '2.5rem', fontWeight: 'bold' }}>
                                {currentUser?.profile_photo_path ? (
                                    <img src={currentUser.profile_photo_path} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{currentUser?.user_name[0]}{currentUser?.user_lastname[0]}</>
                                )}
                            </div>
                            <h3 className="mb-1">{currentUser?.user_name} {currentUser?.user_lastname}</h3>
                            <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-3 py-1">
                                {currentUser?.role?.rol_name || 'Usuario'}
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
                    </div>
                );
            default: return null;
        }
    };

    const instructorLinks = [
        { label: 'DASHBOARD', icon: 'dashboard', view: 'dashboard' },
        {
            label: 'NOVEDADES',
            icon: 'report_problem',
            view: 'novedad_historial',
            dropdown: true,
            items: [
                { label: 'Nueva Novedad', icon: 'add_circle', view: 'novedad_form' },
                { label: 'Historial Novedades', icon: 'history', view: 'novedad_historial' }
            ]
        },
        { label: 'HISTORIAL', icon: 'history', view: 'historial' },
        { label: 'MIS EQUIPOS', icon: 'inventory_2', view: 'mis_equipos' }
    ];

    if (loading) return <div className="text-white text-center mt-5">Cargando...</div>;

    return (
        <div className="min-vh-100 d-flex flex-column fade-in-up">
            <Navbar currentUser={currentUser} view={view} setView={setView} links={instructorLinks} />
            <main className="container-fluid px-4 px-md-5 py-4 flex-grow-1">{renderView()}</main>
            <Footer />
        </div>
    );
};

export default Instructor;
