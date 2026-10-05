<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ChatbotController extends Controller
{
    /**
     * Procesa un mensaje del chatbot usando la API de Gemini.
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
            'history' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $apiKey = config('services.gemini.api_key');

        if (!$apiKey) {
            return response()->json(['error' => 'Servicio de IA no configurado.'], 503);
        }

        // ─── Prompt de sistema: contexto de SenaAccess ───────────────────────
        $systemInstruction = <<<EOT
Eres el asistente virtual de SenaAccess, el sistema de control de acceso del SENA (Servicio Nacional de Aprendizaje de Colombia).

Tu función es ayudar a usuarios (Aprendices, Instructores y Administradores) con preguntas sobre el sistema.

CONOCIMIENTO DEL SISTEMA:
- SenaAccess controla el acceso a instalaciones del SENA mediante QR, huella digital y carnet digital.
- Roles de usuario: Aprendiz, Instructor, Funcionario, Invitado y Administrador.
- Cualquier aprendiz puede crear una cuenta y hacer login con esta, esto presienando el boton de "Registrarse aqui", debajo del boton de "Iniciar Sesión" en la pagina principal.
- Una persona que no pertenece al SENA y quiere entrar a las instalaciones del SENA, puede hacerlo por la opcion de invitado, esto presienando el boton de "Registrarse aqui", debajo del boton de "Iniciar Sesión" en la pagina principal.
- Los Instructores y Administradores pueden ver todos los ingresos y gestionar usuarios.
- Los Administradores pueden crear, editar y eliminar usuarios y equipos.
- El registro de equipos (portátiles, tablets, etc.) requiere: tipo, marca, modelo, color y serial.
- Los ingresos se registran automáticamente al hacer login.
- El acceso con QR genera un carnet digital descargable.
- Para recuperar contraseña, el usuario recibe un código de 8 caracteres en su correo.
- El sistema está desplegado en Railway y usa MySQL como base de datos.
- El correo de soporte es: soporte@senaaccess.dev

REGLAS DE COMPORTAMIENTO:
- Responde SIEMPRE en español.
- Sé amable, conciso y profesional.
- Si la pregunta no es sobre SenaAccess o el SENA, responde que solo puedes ayudar con temas del sistema.
- Nunca reveles información sensible como contraseñas, tokens o datos privados.
- Si no sabes algo, indica al usuario que contacte soporte en soporte@senaaccess.dev.
- Usa un tono cercano y de apoyo, como un asistente del SENA.
- No uses emojis y usa markdown para negritas y cursivas.
EOT;

        // Construir el array de turnos del historial 
        $contents = [];

        $history = $request->input('history', []);
        foreach ($history as $turn) {
            if (isset($turn['role'], $turn['text'])) {
                $role = $turn['role'] === 'user' ? 'user' : 'model';
                $contents[] = [
                    'role'  => $role,
                    'parts' => [['text' => $turn['text']]],
                ];
            }
        }

        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $request->input('message')]],
        ];

        // Modelos primario y secundario para alta disponibilidad
        $models = [
            'gemini-3.8-flash',       // Modelo principal, pero uso muy volatil (alta precisión y rapidez)
            'gemini-3.5-flash-lite',  // Respaldo oficial (menor latencia y cuota independiente) 
        ];

        $payload = [
            'systemInstruction' => [
                'parts' => [['text' => $systemInstruction]],
            ],
            'contents'          => $contents,
            'generationConfig'  => [
                'temperature'     => 0.7,
                'maxOutputTokens' => 1024,
            ],
        ];

        $response = null;
        $lastError = 'Sin detalle';

        foreach ($models as $model) {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

            // Realiza hasta 3 reintentos separados por 500ms si la API retorna error 5xx (ej: 503)
            $response = Http::timeout(20)
                ->retry(3, 500, function ($exception, $request) {
                    return $exception->getCode() >= 500;
                }, throw: false)
                ->post("{$endpoint}?key={$apiKey}", $payload);

            // Manjeo de errores 
            if ($response->successful()) {
                break;
            }
   
            $lastError = $response->json('error.message', 'Error desconocido');
            Log::warning("Fallo en modelo Gemini {$model}", [
                'status'  => $response->status(),
                'message' => $lastError,
            ]);
        }

        // Manjeo de errores 502
        if (!$response || $response->failed()) {
            Log::error('Todos los modelos de Gemini fallaron', [
                'status'  => $response ? $response->status() : 500,
                'message' => $lastError,
            ]);

            return response()->json([
                'error' => 'El servicio de IA está experimentando alta demanda en este momento. Por favor intenta de nuevo.',
            ], 502);
        }

        $data  = $response->json();
        $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No pude generar una respuesta. Por favor intenta de nuevo.';

        return response()->json(['reply' => $reply]);
    }
}

