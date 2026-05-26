<?php

namespace App\Http\Controllers;
use App\Models\User;
use App\Models\Role;
use App\Models\Ingreso;
use Illuminate\Http\Request;

// controlador para pruebas de consultas a la base de datos
class ConsultasController extends Controller
{
    public function index()
    {
        $user = User::find(2);

        
        // testing usuarios con sus modelos 
         return [
            'user_identification' => $user->user_identification,
            'user_name' => $user->user_name,
            'user_lastname' => $user->user_lastname,
            'user_email' => $user->user_email,
            'user_coursenumber' => $user->user_coursenumber,
            'user_program' => $user->user_program,
            'fk_id_rol' => $user->fk_id_rol,
            'rol' => $user->role->rol_name,
            'ingresos' => $user->ingresos->take(3)->map(function ($ingreso) {
                return [
                    'id_ingreso' => $ingreso->id_ingreso,
                    'ingreso_datetime' => $ingreso->ingreso_datetime,
                    'ingreso_place' => $ingreso->ingreso_place,
                ];
            }),
            'novedades' => $user->novedades->take(3)->map(function ($novedad) {
                return [
                    'id_novedad' => $novedad->id_novedad,
                    'novedad_ambiente' => $novedad->novedad_ambiente,
                    'novedad_title' => $novedad->novedad_title,
                    'novedad_body' => $novedad->novedad_body,
                    'novedad_datetime' => $novedad->novedad_datetime,   

                ];
            }),
            'token_recovery' => $user->token_recovery->take(2)->map(function ($token) {
                return [
                    'id_token' => $token->id_token,
                    'token_code' => $token->token_code,
                    'token_exp' => $token->token_exp,
                    'token_used' => $token->token_used,
                ];
            }),
            'ingreso_equipos' => $user->ingreso_equipos->map(function ($ingreso_equipos) {
                return [
                    'id_ingreso_equipo' => $ingreso_equipos->id_ingreso_equipo,
                    'equipo_type' => $ingreso_equipos->equipo_type,
                    'equipo_brand' => $ingreso_equipos->equipo_brand,
                    'entry_datetime' => $ingreso_equipos->entry_datetime,
                ];
            }),





         ];

    }

    public function index2()
{   
    $ingreso = Ingreso::find(1);

    return [
        'id_ingreso' => $ingreso->id_ingreso,
        'fk_id_user' => $ingreso->fk_id_user,
        'user_name' => $ingreso->user->user_name, 
        'ingreso_datetime' => $ingreso->ingreso_datetime,
        'ingreso_place' => $ingreso->ingreso_place,
    ];




       



}

}
