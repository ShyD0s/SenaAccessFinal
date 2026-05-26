<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IngresoEquipo extends Model
{
    use HasFactory;

    protected $table = 'ingreso_equipos';
    protected $primaryKey = 'id_ingreso_equipo';

    protected $fillable = [
        'fk_id_usuario',
        'equipo_type',
        'equipo_brand',
        'equipo_model',
        'equipo_color',
        'equipo_serial',
        'equipo_observations',
        'entry_datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'fk_id_usuario', 'id_usuario');
    }
}
