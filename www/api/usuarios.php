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

if ($action === 'register') {
    if ($username === '' || $password === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Debes enviar usuario y contrase���a para el registro.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($uuid === '') {
        $uuid = generateUuidV4();
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
        $existing = $db->select('usuarios');
        $existing->where('username', '=', $username);
        $rows = $existing->execute();

        if (!empty($rows)) {
            http_response_code(409);
            echo json_encode([
                'success' => false,
                'error' => 'El nombre de usuario ya existe.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $insert = $db->insert('usuarios', 'uuid,username,password,token');
        $insert->value($uuid);
        $insert->value($username);
        $insert->value($hashedPassword);
        $insert->value('');
        $insert->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado correctamente.',
            'user' => [
                'uuid' => $uuid,
                'username' => $username
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error interno del servidor.'
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
        'message' => 'Inicio de sesi���n exitoso.',
        'user' => [
            'id' => intval($user['id']),
            'uuid' => $user['UUID'],
            'name' => $user['username']
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor.'
    ], JSON_UNESCAPED_UNICODE);
}