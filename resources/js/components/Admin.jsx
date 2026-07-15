import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from './Footer';
import Navbar from './Navbar';
import FingerprintSimulation from './FingerprintSimulation';
import Novedades from './Novedades';
import { showAlert, showConfirm } from './CustomAlert';

const Admin = () => {
    // HOOK: useNavigate se emplea para redirigir al Login si el usuario no tiene una sesión activa o el token expira.
    const navigate = useNavigate();
    const carouselRef = useRef(null);
    // HOOK: useState se utiliza de forma intensiva para mantener el estado de la aplicación: usuario logueado, la vista renderizada en el panel, listas de datos desde la API y estados de carga.
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'historial', 'users', 'profile'
    const [userFilter, setUserFilter] = useState('all'); // 'all', 'Instructor', 'Aprendiz'
    const [users, setUsers] = useState([]); // Lista de usuarios
    const [roles, setRoles] = useState([]); // Lista de roles
    const [ingresos, setIngresos] = useState([]); // Lista de ingresos
    const [loading, setLoading] = useState(true); // Estado de carga
    const [editingUser, setEditingUser] = useState(null); // Usuario que se está editando
    const [searchTermUsers, setSearchTermUsers] = useState(''); // Busqueda de usuarios
    const [searchTermIngresos, setSearchTermIngresos] = useState('');   // Busqueda de ingresos
    const [searchTermEquipment, setSearchTermEquipment] = useState(''); // Busqueda de equipos
    const [userSearchVoucher, setUserSearchVoucher] = useState(''); // Busqueda de usuarios por cedula
    const [selectedFile, setSelectedFile] = useState(null); // Archivo seleccionado
    const [equipmentData, setEquipmentData] = useState({ // Datos del equipo a crear
        fk_id_usuario: '',
        equipo_type: 'Portátil',
        equipo_brand: '',
        equipo_model: '',
        equipo_color: '',
        equipo_serial: '',
        equipo_observations: ''
    }); // HOOK: useState se utiliza de forma intensiva para mantener el estado de la aplicación: usuario logueado, la vista renderizada en el panel, listas de datos desde la API y estados de carga.
    const [equipmentList, setEquipmentList] = useState([]);
    const [formData, setFormData] = useState({
        user_identification: '',
        user_name: '',
        user_lastname: '',
        user_email: '',
        user_password: '',
        user_coursenumber: '',
        user_program: '',
        fk_id_rol: ''
    });
    const [fingerprintCaptured, setFingerprintCaptured] = useState(false);

    const fetchEquipment = async () => {
        try {
            const response = await axios.get('/api/admin/equipment');
            setEquipmentList(response.data);
        } catch (error) {
            console.error("Error al refrescar lista:", error);
        }
    }

    // HOOK: useEffect se ejecuta al montarse el componente. Es fundamental para simular la carga de datos inicial realizando peticiones a la API para obtener roles, usuarios, ingresos y validar la sesión.
    useEffect(() => {

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const [usersResponse, rolesResponse, ingresosResponse, userMeResponse, equipmentResponse] = await Promise.all([
                    axios.get('/api/admin/users'),
                    axios.get('/api/admin/roles'),
                    axios.get('/api/admin/ingresos'),
                    axios.get('/api/user'),
                    axios.get('/api/admin/equipment')
                ]);
                setUsers(usersResponse.data);
                setRoles(rolesResponse.data);
                setIngresos(ingresosResponse.data);
                setCurrentUser(userMeResponse.data);
                setEquipmentList(equipmentResponse.data);
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
        fetchEquipment();
    }, []);

    // Filtro de usuarios por nombre, apellido, email, numero de ficha y rol
    const filteredUsers = users.filter(user => {
        const search = searchTermUsers.toLowerCase();
        const matchesSearch = (
            (user.user_identification?.toLowerCase() || '').includes(search) ||
            user.user_name.toLowerCase().includes(search) ||
            user.user_lastname.toLowerCase().includes(search) ||
            user.user_email.toLowerCase().includes(search) ||
            user.user_coursenumber.toString().includes(search) ||
            user.role?.rol_name.toLowerCase().includes(search)
        );

        if (userFilter === 'all') return matchesSearch;
        return matchesSearch && user.role?.rol_name === userFilter;
    });

    // Filtro de ingresos por nombre, apellido, email, lugar y fecha
    const filteredIngresos = ingresos.filter(ingreso => {
        const search = searchTermIngresos.toLowerCase();
        const userName = `${ingreso.user?.user_name} ${ingreso.user?.user_lastname}`.toLowerCase();
        return (
            userName.includes(search) ||
            ingreso.user?.user_email.toLowerCase().includes(search) ||
            ingreso.ingreso_place.toLowerCase().includes(search) ||
            new Date(ingreso.ingreso_datetime).toLocaleString().toLowerCase().includes(search)
        );
    });

    // Filtro de equipos por nombre, apellido, email, tipo de equipo, marca, modelo, color y serial
    const filteredEquipment = equipmentList.filter(item => {
        const search = searchTermEquipment.toLowerCase();
        const userName = `${item.user?.user_name} ${item.user?.user_lastname}`.toLowerCase();
        return (
            userName.includes(search) ||
            item.equipo_type.toLowerCase().includes(search) ||
            item.equipo_brand.toLowerCase().includes(search) ||
            item.equipo_serial.toLowerCase().includes(search) ||
            item.user?.user_identification?.toLowerCase().includes(search)
        );
    });
    // Busqueda de usuarios por cedula
    const searchableUsers = users.filter(user => {
        const search = userSearchVoucher.toLowerCase();
        return (
            user.user_name.toLowerCase().includes(search) ||
            user.user_lastname.toLowerCase().includes(search) ||
            user.user_identification?.toLowerCase().includes(search)
        );
    });

    const handleLogout = async () => {
        // Logica para el log-out asincronica 
        try {
            await axios.post('/api/logout');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión', error);
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            navigate('/');
        }
    };
    // Funcion para desplazar el carrusel
    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 300;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };
    // Funcion para editar un usuario
    const handleEditClick = (user) => {
        setEditingUser(user.id_usuario);
        setFormData({
            user_identification: user.user_identification || '',
            user_name: user.user_name || '',
            user_lastname: user.user_lastname || '',
            user_email: user.user_email || '',
            user_password: '',
            user_coursenumber: user.user_coursenumber || '',
            user_program: user.user_program || '',
            fk_id_rol: user.fk_id_rol || '',
            profile_photo_path: user.profile_photo_path || null
        });
    };
    // Funcion para cancelar la edicion de un usuario
    const handleCancelEdit = () => {
        setEditingUser(null);
        setSelectedFile(null);
        setFingerprintCaptured(false);
        setFormData({
            user_identification: '',
            user_name: '',
            user_lastname: '',
            user_email: '',
            user_password: '',
            user_coursenumber: '',
            user_program: '',
            fk_id_rol: ''
        });
    };
    // Funcion para cambiar un dato del formulario
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    // Funcion para cambiar un dato del formulario
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };
    // Funcion para actualizar un usuario
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (selectedFile) {
                data.append('image', selectedFile);
            }
            // Workaround para PUT con FormData en Laravel
            data.append('_method', 'PUT');

            const response = await axios.post(`/api/admin/users/${editingUser}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }); // El metodo axios.post se usa para enviar los datos del formulario al backend.

            setUsers(users.map(u => u.id_usuario === editingUser ? response.data : u));

            // Si el usuario editado es el actual, actualizarlo también
            if (currentUser && currentUser.id_usuario === editingUser) {
                setCurrentUser(response.data);
            }

            showAlert('Usuario actualizado con éxito');
            handleCancelEdit();
        } catch (error) {
            showAlert('Error al actualizar usuario: ' + (error.response?.data?.message || 'Error desconocido'), 'error');
        }
    };
    // Funcion para cambiar un dato del formulario de equipos
    const handleEquipmentChange = (e) => {
        setEquipmentData({
            ...equipmentData,
            [e.target.name]: e.target.value
        });
    };
    // Funcion para enviar el formulario de equipos
    const handleEquipmentSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/admin/equipment', equipmentData);
            setEquipmentList([response.data.data, ...equipmentList]);
            showAlert('Comprobante creado con éxito');
            setEquipmentData({
                fk_id_usuario: '',
                equipo_type: 'Portátil',
                equipo_brand: '',
                equipo_model: '',
                equipo_color: '',
                equipo_serial: '',
                equipo_observations: ''
            });
            setView('historial_equipos');
        } catch (error) {
            showAlert('Error al crear comprobante: ' + (error.response?.data?.message || 'Error desconocido'), 'error');
        }
    };

    // Funcion para eliminar un equipo
    const handleEquipmentDelete = async (id) => {
        const confirmed = await showConfirm('¿Estás seguro de eliminar este equipo?');
        if (confirmed) {
            try {
                await axios.delete(`/api/admin/equipment/${id}`);
                showAlert('Equipo eliminado con exito');
                await fetchEquipment();
            } catch (error) {
                console.log("error al eliminar", error)
                showAlert('Error al eliminar el equipo', 'error');
            }
        }
    };
    // Funcion para eliminar un usuario
    const handleDelete = async (id) => {
        const confirmed = await showConfirm('¿Estás seguro de eliminar este usuario?');
        if (confirmed) {
            try {
                await axios.delete(`/api/admin/users/${id}`);
                setUsers(users.filter(u => u.id_usuario !== id));
                showAlert('Usuario eliminado');
            } catch (error) {
                showAlert('Error al eliminar usuario', 'error');
            }
        }
    };

    if (loading) return <div className="text-white text-center mt-5">Cargando...</div>;

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return (
                    <div className="fade-in-up">
                        <div className="text-center mb-5">
                            <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                                Panel de <span style={{ color: 'var(--primary-color)' }}>Control</span>
                            </h2>
                            <p className="opacity-75">Gestión integral de usuarios y registros de acceso</p>
                        </div>

                        <div className="stats-container mx-auto">
                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('users')}>
                                <div className="stat-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>group</span>
                                </div>
                                <div className="stat-info">
                                    <h4>Usuarios</h4>
                                    <p>{users.length}</p>
                                </div>
                            </div>
                            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setView('historial')}>
                                <div className="stat-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>login</span>
                                </div>
                                <div className="stat-info">
                                    <h4>Ingresos Hoy</h4>
                                    <p>{ingresos.filter(i => new Date(i.ingreso_datetime).toDateString() === new Date().toDateString()).length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="fade-in-up">
                        {editingUser && (
                            <div className="glass-box p-4 mb-5 mx-auto fade-in-up" style={{ maxWidth: '850px' }}>
                                <div className="section-header">
                                    <h3 className="mb-0">Editar Perfil de Usuario</h3>
                                </div>
                                <div className="admin-scrollable-container" style={{ maxHeight: '55vh' }}>
                                    <form onSubmit={handleUpdate}>
                                        <div className="row">
                                            <div className="col-12 mb-3 text-center">
                                                <div className="user-avatar-lg mx-auto mb-2 shadow overflow-hidden border border-success">
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
                                                <FingerprintSimulation onCaptureComplete={(val) => setFingerprintCaptured(val)} />
                                            </div>

                                            <div className="col-md-4 mb-3">

                                                <label className="form-label opacity-75 small">N° Documento</label>
                                                <input type="text" name="user_identification" className="form-control" value={formData.user_identification} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label opacity-75 small">Nombre</label>
                                                <input type="text" name="user_name" className="form-control" value={formData.user_name} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label opacity-75 small">Apellido</label>
                                                <input type="text" name="user_lastname" className="form-control" value={formData.user_lastname} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label opacity-75 small">Email Institucional</label>
                                                <input type="email" name="user_email" className="form-control" value={formData.user_email} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label opacity-75 small">Seguridad (Opcional)</label>
                                                <input type="password" name="user_password" placeholder="Nueva contraseña..." className="form-control" value={formData.user_password} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label opacity-75 small">Ficha</label>
                                                <input type="number" name="user_coursenumber" className="form-control" value={formData.user_coursenumber} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label opacity-75 small">Programa</label>
                                                <input type="text" name="user_program" className="form-control" value={formData.user_program} onChange={handleChange} required />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label className="form-label opacity-75 small">Rol Asignado</label>
                                                <select name="fk_id_rol" className="form-select" value={formData.fk_id_rol} onChange={handleChange} required>
                                                    <option value="">Seleccione un rol</option>
                                                    {roles.map(role => (
                                                        <option key={role.id_rol} value={role.id_rol}>{role.rol_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2 mt-4">
                                            <button type="submit" className="btn btn-success action-btn flex-grow-1 py-2">
                                                <span className="material-symbols-outlined">save</span> Actualizar Datos
                                            </button>
                                            <button type="button" className="btn btn-outline-secondary action-btn px-4" onClick={handleCancelEdit}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {!editingUser && (
                            <div className="mx-auto" style={{ maxWidth: '1200px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3 px-4">
                                    <div className="section-header mb-0">
                                        <h3 className="mb-0">Gestión de {userFilter === 'all' ? 'Usuarios' : userFilter}</h3>
                                        <p className="small opacity-50 mb-0">Total: {filteredUsers.length} registros</p>
                                    </div>
                                    <div className="input-group search-input-group" style={{ maxWidth: '350px' }}>
                                        <span className="input-group-text">
                                            <span className="material-symbols-outlined">search</span>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Buscar..."
                                            value={searchTermUsers}
                                            onChange={(e) => setSearchTermUsers(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="carousel-wrapper position-relative">
                                    <button className="carousel-nav-btn left shadow-lg" onClick={() => scrollCarousel('left')} aria-label="Anterior">
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>

                                    <div className="carousel-blur-start"></div>
                                    <div className="user-carousel d-flex gap-4 pb-4 px-5" ref={carouselRef}>
                                        {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                            <div key={user.id_usuario} className="user-card-new glass-box">
                                                <div className="user-card-settings">
                                                    <div className="dropdown">
                                                        <button className="settings-btn" data-bs-toggle="dropdown">
                                                            <span className="material-symbols-outlined">settings</span>
                                                        </button>
                                                        <ul className="dropdown-menu glass-box border-success border-opacity-25 shadow-lg">
                                                            <li>
                                                                <button className="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => handleEditClick(user)}>
                                                                    <span className="material-symbols-outlined text-warning small">edit</span> Editar
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger" onClick={() => handleDelete(user.id_usuario)}>
                                                                    <span className="material-symbols-outlined small">delete</span> Eliminar
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>

                                                <div className="user-card-header text-center pt-4 mb-3">
                                                    <div className="user-avatar-lg mx-auto mb-3 shadow overflow-hidden">
                                                        {user.profile_photo_path ? (
                                                            <img src={user.profile_photo_path} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <>{user.user_name[0]}{user.user_lastname[0]}</>
                                                        )}
                                                    </div>
                                                    <h5 className="mb-1 text-truncate px-2">{user.user_name} {user.user_lastname}</h5>
                                                    <span className={`badge ${user.role?.rol_name === 'Admin' ? 'bg-danger' : 'bg-success'} bg-opacity-10 text-${user.role?.rol_name === 'Admin' ? 'danger' : 'success'} border border-${user.role?.rol_name === 'Admin' ? 'danger' : 'success'} border-opacity-25`} style={{ fontSize: '0.65rem' }}>
                                                        {user.role?.rol_name}
                                                    </span>
                                                </div>

                                                <div className="user-card-body px-3 pb-4">
                                                    <div className="user-info-item mb-2">
                                                        <span className="material-symbols-outlined">id_card</span>
                                                        <span className="text-truncate">{user.user_identification || 'S/N'}</span>
                                                    </div>
                                                    <div className="user-info-item mb-2">
                                                        <span className="material-symbols-outlined">mail</span>
                                                        <span className="text-truncate">{user.user_email}</span>
                                                    </div>
                                                    <div className="user-info-item">
                                                        <span className="material-symbols-outlined">groups</span>
                                                        <span className="text-truncate">Ficha: {user.user_coursenumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center w-100 py-5 opacity-50">
                                                <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>person_off</span>
                                                <p className="mt-2">No se encontraron usuarios</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="carousel-blur-end"></div>

                                    <button className="carousel-nav-btn right shadow-lg" onClick={() => scrollCarousel('right')} aria-label="Siguiente">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'historial':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1000px' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                <div className="section-header mb-0">
                                    <h3 className="mb-0">Historial de Accesos</h3>
                                </div>
                                <div className="input-group search-input-group" style={{ maxWidth: '350px' }}>
                                    <span className="input-group-text">
                                        <span className="material-symbols-outlined">search</span>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar en el historial..."
                                        value={searchTermIngresos}
                                        onChange={(e) => setSearchTermIngresos(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table admin-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Fecha y Hora</th>
                                            <th>Ubicación / Punto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredIngresos.map(ingreso => (
                                            <tr key={ingreso.id_ingreso}>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold">{ingreso.user?.user_name} {ingreso.user?.user_lastname}</span>
                                                        <span className="small opacity-50">{ingreso.user?.user_email}</span>
                                                    </div>
                                                </td>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'equipo_entry':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '850px' }}>
                            <div className="section-header">
                                <h3 className="mb-0">Nuevo Comprobante de Equipo</h3>
                                <p className="opacity-50 small">Registrar ingreso de un dispositivo al centro</p>
                            </div>
                            <div className="admin-scrollable-container" style={{ maxHeight: '55vh' }}>
                                <form onSubmit={handleEquipmentSubmit}>
                                    <div className="row">
                                        <div className="col-md-12 mb-3">
                                            <label className="form-label opacity-75 small">Buscar y Seleccionar Usuario</label>
                                            <div className="input-group mb-2">
                                                <span className="input-group-text">
                                                    <span className="material-symbols-outlined small">person_search</span>
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Nombre, apellido o identificación..."
                                                    value={userSearchVoucher}
                                                    onChange={(e) => setUserSearchVoucher(e.target.value)}
                                                />
                                            </div>
                                            <select name="fk_id_usuario" className="form-select" value={equipmentData.fk_id_usuario} onChange={handleEquipmentChange} required>
                                                <option value="">{searchableUsers.length === 0 ? 'No se encontraron usuarios' : 'Seleccione el dueño del equipo...'}</option>
                                                {searchableUsers.map(user => (
                                                    <option key={user.id_usuario} value={user.id_usuario}>
                                                        {user.user_name} {user.user_lastname} - {user.user_identification}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label opacity-75 small">Tipo de Equipo</label>
                                            <select name="equipo_type" className="form-select" value={equipmentData.equipo_type} onChange={handleEquipmentChange} required>
                                                <option value="Portátil">Portátil</option>
                                                <option value="Cámara">Cámara</option>
                                                <option value="Herramienta">Herramienta</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label opacity-75 small">Marca</label>
                                            <input type="text" name="equipo_brand" className="form-control" placeholder="Ej: Lenovo, HP..." value={equipmentData.equipo_brand} onChange={handleEquipmentChange} required />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label opacity-75 small">Modelo</label>
                                            <input type="text" name="equipo_model" className="form-control" placeholder="Ej: ThinkPad X1..." value={equipmentData.equipo_model} onChange={handleEquipmentChange} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label opacity-75 small">Color</label>
                                            <input type="text" name="equipo_color" className="form-control" placeholder="Ej: Gris Espacial..." value={equipmentData.equipo_color} onChange={handleEquipmentChange} required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label opacity-75 small">Número de Serie</label>
                                            <input type="text" name="equipo_serial" className="form-control" placeholder="S/N único..." value={equipmentData.equipo_serial} onChange={handleEquipmentChange} required />
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label className="form-label opacity-75 small">Observaciones / Estado</label>
                                            <textarea name="equipo_observations" className="form-control" rows="3" placeholder="Detalles adicionales del estado del equipo..." value={equipmentData.equipo_observations} onChange={handleEquipmentChange}></textarea>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <button type="submit" className="btn btn-success w-100 py-2 action-btn">
                                            <span className="material-symbols-outlined">description</span> Generar Comprobante
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                );
            case 'historial_equipos':
                return (
                    <div className="fade-in-up">
                        <div className="glass-box p-4 mb-5 mx-auto" style={{ maxWidth: '1200px' }}>
                            <div className="section-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                                <div>
                                    <h3 className="mb-0">Historial de Equipos</h3>
                                    <p className="opacity-50 small">Registros de ingreso de dispositivos</p>
                                </div>
                                <div className="input-group search-input-group" style={{ maxWidth: '350px' }}>
                                    <span className="input-group-text">
                                        <span className="material-symbols-outlined">search</span>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar por usuario, equipo o serial..."
                                        value={searchTermEquipment}
                                        onChange={(e) => setSearchTermEquipment(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="table-responsive admin-scrollable-container" style={{ maxHeight: '50vh' }}>
                                <table className="table admin-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Usuario</th>
                                            <th>Equipo</th>
                                            <th>Marca/Modelo</th>
                                            <th>Serial</th>
                                            <th>Observaciones</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEquipment.length > 0 ? filteredEquipment.map(item => (
                                            <tr key={item.id_ingreso_equipo}>
                                                <td>{item.user?.user_name} {item.user?.user_lastname}</td>
                                                <td><span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{item.equipo_type}</span></td>
                                                <td>{item.equipo_brand} {item.equipo_model}</td>
                                                <td><code>{item.equipo_serial}</code></td>
                                                <td className="small opacity-75">{item.equipo_observations || 'Sin observaciones'}</td>
                                                <td>{new Date(item.entry_datetime).toLocaleString()}</td>
                                                <td>
                                                    <button onClick={() => handleEquipmentDelete(item.id_ingreso_equipo)} className="btn btn-danger btn-sm"><span className="material-symbols-outlined">delete</span></button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-4 opacity-50">No se encontraron registros de equipos.</td>
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

                        <div className="mt-5 pt-3 border-top border-success border-opacity-10">
                            <button className="btn btn-outline-success w-100 py-3 d-flex align-items-center justify-content-center gap-2" onClick={() => {
                                handleEditClick(currentUser);
                                setView('users');
                            }}>
                                <span className="material-symbols-outlined">edit</span>
                                Editar Información de Perfil
                            </button>
                        </div>
                    </div>
                );
            case 'novedad_form':
                return <Novedades currentUser={currentUser} initialMode="form" />;
            case 'novedad_historial':
                return <Novedades currentUser={currentUser} initialMode="history" />;
            default:
                return null;
        }
    };

    const adminLinks = [
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
        {
            label: 'COMPROBANTES',
            icon: 'description',
            view: 'equipo_entry',
            dropdown: true,
            items: [
                { label: 'Nuevo Comprobante', icon: 'add_circle', view: 'equipo_entry' },
                { label: 'Historial Equipos', icon: 'inventory_2', view: 'historial_equipos' }
            ]
        },
        {
            label: 'GESTIÓN DE USUARIOS',
            icon: 'group',
            view: 'users',
            dropdown: true,
            items: [
                { label: 'Instructores', icon: 'school', filter: 'Instructor', view: 'users' },
                { label: 'Aprendices', icon: 'person', filter: 'Aprendiz', view: 'users' },
                { divider: true },
                { label: 'Ver Todos', icon: 'groups', filter: 'all', view: 'users' }
            ]
        }
    ];

    return (
        <div className="min-vh-100 d-flex flex-column fade-in-up" style={{ background: 'transparent' }}>
            <Navbar
                currentUser={currentUser}
                view={view}
                setView={setView}
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                links={adminLinks}
            />

            <main className="container-fluid px-4 px-md-5 py-2 flex-grow-1">
                {renderView()}
            </main>

            <Footer />
        </div>
    );
};

export default Admin;
