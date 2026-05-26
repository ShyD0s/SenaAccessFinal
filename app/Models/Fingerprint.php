<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fingerprint extends Model
{
    use HasFactory;

    protected $table = 'huellas_usuarios';
    protected $primaryKey = 'id_fingerprint';

    protected $fillable = [
        'fingerprint_data',
        'fingerprint_side',
        'fk_id_user',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'fk_id_user', 'id_usuario');
    }
}
