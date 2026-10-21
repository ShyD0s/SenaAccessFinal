<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\Models\Ingreso;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Carbon\Carbon;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['role', 'ingreso_equipos'])->get();
        return response()->json($users); //CONSULTA DE TODOS LOS USUARIOS CON ROLES Y EQUIPOS
    }

    public function getIngresos()
    {
        $ingresos = Ingreso::with('user')->orderBy('ingreso_datetime', 'desc')->get();
        return response()->json($ingresos); //CONSULTA DE TODOS LOS USUARIOS ORDENADO POR FECHA DESCENDENTE
    }

    public function createUser(Request $request)
    { //VALIDACIONES PARA EL REGISTRO DE USUARIOS
        $request->validate([
            'user_identification' => 'required|string|max:20|unique:usuarios', //VALIDA QUE EL USUARIO EXISTA
            'user_name' => 'required', //VALIDA QUE EL NOMBRE EXISTA
            'user_lastname' => 'required', //VALIDA QUE EL APELLIDO EXISTA
            'user_email' => 'required|email|unique:usuarios', //VALIDA QUE EL CORREO EXISTA
            'user_password' => 'required', //VALIDA QUE LA CONTRASEÑA EXISTA
            'user_coursenumber' => 'required',
            'user_program' => 'required',
            'fk_id_rol' => 'required|exists:roles,id_rol',
            'image' => 'nullable|image|max:2048',
        ]);

        $profile_photo_path = null; //VALIDA QUE LA IMAGEN NO SE REPITAN
        if ($request->hasFile('image')) { //VALIDA QUE LA IMAGEN EXISTA
            $profile_photo_path = $request->file('image')->storeOnCloudinary('avatars')->getSecurePath(); //VALIDA QUE LA IMAGEN NO SE REPITAN
        }

        $user = User::create([ //CREA EL USUARIO
            'user_identification' => $request->user_identification,
            'user_name' => $request->user_name,
            'user_lastname' => $request->user_lastname,
            'user_email' => $request->user_email,
            'user_password' => Hash::make($request->user_password),
            'user_coursenumber' => $request->user_coursenumber,
            'user_program' => $request->user_program,
            'fk_id_rol' => $request->fk_id_rol,
            'profile_photo_path' => $profile_photo_path,
        ]);

        return response()->json($user->load(['role', 'ingreso_equipos']), 201);
    }

    public function deleteUser($id) //FUNCION PARA ELIMINAR USUARIO POR ID
    {
        $user = User::findOrFail($id);
        $user->delete(); //ELIMINA EL USUARIO
        return response()->json(['message' => 'Usuario eliminado']); //RETORNA MENSAJE DE ELIMINACION
    }

    public function updateUser(Request $request, $id) //FUNCION PARA ACTUALIZAR USUARIO
    {
        $user = User::findOrFail($id); //BUSCA EL USUARIO POR ID
        
        $request->validate([
            'user_identification' => 'required|string|max:20|unique:usuarios,user_identification,' . $id . ',id_usuario',
            'user_name' => 'required',
            'user_lastname' => 'required',
            'user_email' => 'required|email|unique:usuarios,user_email,' . $id . ',id_usuario',
            'user_password' => 'nullable|min:6',
            'user_coursenumber' => 'required',
            'user_program' => 'required',
            'fk_id_rol' => 'required|exists:roles,id_rol',
            'image' => 'nullable|image|max:2048',
        ]);
        //ACTUALIZA LA IMAGEN DEL USUARIO
        if ($request->hasFile('image')) { //VALIDA QUE LA IMAGEN EXISTA
            $profile_photo_path = $request->file('image')->storeOnCloudinary('avatars')->getSecurePath();
            $user->profile_photo_path = $profile_photo_path; //ACTUALIZA LA IMAGEN DEL USUARIO
        }

        $user->user_identification = $request->user_identification; //ACTUALIZA LA IDENTIFICACION DEL USUARIO
        $user->user_name = $request->user_name; //ACTUALIZA EL NOMBRE DEL USUARIO
        $user->user_lastname = $request->user_lastname; //ACTUALIZA EL APELLIDO DEL USUARIO
        $user->user_email = $request->user_email; //ACTUALIZA EL CORREO DEL USUARIO
        $user->user_coursenumber = $request->user_coursenumber; //ACTUALIZA EL NUMERO DE CURSO DEL USUARIO
        $user->user_program = $request->user_program; //ACTUALIZA EL PROGRAMA DEL USUARIO
        $user->fk_id_rol = $request->fk_id_rol; //ACTUALIZA EL ROL DEL USUARIO

        if ($request->filled('user_password')) { //VALIDA QUE LA CONTRASEÑA EXISTA
            $user->user_password = Hash::make($request->user_password); //ACTUALIZA LA CONTRASEÑA DEL USUARIO
        }

        $user->save(); //GUARDA LOS CAMBIOS EN LA BASE DE DATOS

        return response()->json($user->load(['role', 'ingreso_equipos'])); //RETORNA EL USUARIO ACTUALIZADO CON SUS EQUIPOS
    }

    public function getRoles() //FUNCION PARA OBTENER TODOS LOS ROLES
    {
        return response()->json(Role::all()); //RETORNA TODOS LOS ROLES
    }

    public function getMyIngresos(Request $request) //FUNCION PARA OBTENER MIS INGRESOS
    {
        $ingresos = Ingreso::where('fk_id_user', $request->user()->id_usuario) //BUSCA LOS INGRESOS DEL USUARIO
            ->with('user') //RELACIONA CON EL USUARIO
            ->orderBy('ingreso_datetime', 'desc') //ORDENA POR FECHA DESCENDENTE
            ->get(); //OBTIENE TODOS LOS INGRESOS
        return response()->json($ingresos); //RETORNA LOS INGRESOS
    }

    public function updateMyProfile(Request $request) //FUNCION PARA ACTUALIZAR MI PERFIL
    {
        $user = $request->user(); //OBTIENE EL USUARIO ACTUAL
        
        $request->validate([ //VALIDA QUE LA INFORMACION SEA CORRECTA
            'user_identification' => 'required|string|max:20|unique:usuarios,user_identification,' . $user->id_usuario . ',id_usuario', //VALIDA QUE LA IDENTIFICACION NO SE REPITA
            'user_name' => 'required', //VALIDA QUE EL NOMBRE EXISTA
            'user_lastname' => 'required', //VALIDA QUE EL APELLIDO EXISTA
            'user_email' => 'required|email|unique:usuarios,user_email,' . $user->id_usuario . ',id_usuario', //VALIDA QUE EL CORREO EXISTA
            'user_password' => 'nullable|min:6', //VALIDA QUE LA CONTRASEÑA EXISTA
            'user_coursenumber' => 'required', //VALIDA QUE EL NUMERO DE CURSO EXISTA
            'user_program' => 'required', //VALIDA QUE EL PROGRAMA EXISTA
            'image' => 'nullable|image|max:2048', //VALIDA QUE LA IMAGEN EXISTA
        ]);

        if ($request->hasFile('image')) { //VALIDA QUE LA IMAGEN EXISTA
            $profile_photo_path = $request->file('image')->storeOnCloudinary('avatars')->getSecurePath(); //VALIDA QUE LA IMAGEN NO SE REPITAN
            $user->profile_photo_path = $profile_photo_path; //ACTUALIZA LA IMAGEN DEL USUARIO
        }

        $user->user_identification = $request->user_identification; //ACTUALIZA LA IDENTIFICACION DEL USUARIO
        $user->user_name = $request->user_name; //ACTUALIZA EL NOMBRE DEL USUARIO
        $user->user_lastname = $request->user_lastname; //ACTUALIZA EL APELLIDO DEL USUARIO
        $user->user_email = $request->user_email; //ACTUALIZA EL CORREO DEL USUARIO
        $user->user_coursenumber = $request->user_coursenumber; //ACTUALIZA EL NUMERO DE CURSO DEL USUARIO
        $user->user_program = $request->user_program; //ACTUALIZA EL PROGRAMA DEL USUARIO

        if ($request->filled('user_password')) { //VALIDA QUE LA CONTRASEÑA EXISTA
            $user->user_password = Hash::make($request->user_password); //ACTUALIZA LA CONTRASEÑA DEL USUARIO
        }

        $user->save(); //GUARDA LOS CAMBIOS EN LA BASE DE DATOS

        return response()->json($user->load('role')); //RETORNA EL USUARIO ACTUALIZADO
    }

    /**
     * Genera un token dinámico seguro y efímero para el carnet digital QR.
     * Cambia cada 30 segundos usando una ventana de tiempo sincronizada.
     */
    public function getMyQrToken(Request $request)
    {
        $user = $request->user()->load(['role', 'ingreso_equipos']);
        $windowSeconds = 30;
        $currentTime = time();
        $timeWindow = (int) floor($currentTime / $windowSeconds);
        $expiresIn = $windowSeconds - ($currentTime % $windowSeconds);

        // Clave HMAC con la app key de Laravel
        $appKey = config('app.key') ?: 'sena_access_secret_key';
        $token = hash_hmac('sha256', "{$user->id_usuario}:{$user->user_identification}:{$timeWindow}", $appKey);

        return response()->json([
            'app' => 'SENA_ACCESS',
            'ver' => 2,
            'id_usuario' => $user->id_usuario,
            'user_identification' => $user->user_identification,
            'user_name' => trim("{$user->user_name} {$user->user_lastname}"),
            'user_email' => $user->user_email,
            'user_coursenumber' => $user->user_coursenumber,
            'user_program' => $user->user_program,
            'role' => $user->role ? $user->role->rol_name : '',
            'equipos_count' => $user->ingreso_equipos ? $user->ingreso_equipos->count() : 0,
            'time_window' => $timeWindow,
            'timestamp' => $currentTime,
            'expires_in' => $expiresIn,
            'window_seconds' => $windowSeconds,
            'token' => $token,
        ]);
    }

    /**
     * Registra el ingreso de un usuario escaneando su QR de carnet digital.
     * Valida autenticidad y expiración del código QR dinámico.
     */
    public function registerIngresoByQr(Request $request)
    {
        $request->validate([
            'qr_data' => 'required',
            'ingreso_place' => 'nullable|string|max:100',
        ]);

        $raw = $request->input('qr_data');
        $payload = is_string($raw) ? json_decode($raw, true) : $raw;

        $user = null;
        $isDynamic = false;
        $appKey = config('app.key') ?: 'sena_access_secret_key';

        if (is_array($payload) && !empty($payload['id_usuario'])) {
            $user = User::with(['role', 'ingreso_equipos'])->find($payload['id_usuario']);

            // Si contiene token dinámico (versión 2)
            if (isset($payload['token']) && isset($payload['time_window'])) {
                $isDynamic = true;
                $timeWindow = (int) $payload['time_window'];
                $currentWindow = (int) floor(time() / 30);

                // Ventanas válidas: ventana actual y ventana inmediatamente anterior (tolerancia de 60s)
                $validWindows = [$currentWindow, $currentWindow - 1];

                if (!in_array($timeWindow, $validWindows)) {
                    return response()->json([
                        'success' => false,
                        'expired' => true,
                        'message' => 'El código QR ha expirado. Pide al usuario que muestre su carnet digital actualizado.',
                    ], 422);
                }

                $expectedToken = hash_hmac(
                    'sha256',
                    "{$payload['id_usuario']}:" . ($payload['user_identification'] ?? ($user ? $user->user_identification : '')) . ":{$timeWindow}",
                    $appKey
                );

                if (!hash_equals($expectedToken, (string) $payload['token'])) {
                    return response()->json([
                        'success' => false,
                        'expired' => false,
                        'message' => 'El código QR no es auténtico o fue alterado.',
                    ], 422);
                }
            }
        }

        // Búsqueda por documento si no se encontró por ID o viene como texto plano
        if (!$user) {
            $ident = is_array($payload) ? ($payload['user_identification'] ?? null) : trim((string) $raw);
            if ($ident) {
                $user = User::with(['role', 'ingreso_equipos'])->where('user_identification', $ident)->first();
            }
        }

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado en el sistema con el código QR escaneado.',
            ], 404);
        }

        $place = $request->input('ingreso_place') ?: 'Entrada Principal';

        $ingreso = Ingreso::create([
            'ingreso_datetime' => Carbon::now('America/Bogota'),
            'ingreso_place' => $place,
            'fk_id_user' => $user->id_usuario,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Ingreso registrado correctamente para {$user->user_name} {$user->user_lastname}",
            'is_dynamic' => $isDynamic,
            'user' => $user,
            'ingreso' => $ingreso->load('user'),
        ], 201);
    }
}
