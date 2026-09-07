<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;
use App\Models\IngresoEquipo;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        //Crear Roles
        $adminRole = Role::firstOrCreate(['rol_name' => 'admin']);
        $instructorRole = Role::firstOrCreate(['rol_name' => 'instructor']);
        $aprendizRole = Role::firstOrCreate(['rol_name' => 'aprendiz']);
        Role::firstOrCreate(['rol_name' => 'invitado']);

        //Superadmin usamos firstOrCreate para evitar duplicados en re-despliegues
        $admin = User::firstOrCreate(
            ['user_email' => 'admin@sena.edu.co'], 
            [
                'user_identification' => '1000000001',
                'user_name'         => 'admin',
                'user_lastname'     => 'System',
                'user_password'     => Hash::make('senaaccess'),
                'user_coursenumber' => 0,
                'user_program'      => 'admin',
                'fk_id_rol'         => $adminRole->id_rol,
            ]
        );

        // Instructor con equipo
        $instructor = User::firstOrCreate(
            ['user_email' => 'instructor@sena.edu.co'],
            [
                'user_identification' => '1000000002',
                'user_name'         => 'Carlos',
                'user_lastname'     => 'Pérez',
                'user_password'     => Hash::make('senaaccess'),
                'user_coursenumber' => 2670142,
                'user_program'      => 'ADSO',
                'fk_id_rol'         => $instructorRole->id_rol,
            ]
        );

        IngresoEquipo::firstOrCreate(
            ['equipo_serial' => 'SN-LENOVO-8921'],
            [
                'fk_id_usuario'       => $instructor->id_usuario,
                'equipo_type'         => 'Portátil',
                'equipo_brand'        => 'Lenovo',
                'equipo_model'        => 'ThinkPad T14',
                'equipo_color'        => 'Negro',
                'equipo_observations' => 'Equipo corporativo asignado para formación.',
                'entry_datetime'      => now(),
            ]
        );

        // Aprendiz con equipo
        $aprendiz1 = User::firstOrCreate(
            ['user_email' => 'maria@sena.edu.co'],
            [
                'user_identification' => '1000000003',
                'user_name'         => 'María',
                'user_lastname'     => 'López',
                'user_password'     => Hash::make('senaaccess'),
                'user_coursenumber' => 2670142,
                'user_program'      => 'ADSO',
                'fk_id_rol'         => $aprendizRole->id_rol,
            ]
        );

        IngresoEquipo::firstOrCreate(
            ['equipo_serial' => 'SN-HP-4412A'],
            [
                'fk_id_usuario'       => $aprendiz1->id_usuario,
                'equipo_type'         => 'Portátil',
                'equipo_brand'        => 'HP',
                'equipo_model'        => 'Pavilion 15',
                'equipo_color'        => 'Plateado',
                'equipo_observations' => 'Portátil personal para prácticas de programación.',
                'entry_datetime'      => now(),
            ]
        );

        // Aprendiz sin equipo
        User::firstOrCreate(
            ['user_email' => 'juan@sena.edu.co'],
            [
                'user_identification' => '1000000004',
                'user_name'         => 'Juan',
                'user_lastname'     => 'Martínez',
                'user_password'     => Hash::make('senaaccess'),
                'user_coursenumber' => 2670142,
                'user_program'      => 'ADSO',
                'fk_id_rol'         => $aprendizRole->id_rol,
            ]
        );
    }
}