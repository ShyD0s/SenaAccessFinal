<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Código de Recuperación de Contraseña</title>
    <style>
        body {
            font-family: 'Inter', Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            padding: 20px;
            text-align: center;
        }
        .header {
            background-color: #00875A;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            color: #ffffff;
            margin: -20px -20px 20px -20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .code-box {
            background-color: #f8f9fa;
            border: 2px dashed #00875A;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #00875A;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SENA Acces</h1>
        </div>
        <div class="content">
            <h2>Recuperación de Contraseña</h2>
            <p>Hola,</p>
            <p>Has solicitado restablecer tu contraseña. Utiliza el siguiente código de recuperación para continuar:</p>
            
            <div class="code-box">
                {{ $code }}
            </div>
            
            <p>Si no fuiste tú quien solicitó este cambio, por favor ignora este correo.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} SENA Acces. Todos los derechos reservados.
        </div>
    </div>
</body>
</html>
