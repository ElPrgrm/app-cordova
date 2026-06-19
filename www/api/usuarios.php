<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$username = trim($input['name'] ?? '');
$password = trim($input['password'] ?? '');

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Debes enviar usuario y contraseña.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = getConexion();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'No se pudo conectar a la base de datos.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $select = $db->select('usuarios');
    $select->where('name', '=', $username);
    $rows = $select->execute();

    if (empty($rows)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Usuario o contraseña incorrectos.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $user = $rows[0];
    $storedPassword = $user['password'];
    $passwordValid = false;

    if ($storedPassword !== '') {
        if (password_verify($password, $storedPassword)) {
            $passwordValid = true;
        } elseif ($storedPassword === $password) {
            $passwordValid = true;
        }
    }

    if (!$passwordValid) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Usuario o contraseña incorrectos.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $token = bin2hex(random_bytes(16));
    $update = $db->update('usuarios');
    $update->set('token', $token);
    $update->where('id', '=', $user['id']);
    $update->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Inicio de sesión exitoso.',
        'user' => [
            'id' => intval($user['id']),
            'name' => $user['name']
        ],
        'token' => $token
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor.'
    ], JSON_UNESCAPED_UNICODE);
}
