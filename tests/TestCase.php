<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    /**
     * Obtiene o crea un rol por nombre.
     */
    protected function getOrCreateRole(string $name): Role
    {
        return Role::firstOrCreate(['rol_name' => strtolower($name)]);
    }

    /**
     * Crea un usuario de prueba en la base de datos con contraseña predeterminada 'password123'.
     */
    protected function createTestUser(string $roleName = 'aprendiz', array $attributes = []): User
    {
        $role = $this->getOrCreateRole($roleName);
        $random = Str::random(6);

        return User::create(array_merge([
            'user_name' => 'Test' . ucfirst($roleName),
            'user_lastname' => 'User ' . $random,
            'user_email' => 'test_' . strtolower($roleName) . '_' . Str::random(8) . '@sena.edu.co',
            'user_identification' => 'DOC' . rand(10000000, 99999999),
            'user_password' => Hash::make('password123'),
            'user_coursenumber' => 2560123,
            'user_program' => 'ADSO',
            'fk_id_rol' => $role->id_rol,
        ], $attributes));
    }

    /**
     * Crea un usuario con rol de Administrador.
     */
    protected function createAdminUser(array $attributes = []): User
    {
        return $this->createTestUser('admin', $attributes);
    }

    /**
     * Crea un usuario con rol de Instructor.
     */
    protected function createInstructorUser(array $attributes = []): User
    {
        return $this->createTestUser('instructor', $attributes);
    }
}
