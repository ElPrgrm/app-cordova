<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');

try {
	// Configura aquí tus parámetros de conexión si es necesario
	$opts = [
		'tipo' => 'mysql',
		'servidor' => 'localhost',
		'bd' => 'prueba',
		'usuario' => 'root',
		'contrasena' => ''
	];

	$db = getConexion($opts);

	// Ejemplo: seleccionar todos los registros de la tabla 'users'
	$select = $db->select('users', '*');
	$data = $select->execute();

	echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

