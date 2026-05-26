<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConsultasController;


/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/
// Test para consultas a la base de datos, consulta de un usuario
// Route::get('/consultuser', 
// [ConsultasController::class, 'index']);
// // Test para consultas a la base de datos, consulta de un ingreso
// Route::get('/consultingreso', 
// [ConsultasController::class, 'index2']);

//Obtener cualquier componente, para manejar en SPA
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*'); 
