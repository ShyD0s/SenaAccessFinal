<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use App\Models\Ingreso;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class AdminController extends Controller
{
    public function index()
    {
        $users = User::with('role')->get();
        return response()->json($users); //CONSULTA DE TODOS LOS USUARIOS
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

        return response()->json($user->load('role'), 201);
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

        return response()->json($user->load('role')); //RETORNA EL USUARIO ACTUALIZADO
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
}
