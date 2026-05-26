<?php

namespace App\Http\Controllers;

use App\Models\Novedad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NovedadController extends Controller
{
    //OBTIENE TODAS LAS NOVEDADES
    public function index(Request $request)
    {
        $search = $request->query('search'); //OBTIENE EL PARAMETRO DE BUSQUEDA

        $query = Novedad::with('user'); //OBTIENE TODAS LAS NOVEDADES

        if ($search) { //VALIDA SI EXISTE EL PARAMETRO DE BUSQUEDA
            $query->where(function($q) use ($search) {
                $q->where('novedad_title', 'like', "%{$search}%") //VALIDA SI EXISTE EL PARAMETRO DE BUSQUEDA
                  ->orWhere('novedad_body', 'like', "%{$search}%") //VALIDA SI EXISTE EL PARAMETRO DE BUSQUEDA
                  ->orWhere('novedad_ambiente', 'like', "%{$search}%"); //VALIDA SI EXISTE EL PARAMETRO DE BUSQUEDA
            }); //CIERRA LA VALIDACION DE BUSQUEDA
        }

        $novedades = $query->orderBy('novedad_datetime', 'desc')->get(); //OBTIENE TODAS LAS NOVEDADES ORDENADAS POR FECHA

        return response()->json($novedades); //RETORNA TODAS LAS NOVEDADES
    }

    //FUNCION PARA CREAR UNA NUEVA NOVEDAD
    public function store(Request $request)
    {
        $request->validate([
            'novedad_ambiente' => 'required|string|max:100', //VALIDA QUE LA NOVEDAD EXISTA
            'novedad_ambiente' => 'required|string|max:100', //VALIDA QUE LA NOVEDAD EXISTA
            'novedad_title' => 'required|string|max:100', //VALIDA QUE EL TITULO EXISTA
            'novedad_body' => 'required|string', //VALIDA QUE EL CUERPO EXISTA
        ]);

        $novedad = Novedad::create([ //CREA LA NOVEDAD
            'novedad_ambiente' => $request->novedad_ambiente, //OBTIENE EL AMBIENTE
            'novedad_title' => $request->novedad_title, //OBTIENE EL TITULO
            'novedad_body' => $request->novedad_body, //OBTIENE EL CUERPO
            'novedad_datetime' => now(), //OBTIENE LA FECHA Y HORA ACTUAL
            'fk_id_usuario' => Auth::id(), //OBTIENE EL ID DEL USUARIO
        ]);

        return response()->json($novedad, 201);
    }

    public function show($id)
    {
        $novedad = Novedad::with('user')->findOrFail($id); //OBTIENE LA NOVEDAD
        return response()->json($novedad); //RETORNA LA NOVEDAD
    }

    public function update(Request $request, $id)
    {
        $novedad = Novedad::findOrFail($id); //OBTIENE LA NOVEDAD

        // Only the creator or an admin can update
        if ($novedad->fk_id_usuario !== Auth::id() && Auth::user()->role->rol_name !== 'admin') { //VALIDA QUE EL USUARIO SEA EL CREADOR O UN ADMIN
            return response()->json(['message' => 'No tienes permiso para actualizar esta novedad'], 403); //RETORNA MENSAJE DE ERROR
        }

        $request->validate([
            'novedad_ambiente' => 'string|max:100',
            'novedad_title' => 'string|max:100',
            'novedad_body' => 'string',
        ]);

        $novedad->update($request->only(['novedad_ambiente', 'novedad_title', 'novedad_body']));

        return response()->json($novedad);
    }

    public function destroy($id)
    {
        $novedad = Novedad::findOrFail($id);

        // Only the creator or an admin can delete
        if ($novedad->fk_id_usuario !== Auth::id() && Auth::user()->role->rol_name !== 'admin') {
            return response()->json(['message' => 'No tienes permiso para eliminar esta novedad'], 403);
        }

        $novedad->delete();

        return response()->json(['message' => 'Novedad eliminada correctamente']);
    }
}
