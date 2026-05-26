<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('huellas_usuarios', function (Blueprint $table) {
            $table->id('id_fingerprint');
            $table->binary('fingerprint_data');
            $table->string('fingerprint_side', 20);
            $table->unsignedBigInteger('fk_id_user');
            $table->foreign('fk_id_user')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('huellas_usuarios');
    }
};
