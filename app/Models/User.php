<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_identification',
        'user_name',
        'user_lastname',
        'user_email',
        'user_password',
        'user_coursenumber',
        'user_program',
        'fk_id_rol',
        'profile_photo_path',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'user_password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_password' => 'hashed',
    ];

    public function getAuthPassword()
    {
        return $this->user_password;
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'fk_id_rol', 'id_rol');
    }

    public function ingresos()
    {
        return $this->hasMany(Ingreso::class, 'fk_id_user', 'id_usuario');
    }

    public function ingreso_equipos()
    {
        return $this->hasMany(IngresoEquipo::class, 'fk_id_usuario', 'id_usuario');
    }

    public function Fingerprints()
    {
        return $this->hasMany(Fingerprint::class, 'fk_id_user', 'id_usuario');
    }
    
    public function novedades()
    {
        return $this->hasMany(Novedad::class, 'fk_id_usuario', 'id_usuario');
    }

    public function token_recovery()
    {
        return $this->hasMany(TokenRecovery::class, 'fk_id_usuario', 'id_usuario');
    }
    /**
     * Sube una imagen a Cloudinary y actualiza el campo profile_photo_path.
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @return string URL de la imagen subida
     */
    public function updateProfilePhoto($file)
    {
        $path = $file->storeOnCloudinary('avatars')->getSecurePath();
        $this->update(['profile_photo_path' => $path]);
        return $path;
    }
}



