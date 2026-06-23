<?php
require_once __DIR__ . '/conector.php';
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function generateUuidV4()
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$action = strtolower(trim($input['action'] ?? 'login'));
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');
$uuid = trim($input['uuid'] ?? '');

/**
 * Crea un usuario en la base de datos.
 * Retorna un array con keys: success (bool), code (int, opcional), message/error y user (opcional).
 */
function createUser($db, $username, $password, $uuid = '') {
    if ($username === '' || $password === '') {
        return ['success' => false, 'code' => 400, 'error' => 'Debes enviar usuario y contraseña para el registro.'];
    }

    if ($uuid === '') {
        $uuid = generateUuidV4();
    }

    // comprobar existencia
    $existing = $db->select('usuarios');
    $existing->where('username', '=', $username);
    $rows = $existing->execute();

    if (!empty($rows)) {
        return ['success' => false, 'code' => 409, 'error' => 'El nombre de usuario ya existe.'];
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $insert = $db->insert('usuarios', 'uuid,username,password');
    $insert->value($uuid);
    $insert->value($username);
    $insert->value($hashedPassword);
    $insert->execute();

    return [
        'success' => true,
        'message' => 'Usuario registrado correctamente.',
        'user' => [ 'uuid' => $uuid, 'username' => $username ]
    ];
}

if ($action === 'register') {
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
        $res = createUser($db, $username, $password, $uuid);
        if (!$res['success']) {
            $code = $res['code'] ?? 400;
            http_response_code($code);
            echo json_encode([
                'success' => false,
                'error' => $res['error']
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => $res['message'],
            'user' => $res['user']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error interno: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Debes enviar usuario y contrase���a.'
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
    $select->where('username', '=', $username);
    $rows = $select->execute();

    if (empty($rows)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Usuario o contrase���a incorrectos.'
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
            'error' => 'Usuario o contrase���a incorrectos.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Inicio de sesión exitoso.',
        'user' => [
            'id' => intval($user['id']),
            'uuid' => $user['uuid'] ?? null,
            'username' => $user['username']
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor.'
    ], JSON_UNESCAPED_UNICODE);
}
