import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ currentUser, view, setView, userFilter, setUserFilter, links = [] }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
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

    return (
        <nav className="navbar navbar-expand-lg px-4 py-2 navbar-custom">
            <div className="container-fluid p-0">
                {/* Logo y Marca */}
                <div className="d-flex align-items-center gap-3 me-4">
                    <img src="/Icons/logoSena.png" alt="SENA" style={{ height: '40px' }} />
                    <div className="d-none d-sm-block">
                        <h5 className="mb-0 fw-bold " style={{ letterSpacing: '1px' }}>SENA <span className="text-success neon-text">ACCESS</span></h5>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-20" style={{ fontSize: '0.6rem' }}>
                            {currentUser?.role?.rol_name?.toUpperCase() || 'USER'} PANEL
                        </span>
                    </div>
                </div>

                {/* Botón colapsable para móviles */}
                <button className="navbar-toggler border-success border-opacity-25" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                    <span className="material-symbols-outlined text-success">menu</span>
                </button>

                <div className="collapse navbar-collapse" id="navbarMain">
                    {/* Enlaces de Navegación Dinámicos */}
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-2">
                        {links.map((link, index) => {
                            if (link.dropdown) {
                                return (
                                    <li key={index} className="nav-item dropdown">
                                        <button className={`nav-item-link dropdown-toggle ${view === link.view ? 'active' : ''}`} data-bs-toggle="dropdown">
                                            <span className="material-symbols-outlined small me-1">{link.icon}</span> {link.label}
                                        </button>
                                        <ul className="dropdown-menu glass-box border-success border-opacity-25 mt-2 shadow-lg">
                                            {link.items.map((item, idx) => (
                                                <li key={idx}>
                                                    {item.divider ? (
                                                        <hr className="dropdown-divider border-success border-opacity-10" />
                                                    ) : (
                                                        <button
                                                            className="dropdown-item py-2 d-flex align-items-center gap-2"
                                                            onClick={() => {
                                                                if (item.onClick) item.onClick();
                                                                if (item.view) setView(item.view);
                                                                if (item.filter) setUserFilter(item.filter);
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined small">{item.icon}</span> {item.label}
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                );
                            }
                            return (
                                <li key={index} className="nav-item">
                                    <button
                                        className={`nav-item-link ${view === link.view ? 'active' : ''}`}
                                        onClick={() => setView(link.view)}
                                    >
                                        <span className="material-symbols-outlined small me-1">{link.icon}</span> {link.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Perfil y Acciones (Derecha) */}
                    <div className="d-flex align-items-center gap-3 ms-auto pt-2 pt-lg-0 border-top border-lg-0 border-success border-opacity-10">
                        <div
                            className="profile-nav-trigger d-flex align-items-center gap-2 cursor-pointer p-1 px-2 rounded-pill hover-bg"
                            onClick={() => setView('profile')}
                            style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        >
                            <div className="text-end d-none d-md-block">
                                <p className="mb-0 fw-bold small text-truncate" style={{ maxWidth: '150px' }}>{currentUser?.user_name}</p>
                                <p className="mb-0 opacity-50" style={{ fontSize: '0.65rem' }}>{currentUser?.role?.rol_name}</p>
                            </div>
                            <div className="rounded-circle bg-success d-flex align-items-center justify-content-center shadow-sm border border-2 border-success border-opacity-25 overflow-hidden" style={{ width: '38px', height: '38px', fontSize: '0.9rem', fontWeight: 'bold', color: '#000' }}>
                                {currentUser?.profile_photo_path ? (
                                    <img src={currentUser.profile_photo_path} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>{currentUser?.user_name?.[0]}{currentUser?.user_lastname?.[0]}</>
                                )}
                            </div>
                        </div>

                        <div className="vr d-none d-lg-block opacity-25" style={{ height: '30px' }}></div>

                        <button className="btn-logout-minimal" onClick={handleLogout} title="Cerrar Sesión">
                            <span className="material-symbols-outlined">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
