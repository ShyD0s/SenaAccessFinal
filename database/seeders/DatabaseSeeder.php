<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        //Crear Roles
        $adminRole = Role::firstOrCreate(['rol_name' => 'admin']);
        Role::firstOrCreate(['rol_name' => 'instructor']);
        Role::firstOrCreate(['rol_name' => 'aprendiz']);
        Role::firstOrCreate(['rol_name' => 'invitado']);

        //Superadmin usamos firstOrCreate para evitar duplicados en re-despliegues
        User::firstOrCreate(
            ['user_email' => 'admin@sena.edu.co'], 
            [
                'user_name'         => 'admin',
                'user_lastname'     => 'System',
                'user_password'     => Hash::make('senaaccess'),
                'user_coursenumber' => 0,
                'user_program'      => 'admin',
                'fk_id_rol'         => $adminRole->id_rol,
            ]
        );
    }
}