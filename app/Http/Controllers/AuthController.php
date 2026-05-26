<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use \Laravel\Sanctum\PersonalAccessToken;

use App\Models\Ingreso;
use Carbon\Carbon;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_identification' => 'required|string|max:20|unique:usuarios',
            'user_name' => 'required|string|max:50',
            'user_lastname' => 'required|string|max:50',
            'user_email' => 'required|string|email|max:100|unique:usuarios',
            'user_password' => 'required|string|min:8|confirmed',
            'user_coursenumber' => 'required|integer',
            'user_program' => 'required|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get default role (Aprendiz)
        $role = Role::where('rol_name', 'Aprendiz')->first();

        $user = User::create([
            'user_identification' => $request->user_identification,
            'user_name' => $request->user_name,
            'user_lastname' => $request->user_lastname,
            'user_email' => $request->user_email,
            'user_password' => Hash::make($request->user_password),
            'user_coursenumber' => $request->user_coursenumber,
            'user_program' => $request->user_program,
            'fk_id_rol' => $role->id_rol,
        ]);

        return response()->json(['message' => 'Usuario registrado exitosamente', 'user' => $user], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'user_email' => 'required|email',
            'user_password' => 'required',
        ]);

        $user = User::where('user_email', $credentials['user_email'])->first();

        if (!$user || !Hash::check($credentials['user_password'], $user->user_password)) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Crear registro de ingreso
        Ingreso::create([
            //usamos hora colombiana
            'ingreso_datetime' => Carbon::now('America/Bogota'),
            'ingreso_place' => 'CCyS', // Default place
            'fk_id_user' => $user->id_usuario,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'user' => $user,
            'role' => $user->role->rol_name,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request)
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $request->user()->currentAccessToken();
        if ($token) {
            $token->delete();
        }     
        return response()->json(['message' => 'Sesión cerrada']);
    }

    public function registerGuest(Request $request)
    {
        $request->validate([
            'user_identification' => 'required|string|max:20',
            'user_name' => 'required|string|max:100',
        ]);

        // Buscar si ya existe el invitado por su identificación
        $user = User::where('user_identification', $request->user_identification)->first();

        if (!$user) {
            // Obtener el rol de Invitado
            $role = Role::where('rol_name', 'Invitado')->first();
            
            // Si no existe, crear un usuario volátil (invitado)
            $user = User::create([
                'user_identification' => $request->user_identification,
                'user_name' => $request->user_name,
                'user_lastname' => '(Invitado)',
                'user_email' => 'guest_' . $request->user_identification . '@system.com',
                'user_password' => Hash::make(\Illuminate\Support\Str::random(16)),
                'user_coursenumber' => 0,
                'user_program' => 'Visitante',
                'fk_id_rol' => $role->id_rol,
            ]);
        }

        // Crear registro de ingreso
        Ingreso::create([
            'ingreso_datetime' => Carbon::now(),
            'ingreso_place' => 'Acceso Invitado',
            'fk_id_user' => $user->id_usuario,
        ]);

        return response()->json([
            'message' => 'Ingreso de invitado registrado correctamente',
            'user' => $user
        ], 201);
    }
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('user_email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Si el correo existe, se ha enviado un enlace.'], 200);
        }

        // Generar código de recuperación de 8 caracteres
        $token = strtoupper(\Illuminate\Support\Str::random(8));

        // Guardar en la tabla token_recovery
        \Illuminate\Support\Facades\DB::table('token_recovery')->insert([
            'token_code' => $token,
            'token_exp' => Carbon::now('America/Bogota')->addMinutes(15),
            'token_used' => false,
            'fk_id_usuario' => $user->id_usuario,
            'created_at' => Carbon::now('America/Bogota'),
            'updated_at' => Carbon::now('America/Bogota'),
        ]);

        // Enviar correo electrónico con el código de recuperación
        \Illuminate\Support\Facades\Mail::to($user->user_email)->send(new \App\Mail\RecoveryCodeMail($token));

        return response()->json(['message' => 'Se ha enviado el código a tu correo.'], 200);
    }

    public function resetPassword(Request $request) //FUNCION PARA RESETEAR LA CONTRASEÑA
    {
        $request->validate([
            'code' => 'required|string|max:10', //VALIDA QUE EL CODIGO EXISTA
            'password' => 'required|string|min:8|confirmed', //VALIDA QUE LA CONTRASEÑA EXISTA
        ]);

        $tokenRecord = \Illuminate\Support\Facades\DB::table('token_recovery') //BUSCA EL TOKEN EN LA TABLA TOKEN_RECOVERY
            ->where('token_code', $request->code)
            ->where('token_used', false) //VALIDA QUE EL TOKEN NO SE HAYA USADO
            ->where('token_exp', '>=', Carbon::now('America/Bogota')) //VALIDA QUE EL TOKEN NO HAYA EXPIRADO
            ->first(); //OBTIENE EL TOKEN

        if (!$tokenRecord) {
            return response()->json(['message' => 'El código es inválido o ha expirado.'], 400);
        }

        $user = User::where('id_usuario', $tokenRecord->fk_id_usuario)->first(); //OBTIENE EL USUARIO
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado.'], 404);
        }

        $user->user_password = Hash::make($request->password); //ACTUALIZA LA CONTRASEÑA DEL USUARIO
        $user->save(); //GUARDA LOS CAMBIOS EN LA BASE DE DATOS


        //PARA ACTUALIZAR EL ESTADO DEL TOKEN A USADO
        \Illuminate\Support\Facades\DB::table('token_recovery') //ACTUALIZA EL ESTADO DEL TOKEN A USADO
            ->where('id_token', $tokenRecord->id_token) //OBTIENE EL TOKEN
            ->update([
                'token_used' => true, //ACTUALIZA EL ESTADO DEL TOKEN A USADO
                'updated_at' => Carbon::now('America/Bogota'), //CARBON PARA LA FECHA Y HORA ACTUAL
            ]);
            
        // RETORNA LA CONTRASEÑA ACTUALIZADA
        return response()->json(['message' => 'Contraseña actualizada correctamente.'], 200);
    }
}
