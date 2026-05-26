<?php

namespace App\Http\Controllers;

use App\Models\IngresoEquipo;
use App\Models\User;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([ //VALIDACIONES PARA EL REGISTRO DE EQUIPOS
            'fk_id_usuario' => 'required|exists:usuarios,id_usuario', //VALIDA QUE EL USUARIO EXISTA
            'equipo_type' => 'required|string', //VALIDA QUE EL TIPO DE EQUIPO EXISTA
            'equipo_brand' => 'required|string',//VALIDA QUE LA MARCA DEL EQUIPO EXISTA
            'equipo_model' => 'nullable|string',//VALIDA QUE EL MODELO DEL EQUIPO EXISTA
            'equipo_color' => 'required|string',//VALIDA QUE EL COLOR DEL EQUIPO EXISTA
            'equipo_serial' => 'required|string|unique:ingreso_equipos', //VALIDA QUE EL SERIAL NO SE REPITA
            'equipo_observations' => 'nullable|string',//VALIDA QUE LAS OBSERVACIONES NO SE REPITAN
        ]);

        $ingreso = IngresoEquipo::create($request->all());

        return response()->json([ //RESPUESTA DE LA CREACION DEL REGISTRO
            'message' => 'Comprobante de ingreso de equipo creado con éxito',
            'data' => $ingreso->load('user')
        ], 201);
    }

    public function index()
    {
        $ingresos = IngresoEquipo::with('user')->orderBy('entry_datetime', 'desc')->get();
        return response()->json($ingresos); //RESPUESTA DE LA CONSULTA DE LOS REGISTROS
    }

    public function getMyEquipment(Request $request)
    {
        $ingresos = IngresoEquipo::where('fk_id_usuario', $request->user()->id_usuario) //CONSULTA DE LOS REGISTROS DEL USUARIO
            ->with('user') //CONSULTA DE LOS REGISTROS DEL USUARIO
            ->orderBy('entry_datetime', 'desc') //CONSULTA DE LOS REGISTROS DEL USUARIO
            ->get(); //CONSULTA DE LOS REGISTROS DEL USUARIO
        return response()->json($ingresos); //RESPUESTA DE LA CONSULTA DE LOS REGISTROS
    }
}
