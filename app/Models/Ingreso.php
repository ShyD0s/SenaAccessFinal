<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingreso extends Model
{
    use HasFactory;

    protected $table = 'ingresos';
    protected $primaryKey = 'id_ingreso';

    protected $fillable = [
        'ingreso_datetime',
        'ingreso_place',
        'fk_id_user',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'fk_id_user', 'id_usuario');
    }
}
