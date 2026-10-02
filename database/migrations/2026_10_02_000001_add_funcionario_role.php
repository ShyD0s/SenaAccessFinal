<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Role;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Role::firstOrCreate(['rol_name' => 'funcionario']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Role::where('rol_name', 'funcionario')->delete();
    }
};
