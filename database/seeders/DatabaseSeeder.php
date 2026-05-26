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
        // Create Roles
        $adminRole = Role::firstOrCreate(['rol_name' => 'admin']);
        Role::firstOrCreate(['rol_name' => 'Instructor']);
        Role::firstOrCreate(['rol_name' => 'Aprendiz']);
        Role::firstOrCreate(['rol_name' => 'Invitado']);

        // Create Superadmin
        User::create([
            'user_name' => 'admin',
            'user_lastname' => 'System',
            'user_email' => 'admin@sena.edu.co', // Required field
            'user_password' => Hash::make('senaaccess'),
            'user_coursenumber' => 0,
            'user_program' => 'Administration',
            'fk_id_rol' => $adminRole->id_rol,
        ]);
    }
}
