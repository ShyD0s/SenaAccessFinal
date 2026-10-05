<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class ChatbotController extends Controller
{
    /**
     * Procesa un mensaje del chatbot usando la API de Gemini.
     * El chatbot conoce el contexto de SenaAccess y responde preguntas sobre el sistema.
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message'  => 'required|string|max:1000',
            'history'  => 'nullable|array',
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
- Los Aprendices pueden ver su historial de ingresos y equipos registrados.
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
EOT;

        // ─── Construir el array de turnos del historial ───────────────────────
        $contents = [];

        // Agregar historial previo si existe
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

        // Agregar el mensaje actual del usuario
        $contents[] = [
            'role'  => 'user',
            'parts' => [['text' => $request->input('message')]],
        ];

        // ─── Llamada a la API de Gemini ───────────────────────────────────────
        $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';

        $response = Http::timeout(30)->post("{$endpoint}?key={$apiKey}", [
            'systemInstruction' => [
                'parts' => [['text' => $systemInstruction]],
            ],
            'contents'          => $contents,
            'generationConfig'  => [
                'temperature'     => 0.7,
                'maxOutputTokens' => 512,
            ],
        ]);

        if ($response->failed()) {
            return response()->json([
                'error' => 'Error al contactar el servicio de IA. Intenta de nuevo.',
            ], 502);
        }

        $data  = $response->json();
        $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No pude generar una respuesta. Por favor intenta de nuevo.';

        return response()->json(['reply' => $reply]);
    }
}
