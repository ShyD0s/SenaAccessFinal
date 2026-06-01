<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\NovedadController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rutas de autenticación con Sanctum
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register-guest', [AuthController::class, 'registerGuest']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('role');
    });

    // Rutas de usuario general (Aprendiz)
    Route::get('/my-ingresos', [AdminController::class, 'getMyIngresos']);
    Route::get('/my-equipment', [EquipmentController::class, 'getMyEquipment']);
    Route::put('/my-profile', [AdminController::class, 'updateMyProfile']);

    // Rutas compartidas entre Admin e Instructor
    Route::middleware('admin_or_instructor')->prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'index']);
        Route::get('/ingresos', [AdminController::class, 'getIngresos']);
        Route::get('/roles', [AdminController::class, 'getRoles']);
        
        // Solo el admin puede crear usuarios
        Route::middleware('admin')->group(function () {
            Route::post('/users', [AdminController::class, 'createUser']);
            Route::put('/users/{id}', [AdminController::class, 'updateUser']);
            Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
        });

        // Solo el admin puede crear equipos
        Route::middleware('admin')->group(function () {
            Route::get('/equipment', [EquipmentController::class, 'index']);
            Route::post('/equipment', [EquipmentController::class, 'store']);
        });
    });

    // Rutas de novedades compartidas entre Admin e Instructor
    Route::middleware('admin_or_instructor')->group(function () {
        Route::apiResource('novedades', NovedadController::class);
    });

    // Rutas específicas del Instructor
    Route::middleware('auth:sanctum')->group(function () {
        // Solo el instructor puede ver sus propios comprobantes
    });
});
