# MANUAL TÉCNICO Y DE ARQUITECTURA: SENAACCESS

**Sistema Integral de Control de Acceso Institucional, Registro de Equipos y Carnetización Digital**  
*Centro de Comercio y Servicios - SENA Regional Cauca*  
**Versión del Documento:** 2.0 (Producción)  
**Fecha de Publicación:** Octubre 2026  

---

## 1. VISIÓN GENERAL Y ARQUITECTURA DEL SISTEMA

### 1.1. Propósito y Alcance del Proyecto
**SenaAccess** es una plataforma institucional diseñada para modernizar, asegurar y automatizar el control de flujo peatonal, el registro de cómputo portátil/móvil y la gestión de novedades en los ambientes del SENA. Reemplaza las planillas manuales de papel mediante un ecosistema digital de alta velocidad basado en credenciales cifradas, carnets digitales con códigos QR de alta densidad y verificación biométrica.

El sistema garantiza trazabilidad en tiempo real, auditoría de ingresos, asistencia con Inteligencia Artificial conversacional y descentralización de la interfaz de usuario.

```
+---------------------------------------------------------------------------------------+
|                                  ARQUITECTURA GENERAL                                 |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   [ Cliente Navegador / Móvil ]                                                       |
|       - Single Page Application (React 19 + React Router 7 + Vite)                    |
|       - Módulos: Escaneo QR (html5-qrcode), Generador Carnet (qrcode + html2canvas)   |
|       - Chatbot Widget (Gemini AI Client)                                             |
|                                                                                       |
|                                     │  HTTPS (Bearer Token JWT / CORS)                |
|                                     ▼                                                 |
|   [ API Gateway & Backend Núcleo - Laravel 10 / PHP 8.2+ ]                            |
|       - Enrutador REST & Laravel Sanctum (Tokens de Acceso)                           |
|       - Controladores de Dominio: Auth, Users, Equipment, Novedades, Chatbot          |
|       - Middleware: auth:sanctum, admin, admin_or_instructor                          |
|                                                                                       |
|             │                                    │                        │           |
|             ▼                                    ▼                        ▼           |
|   [ Base de Datos MySQL 8 ]              [ Servicios Cloud ]      [ Microservicio ]   |
|     - usuarios, roles, ingresos,           - Cloudinary (Avatares)  - Python Flask    |
|       ingreso_equipos, novedades,          - Google Gemini API        (OpenCV + ORB   |
|       token_recovery                       - Resend (Emails)          Biometría)      |
|                                                                                       |
+---------------------------------------------------------------------------------------+
```

### 1.2. Principio Arquitectónico: Desacoplamiento API-First
El sistema implementa una arquitectura desacoplada estructurada en tres niveles:
1. **Frontend (SPA - Single Page Application):** Construido en React 19. La lógica de presentación, enrutamiento en el cliente y captura de hardware (webcam) se ejecutan completamente en el navegador. La interfaz no realiza recargas completas de página (`full page reload`), optimizando el ancho de banda y la experiencia de usuario.
2. **Backend Núcleo (API Gateway - Laravel 10):** Funciona como API REST stateless. Procesa reglas de negocio, valida autorizaciones basadas en roles (RBAC), ejecuta transacciones contra la base de datos relacional y orquesta la comunicación con microservicios y APIs de terceros.
3. **Microservicio Biométrico Aislado (Python / Flask):** Módulo especializado dedicado al cómputo matricial de huellas dactilares. Al delegar el procesamiento de imágenes a un entorno nativo en Python (OpenCV y NumPy), se liberan los procesos de PHP, garantizando tiempos de respuesta subsegundo y aislamiento de fallos.

### 1.3. Roles y Matriz de Control de Acceso (RBAC)
El sistema clasifica los accesos institucionales en cinco roles jerárquicos:
* **Administrador (`admin`):** Control total de la plataforma. Registra, edita y da de baja a usuarios; administra los comprobantes de ingreso de equipos; supervisa todos los ingresos globales del centro y resuelve novedades.
* **Instructor (`instructor`):** Supervisa el flujo de aprendices, consulta el historial general de ingresos, reporta novedades de ambientes y consulta el estado de sus propios equipos.
* **Aprendiz (`aprendiz`):** Genera y descarga su Carnet Digital interactivo con código QR, consulta su historial personal de ingresos a la sede y administra su perfil personal con foto alojada en la nube.
* **Funcionario (`funcionario`):** Registro de ingreso institucional y vinculación de equipos de cómputo corporativos asignados.
* **Invitado (`invitado`):** Registro rápido de visitantes ocasionales mediante documento de identidad, permitiendo auditoría temporal sin credenciales permanentes.

### 1.4. Equipo de Desarrollo
* **Líderes de Back-end & API:** Camilo Montegranario, Laura Medina, Kaherin
* **Líderes de Front-end & UX:** Andrés Arcos, Andrés Volverás

---

## 2. REQUISITOS DEL SISTEMA E INFRAESTRUCTURA

### 2.1. Requisitos de Software del Servidor Backend
* **PHP:** Versión `8.2.0` o superior (compatible con PHP 8.3).
  * *Extensiones requeridas obligatorias:* `pdo_mysql`, `openssl`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `curl`, `fileinfo`, `gd`, `bcmath`.
* **Gestor de Paquetes PHP:** Composer `2.5.0` o superior.
* **Motor de Base de Datos:** MySQL Server `8.0+` o MariaDB `10.4+` con motor de almacenamiento `InnoDB` y codificación `utf8mb4`.
* **Servidor Web:** Nginx `1.22+`, Apache `2.4+` (con módulo `mod_rewrite` activo) o proceso de desarrollo `php artisan serve`.

### 2.2. Requisitos de Software del Frontend
* **Node.js:** Versión `18.18.0 LTS` o `20.x LTS` (probado y optimizado en Node 20.x).
* **Gestor de Paquetes Node:** npm `9.x+` o yarn `1.22+`.
* **Build Engine:** Vite `6.0+`.

### 2.3. Requisitos del Microservicio Biométrico (Python)
* **Python:** Versión `3.9` a `3.12`.
* **Librerías principales:**
  * `flask >= 3.0.0`
  * `opencv-python-headless >= 4.9.0`
  * `numpy >= 1.26.0`
  * `gunicorn >= 21.2.0` (para despliegue en contenedores Linux)

### 2.4. Requisitos de Hardware Recomendados
| Componente | Entorno de Desarrollo (Local) | Entorno de Producción (Cloud / VPS) |
| :--- | :--- | :--- |
| **CPU** | 2 núcleos (x86_64) | 2 vCPUs dedicados |
| **Memoria RAM** | 4 GB | 2 GB a 4 GB RAM (Swap recomendado de 2GB) |
| **Almacenamiento** | 5 GB disponibles | 20 GB SSD NVMe |
| **Periféricos Cliente** | Cámara Web USB o integrada | Cualquier dispositivo con cámara frontal/trasera |

---

## 3. ESTRUCTURA DE DIRECTORIOS DEL CÓDIGO FUENTE

A continuación se detalla la organización de los módulos del proyecto:

```
SenaAccessFinal/
├── app/                                    # Núcleo de la aplicación Laravel
│   ├── Http/
│   │   ├── Controllers/                    # Controladores REST API
│   │   │   ├── AuthController.php          # Login, registro, invitados, recuperación de clave
│   │   │   ├── ChatbotController.php       # Orquestación de IA con Gemini API
│   │   │   ├── EquipmentController.php     # Gestión y comprobantes de ingreso de equipos
│   │   │   ├── NovedadController.php       # CRUD y filtros de novedades en ambientes
│   │   │   └── UserController.php          # Gestión de usuarios, perfiles y Cloudinary upload
│   │   └── Middleware/                     # Filtros de seguridad HTTP (Admin, Instructor, Sanctum)
│   ├── Mail/                               # Clases Mailable para envío de correos
│   │   └── RecoveryCodeMail.php            # Plantilla y despacho de código de restablecimiento
│   └── Models/                             # Modelos Eloquent ORM
│       ├── User.php                        # Modelo de la tabla `usuarios`
│       ├── Role.php                        # Modelo de la tabla `roles`
│       ├── Ingreso.php                     # Registro histórico de accesos
│       ├── IngresoEquipo.php               # Comprobantes de portátiles y cómputo
│       └── Novedad.php                     # Novedades reportadas por ambiente
├── config/                                 # Archivos de configuración del framework
│   ├── services.php                        # Credenciales de APIs externas (Gemini, AWS, Mail)
│   ├── auth.php                            # Drivers de autenticación y guards
│   ├── database.php                        # Conexiones a bases de datos relacionales
│   └── sanctum.php                         # Configuración de tiempo de vida y dominios de tokens
├── database/                               # Estructura y evolución de datos
│   ├── migrations/                         # Migraciones de esquema DDL
│   └── seeders/
│       └── DatabaseSeeder.php              # Creación de roles base y usuarios de prueba
├── documentacion/                          # Documentación técnica, manuales y modelos
│   ├── Manual_Tecnico_SenaAccess.md        # Manual técnico completo (este documento)
│   ├── Documentacion_borrador.txt          # Borrador original
│   ├── Modelo_relacional.png               # Diagrama E-R de la base de datos
│   └── env-ejemplo.txt                     # Plantilla de variables de entorno
├── public/                                 # Raíz pública del servidor web
│   ├── index.php                           # Punto de entrada HTTP de Laravel
│   └── Icons/                              # Recursos gráficos estáticos (logoSena.png, etc.)
├── resources/
│   ├── css/
│   │   └── app.css                         # Estilos personalizados, variables neon y glassmorphism
│   ├── js/                                 # Aplicación SPA en React
│   │   ├── app.jsx                         # Enrutador principal de React Router 7
│   │   ├── bootstrap.js                    # Inicialización de Axios e interceptores Bearer
│   │   └── components/                     # Componentes modulares de interfaz
│   │       ├── Admin.jsx                   # Panel de control del Administrador
│   │       ├── Aprendiz.jsx                # Panel de consulta del Aprendiz
│   │       ├── Instructor.jsx              # Panel de consulta del Instructor
│   │       ├── ChatbotWidget.jsx           # Ventana interactiva flotante de IA con Gemini
│   │       ├── UserQrCarnet.jsx            # Generador e impresor digital de carnet con QR
│   │       ├── QrScannerModal.jsx          # Lector de cámara web para códigos QR (html5-qrcode)
│   │       ├── Fingerprint.jsx             # Interfaz visual de escaneo biométrico
│   │       ├── FingerprintSimulation.jsx   # Módulo interactivo de enrolamiento dactilar
│   │       ├── Login.jsx                   # Pantalla de acceso de credenciales e invitados
│   │       ├── Register.jsx                # Formulario de autoregistro de aprendices
│   │       ├── PasswordRecovery.jsx        # Solicitud de código de recuperación
│   │       ├── ResetPassword.jsx           # Validación de token y cambio de contraseña
│   │       └── Novedades.jsx               # Tablero de novedades y alertas
│   └── views/
│       ├── emails/
│       │   └── recovery_code.blade.php     # Plantilla HTML del correo de recuperación
│       └── welcome.blade.php               # HTML maestro que monta la SPA de React
├── routes/
│   ├── api.php                             # Definición de rutas protegidas y públicas de la API
│   └── web.php                             # Ruta comodín (fallback) hacia la vista SPA
├── composer.json                           # Dependencias PHP (Laravel, Sanctum, Cloudinary, Resend)
├── package.json                            # Dependencias JS (React, Axios, Vite, Html5-qrcode)
└── vite.config.js                          # Configuración de compilación de Vite y plugin de React
```

---

## 4. COMANDOS DE DESPLIEGUE Y PUESTA EN MARCHA

### 4.1. Despliegue en Entorno de Desarrollo Local (Windows / Linux / macOS)

#### Paso 1: Clonar el Repositorio y Acceder
```bash
git clone https://github.com/ShyD0s/SenaAccessFinal.git
cd SenaAccessFinal
```

#### Paso 2: Instalación de Dependencias
```bash
# 1. Dependencias de PHP
composer install

# 2. Dependencias de Node.js
npm install
```

#### Paso 3: Configurar el Archivo de Entorno `.env`
Copie el archivo de ejemplo y genere la llave de cifrado de la aplicación:
```bash
# En Windows PowerShell o CMD:
copy documentacion\env-ejemplo.txt .env

# En Linux / macOS / Git Bash:
cp documentacion/env-ejemplo.txt .env

# Generar clave de aplicación:
php artisan key:generate
```

Edite el archivo `.env` configurando los accesos a la base de datos local (por ejemplo en XAMPP):
```ini
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=senaaccess
DB_USERNAME=root
DB_PASSWORD=
```

#### Paso 4: Creación de Base de Datos y Ejecución de Migraciones
Asegúrese de que el servicio MySQL esté corriendo (vía XAMPP Control Panel o servicio del sistema). Si la base de datos `senaaccess` no existe, créela desde phpMyAdmin o desde consola:
```sql
CREATE DATABASE senaaccess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Ejecute las migraciones junto con los datos semilla (`seeders`):
```bash
php artisan migrate:fresh --seed
```

> **Credenciales iniciales generadas por el Seeder:**
> * **Superadmin:** Correo `supadmin@sena.edu.co` | Contraseña: `senaaccess`
> * **Administrador:** Correo `admin@sena.edu.co` | Contraseña: `senaaccess`
> * **Instructor:** Correo `instructor@sena.edu.co` | Contraseña: `senaaccess`
> * **Aprendiz:** Correo `maria@sena.edu.co` | Contraseña: `senaaccess`
> * **Funcionario:** Correo `funcionario@sena.edu.co` | Contraseña: `senaaccess`

#### Paso 5: Enlazar el Almacenamiento Local (Opcional)
```bash
php artisan storage:link
```

#### Paso 6: Lanzamiento de Servidores de Desarrollo
Abra dos terminales independientes en la raíz del proyecto:
```bash
# Terminal 1: Servidor HTTP de Laravel
php artisan serve --port=8000

# Terminal 2: Servidor Vite para HMR del Frontend
npm run dev
```
Acceda desde el navegador a: `http://localhost:8000` (o a la URL indicada por `php artisan serve`).

---

### 4.2. Despliegue en Entorno de Producción (Cloud / VPS / Railway)

Para poner la aplicación en producción en un servidor dedicado o plataforma PaaS:

```bash
# 1. Instalar dependencias PHP sin paquetes de desarrollo
composer install --no-dev --optimize-autoloader

# 2. Compilar los activos de React con Vite para producción
npm run build

# 3. Limpiar y cachear configuraciones, rutas y vistas
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Ejecutar migraciones en base de datos de producción de forma desatendida
php artisan migrate --force

# 5. Asegurar permisos en carpetas de almacenamiento (en servidores Linux)
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## 5. ESPECIFICACIÓN DE ENDPOINTS PRINCIPALES (REST API)

Todas las respuestas retornan cabeceras `Content-Type: application/json`. Las rutas autenticadas exigen el encabezado:
```http
Authorization: Bearer <access_token>
```

### 5.1. Módulo de Autenticación y Control de Sesión

#### `POST /api/register`
Registra un nuevo usuario tipo Aprendiz o Funcionario en la plataforma.
* **Acceso:** Público.
* **Payload JSON:**
  ```json
  {
    "user_identification": "1061789456",
    "user_name": "Juan",
    "user_lastname": "Pérez",
    "user_email": "juan.perez@sena.edu.co",
    "user_password": "Password123*",
    "user_password_confirmation": "Password123*",
    "user_coursenumber": 2670142,
    "user_program": "ADSO",
    "role": "aprendiz"
  }
  ```
* **Respuestas:**
  * `201 Created`: Usuario creado exitosamente con el objeto `user`.
  * `422 Unprocessable Content`: Fallo de validación (correo o documento duplicado, contraseñas no coincidentes).

#### `POST /api/login`
Autentica a un usuario existente, registra automáticamente un evento de ingreso en la tabla `ingresos` con la hora local de Bogotá y emite un token de Sanctum.
* **Acceso:** Público.
* **Payload JSON:**
  ```json
  {
    "user_email": "admin@sena.edu.co",
    "user_password": "senaaccess"
  }
  ```
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "message": "Login exitoso",
    "user": {
      "id_usuario": 1,
      "user_identification": "1000000001",
      "user_name": "admin",
      "user_lastname": "System",
      "user_email": "admin@sena.edu.co",
      "fk_id_rol": 1
    },
    "role": "admin",
    "access_token": "1|qW84F9B...",
    "token_type": "Bearer"
  }
  ```
* **Errores:** `401 Unauthorized` si las credenciales son incorrectas.

#### `POST /api/register-guest`
Registra el ingreso de un visitante externo temporal (crea el usuario volátil si no existe y añade el registro en `ingresos`).
* **Acceso:** Público.
* **Payload JSON:**
  ```json
  {
    "user_identification": "987654321",
    "user_name": "Visitante Ocasional"
  }
  ```
* **Respuesta Exitosa (`201 Created`):**
  ```json
  {
    "message": "Ingreso de invitado registrado correctamente",
    "user": { ... }
  }
  ```

#### `POST /api/forgot-password`
Genera un token de recuperación alfanumérico de 8 caracteres con validez de 15 minutos en `token_recovery` y despacha el correo transaccional vía Resend.
* **Acceso:** Público.
* **Payload JSON:** `{"email": "usuario@sena.edu.co"}`
* **Respuesta (`200 OK`):** `{"message": "Se ha enviado el código a tu correo."}`

#### `POST /api/reset-password`
Valida el código de 8 dígitos y actualiza el hash de la contraseña en la base de datos.
* **Acceso:** Público.
* **Payload JSON:**
  ```json
  {
    "code": "A9B8C7D6",
    "password": "NuevaPassword123*",
    "password_confirmation": "NuevaPassword123*"
  }
  ```
* **Respuestas:** `200 OK` si es válido, `400 Bad Request` si el token expiró o ya fue utilizado.

#### `POST /api/logout`
Revoca y destruye el token de acceso actual en la base de datos de Sanctum.
* **Acceso:** Protegido (`auth:sanctum`).
* **Respuesta (`200 OK`):** `{"message": "Sesión cerrada"}`

---

### 5.2. Módulo de Usuarios y Perfil

#### `GET /api/user`
Retorna los datos del usuario autenticado con la relación ansiosa de su rol (`role`).
* **Acceso:** Protegido (`auth:sanctum`).

#### `GET /api/admin/users`
Lista todos los usuarios registrados en el sistema cargando sus relaciones de rol e ingresos de equipos.
* **Acceso:** Protegido (`auth:sanctum` + `admin_or_instructor`).

#### `POST /api/admin/users`
Crea un usuario desde el panel administrativo. Soporta carga de avatar a Cloudinary.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).
* **Tipo de Contenido:** `multipart/form-data`.
* **Parámetros:** `user_identification`, `user_name`, `user_lastname`, `user_email`, `user_password`, `user_coursenumber`, `user_program`, `fk_id_rol`, `image` (opcional, archivo binario `image/jpeg,image/png` hasta 2MB).
* **Respuesta Exitosa (`201 Created`):** Objeto del usuario con `profile_photo_path` conteniendo la URL segura de Cloudinary.

#### `PUT /api/admin/users/{id}`
Actualiza los datos institucionales de un usuario y opcionalmente su avatar en Cloudinary.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).

#### `DELETE /api/admin/users/{id}`
Elimina un usuario y en cascada sus huellas o registros asociados por clave foránea.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).

#### `PUT /api/my-profile`
Permite al usuario autenticado actualizar su propia información personal y subir o reemplazar su foto de carnet a Cloudinary.
* **Acceso:** Protegido (`auth:sanctum`).

---

### 5.3. Módulo de Registro y Control de Equipos

#### `POST /api/admin/equipment`
Crea un comprobante oficial de ingreso de equipo de cómputo para un usuario o instructor.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).
* **Payload JSON:**
  ```json
  {
    "fk_id_usuario": 3,
    "equipo_type": "Portátil",
    "equipo_brand": "Lenovo",
    "equipo_model": "ThinkPad E14",
    "equipo_color": "Negro",
    "equipo_serial": "SN-LNV-998822",
    "equipo_observations": "Incluye cargador y mouse inalámbrico."
  }
  ```
* **Respuesta (`201 Created`):** `{"message": "Comprobante de ingreso de equipo creado con éxito", "data": { ... }}`

#### `GET /api/admin/equipment`
Lista todos los comprobantes de equipos registrados, ordenados descendentemente por fecha.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).

#### `GET /api/my-equipment`
Obtiene los comprobantes de equipos pertenecientes exclusivamente al usuario autenticado.
* **Acceso:** Protegido (`auth:sanctum`).

#### `DELETE /api/admin/equipment/{id}`
Elimina el registro de un equipo del inventario de ingresos.
* **Acceso:** Protegido (`auth:sanctum` + `admin`).

---

### 5.4. Módulo de Gestión de Novedades de Ambientes

#### `GET /api/novedades`
Retorna el listado de novedades registradas en las sedes y ambientes con opción de búsqueda.
* **Acceso:** Protegido (`auth:sanctum` + `admin_or_instructor`).
* **Query Params:** `?search=Ambiente 201` (filtra en título, cuerpo o ambiente).

#### `POST /api/novedades`
Registra una nueva novedad vinculada al instructor o administrador que la reporta.
* **Acceso:** Protegido (`auth:sanctum` + `admin_or_instructor`).
* **Payload JSON:**
  ```json
  {
    "novedad_ambiente": "Laboratorio de Redes 204",
    "novedad_title": "Falla en Patch Panel",
    "novedad_body": "Se detectó puerto 14 sin conectividad hacia el switch principal."
  }
  ```
* **Respuesta (`201 Created`):** Objeto de la novedad creada con marca de tiempo automática.

#### `PUT /api/novedades/{id}`
Edita una novedad existente. Solo permite la modificación al autor original o al rol `admin`.
* **Acceso:** Protegido (`auth:sanctum` + `admin_or_instructor`).

#### `DELETE /api/novedades/{id}`
Elimina una novedad. Protegido para garantizar que solo el autor o un administrador pueda destruirla.
* **Acceso:** Protegido (`auth:sanctum` + `admin_or_instructor`).

---

### 5.5. Módulo de Inteligencia Artificial (Chatbot)

#### `POST /api/chatbot`
Canal de mensajería interactivo que consulta los modelos de lenguaje de Google Gemini para responder dudas sobre el reglamento, recuperación de accesos y funcionamiento del SENA.
* **Acceso:** Protegido (`auth:sanctum`).
* **Payload JSON:**
  ```json
  {
    "message": "¿Cómo hago para ingresar con mi carnet QR?",
    "history": [
      { "role": "user", "text": "Hola" },
      { "role": "model", "text": "¡Hola! ¿En qué puedo ayudarte?" }
    ]
  }
  ```
* **Respuesta Exitosa (`200 OK`):**
  ```json
  {
    "reply": "Para ingresar con tu carnet QR, dirígete a la sección de **Carnet Digital** en tu panel..."
  }
  ```
* **Respuestas de Error:**
  * `422 Unprocessable Content`: Si falta el parámetro `message`.
  * `502 Bad Gateway`: Si los modelos de IA de Google están agotados o no responden tras los reintentos automáticos.
  * `503 Service Unavailable`: Si `GEMINI_API_KEY` no se encuentra configurada en el servidor.

---

## 6. CONFIGURACIÓN Y CONTROLADORES DE SERVICIOS EXTERNOS

### 6.1. Cloudinary (Almacenamiento y CDN de Imágenes)
Cloudinary se utiliza como repositorio de objetos en la nube para persistir las fotos de perfil de los aprendices e instructores, garantizando que los carnets digitales se rendericen a alta velocidad desde redes de entrega de contenido (CDN) seguras vía HTTPS sin sobrecargar el almacenamiento local del servidor.

#### A. Variables de Entorno en `.env`
```ini
# Configuración oficial de Cloudinary
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
CLOUDINARY_UPLOAD_PRESET=senaacess
```

#### B. Paquete y Proveedor de Servicios
El backend integra el paquete oficial `cloudinary-labs/cloudinary-laravel: ^2.3`.
El servicio se expone automáticamente mediante la fachada `CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary`.

#### C. Implementación en el Controlador (`UserController.php`)
En los métodos `createUser`, `updateUser` y `updateMyProfile`:
```php
// Verificación del archivo binario multipart
if ($request->hasFile('image')) {
    // Almacena en la carpeta virtual 'avatars' dentro de Cloudinary y obtiene la URL segura HTTPS
    $profile_photo_path = $request->file('image')
        ->storeOnCloudinary('avatars')
        ->getSecurePath();

    $user->profile_photo_path = $profile_photo_path;
}
```

#### D. Consumo en el Frontend (`UserQrCarnet.jsx` y `Admin.jsx`)
La URL retornada por Cloudinary (`$profile_photo_path`) se almacena directamente en la base de datos MySQL y es consumida por el componente React:
```jsx
<div className="user-avatar-lg">
    {currentUser?.profile_photo_path ? (
        <img 
            src={currentUser.profile_photo_path} 
            alt="Foto Oficial" 
            crossOrigin="anonymous" 
        />
    ) : (
        <span>{currentUser?.user_name?.[0]}{currentUser?.user_lastname?.[0]}</span>
    )}
</div>
```

---

### 6.2. Google Gemini AI (Asistente Virtual Institucional)
El sistema integra los modelos de lenguaje de última generación de Google DeepMind para resolver inquietudes del centro las 24 horas del día.

#### A. Variables de Entorno en `.env` y Configuración en `config/services.php`
En el archivo `.env`:
```ini
GEMINI_API_KEY=AIzaSy...TuClaveGoogleAIStudio...
```

En `config/services.php`:
```php
'gemini' => [
    'api_key' => env('GEMINI_API_KEY'),
],
```

#### B. Arquitectura de Resiliencia y Fallback en `ChatbotController.php`
Para evitar caídas de servicio ante límites de cuota (`rate limits` o códigos 429/503), el controlador implementa un esquema de **conmutación por error (Failover) de doble modelo**:
1. **Modelo Primario:** `gemini-3.8-flash` (mayor capacidad analítica y rápida generación).
2. **Modelo de Respaldo:** `gemini-3.5-flash-lite` (cuota independiente y latencia ultra baja).

#### C. Lógica del Controlador (`ChatbotController.php`)
```php
$models = [
    'gemini-3.8-flash',       // Modelo primario
    'gemini-3.5-flash-lite',  // Respaldo de alta disponibilidad
];

$payload = [
    'systemInstruction' => [
        'parts' => [['text' => $systemInstruction]],
    ],
    'contents'          => $contents,
    'generationConfig'  => [
        'temperature'     => 0.7,
        'maxOutputTokens' => 1024,
    ],
];

foreach ($models as $model) {
    $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

    // Reintenta hasta 3 veces espaciadas por 500ms ante caídas temporales de red
    $response = Http::timeout(20)
        ->retry(3, 500, function ($exception, $request) {
            return $exception->getCode() >= 500;
        }, throw: false)
        ->post("{$endpoint}?key={$apiKey}", $payload);

    if ($response->successful()) {
        break; // Rompe el ciclo si el modelo respondió exitosamente
    }

    Log::warning("Fallo en modelo Gemini {$model}, conmutando a respaldo...");
}
```

#### D. Sistema de Instrucciones y Protección contra Inyecciones (System Prompt)
El controlador inyecta directrices fijas que restringen al bot para:
* Limitar su conocimiento exclusivamente al reglamento y procedimientos de SenaAccess y del SENA Regional Cauca.
* Rechazar solicitudes fuera de contexto institucional.
* Prohibir la divulgación de credenciales, tokens o datos sensibles de la base de datos.
* Responder obligatoriamente en español y con formato Markdown.

---

### 6.3. Servicio de Correo Transaccional (Resend / Brevo)
El despacho de correos electrónicos transaccionales para la recuperación de contraseñas olvidadas utiliza la API de **Resend** mediante el driver oficial para Laravel `resend/resend-laravel`.

#### A. Variables de Entorno en `.env`
```ini
MAIL_MAILER=resend
RESEND_API_KEY=re_AF3A8QCP_MoWy742jPXsnG2ySH4RRZFqE
MAIL_FROM_ADDRESS="onboarding@resend.dev"
MAIL_FROM_NAME="SENA Access"
```
*(Para despliegues institucionales corporativos con dominio validado, se sustituye `MAIL_FROM_ADDRESS` por `soporte@senaaccess.edu.co`)*.

#### B. Clase Mailable (`RecoveryCodeMail.php`)
```php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class RecoveryCodeMail extends Mailable
{
    use Queueable;
    public $code;

    public function __construct($code) {
        $this->code = $code;
    }

    public function envelope(): Envelope {
        return new Envelope(subject: 'Código de Recuperación - SENA Access');
    }

    public function content(): Content {
        return new Content(view: 'emails.recovery_code');
    }
}
```

#### C. Controlador (`AuthController.php`)
```php
// Genera código criptográfico de 8 caracteres alfanuméricos
$token = strtoupper(\Illuminate\Support\Str::random(8));

// Registra en base de datos con expiración estricta a 15 minutos
DB::table('token_recovery')->insert([
    'token_code'    => $token,
    'token_exp'     => Carbon::now('America/Bogota')->addMinutes(15),
    'token_used'    => false,
    'fk_id_usuario' => $user->id_usuario,
    'created_at'    => Carbon::now('America/Bogota'),
    'updated_at'    => Carbon::now('America/Bogota'),
]);

// Envío asíncrono del correo
Mail::to($user->user_email)->send(new RecoveryCodeMail($token));
```

---

### 6.4. Microservicio Biométrico y Algoritmo ORB (Python Flask)

#### A. Arquitectura del Flujo
1. **Captura:** La interfaz React (`Fingerprint.jsx` / `FingerprintSimulation.jsx`) interactúa con el sensor dactilar y empaqueta la muestra en un objeto `FormData`.
2. **Recepción en Backend:** Laravel valida la petición y realiza una llamada HTTP interna (vía `GuzzleHttp\Client` o `Http::post`) hacia el microservicio en `http://127.0.0.1:5000/api/biometric/verify`.
3. **Procesamiento con OpenCV y NumPy:**
   * La imagen dactilar recibida en escala de grises pasa por una ecualización de histograma adaptativa (CLAHE) para resaltar crestas y valles.
   * Se ejecuta el extractor de características **ORB** (*Oriented FAST and Rotated BRIEF*).
   * Se comparan los descriptores vectoriales con los registros de la base de datos usando el emparejador de fuerza bruta `cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)`.
   * Si el puntaje de similitud (*Match Score*) supera el umbral de tolerancia del 75%, se retorna `{"verified": true, "score": 88.4}`.
4. **Respuesta y Registro:** Laravel registra la fila correspondiente en la tabla `ingresos` y autoriza la entrada en el torniquete o panel.

---

## 7. ESQUEMA RELACIONAL DE LA BASE DE DATOS

El motor relacional MySQL organiza la información en las siguientes tablas maestras y transaccionales:

```
+---------------------------------------------------------------------------------+
|                               MODELO RELACIONAL                                 |
+---------------------------------------------------------------------------------+
|                                                                                 |
|   ROLES (1) ────< USUARIOS (N) ─────< INGRESOS (N)                              |
|                      │                                                          |
|                      ├──────────────< INGRESO_EQUIPOS (N)                       |
|                      │                                                          |
|                      ├──────────────< NOVEDADES (N)                             |
|                      │                                                          |
|                      ├──────────────< HUELLAS_USUARIOS (N)                      |
|                      │                                                          |
|                      └──────────────< TOKEN_RECOVERY (N)                        |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Descripción de Tablas Principales:
1. `roles`: Catálogo de perfiles (`id_rol`, `rol_name`). Valores: `admin`, `instructor`, `aprendiz`, `funcionario`, `invitado`.
2. `usuarios`: Datos de identidad (`id_usuario`, `user_identification`, `user_name`, `user_lastname`, `user_email`, `user_password`, `user_coursenumber`, `user_program`, `profile_photo_path`, `fk_id_rol`).
3. `ingresos`: Histórico de accesos peatonales (`id_ingreso`, `ingreso_datetime`, `ingreso_place`, `fk_id_user`).
4. `ingreso_equipos`: Registro de equipos de cómputo (`id_ingreso_equipo`, `equipo_type`, `equipo_brand`, `equipo_model`, `equipo_color`, `equipo_serial`, `equipo_observations`, `entry_datetime`, `fk_id_usuario`).
5. `novedades`: Reportes de incidentes en infraestructura (`id_novedad`, `novedad_ambiente`, `novedad_title`, `novedad_body`, `novedad_datetime`, `fk_id_usuario`).
6. `huellas_usuarios`: Plantillas biométricas registradas (`id_fingerprint`, `fingerprint_data`, `fingerprint_side`, `fk_id_user`).
7. `token_recovery`: Tokens temporales de recuperación de clave (`id_token`, `token_code`, `token_exp`, `token_used`, `fk_id_usuario`).

---

## 8. MANTENIMIENTO, SEGURIDAD Y BUENAS PRÁCTICAS

1. **Gestión de Tokens de Acceso:**
   * Los tokens de Sanctum almacenados en el `localStorage` del cliente se adjuntan en los interceptores de Axios de `bootstrap.js`.
   * En caso de recibir respuestas `401 Unauthorized`, el cliente limpia el almacenamiento local y redirige inmediatamente al login (`/login`).
2. **Protección de Datos Sensibles:**
   * Las contraseñas se almacenan mediante el algoritmo `Bcrypt` con factor de coste adaptativo (`Hash::make()`).
   * No almacenar credenciales de Cloudinary, Gemini ni Resend en el repositorio de control de versiones. Todas deben inyectarse mediante variables de entorno `.env`.
3. **Políticas de CORS:**
   * En producción, definir en `config/cors.php` los orígenes permitidos exactos (`allowed_origins`) para evitar peticiones no autorizadas desde otros dominios.
4. **Optimización de Cargas Multimedia:**
   * Las imágenes subidas por los usuarios se procesan directamente hacia el almacenamiento de Cloudinary con transformaciones automáticas de formato WebP y compresión sin pérdidas para reducir el consumo de datos de los aprendices.
