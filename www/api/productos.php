<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $db = getConexion();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {
    switch ($method) {
        case 'GET':
            if ($id) {
                $select = $db->select('productos', '*');
                $select->where('id', '=', $id);
                $res = $select->execute();

                if (count($res) === 0) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Producto no encontrado']);
                    exit;
                }

                echo json_encode(['success' => true, 'data' => $res[0]], JSON_UNESCAPED_UNICODE);
            } else {
                $select = $db->select('productos', '*');
                $data = $select->execute();
                echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
            }
            break;

        case 'POST':
            // Crear producto
            $required = ['codigo', 'nombre', 'descripcion', 'precio', 'cantidad'];
            foreach ($required as $f) {
                if (!isset($input[$f])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => "Falta campo: $f"]);
                    exit;
                }
            }

            $ins = $db->insert('productos', 'codigo,nombre,descripcion,precio,cantidad');
            $ins->value($input['codigo']);
            $ins->value($input['nombre']);
            $ins->value($input['descripcion']);
            $ins->value($input['precio']);
            $ins->value($input['cantidad']);

            $rows = $ins->execute();

            $newId = $db->lastInsertId();

            echo json_encode(['success' => true, 'inserted' => (int)$rows, 'id' => $newId], JSON_UNESCAPED_UNICODE);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Se requiere id en la query string']);
                exit;
            }

            $allowed = ['codigo', 'nombre', 'descripcion', 'precio', 'cantidad'];
            $update = $db->update('productos');
            $setCount = 0;

            foreach ($allowed as $f) {
                if (isset($input[$f])) {
                    $update->set($f, $input[$f]);
                    $setCount++;
                }
            }

            if ($setCount === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No hay campos para actualizar']);
                exit;
            }

            $update->where('id', '=', $id);
            $affected = $update->execute();

            echo json_encode(['success' => true, 'updated' => (int)$affected], JSON_UNESCAPED_UNICODE);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Se requiere id en la query string']);
                exit;
            }

            $del = $db->delete('productos');
            $del->where('id', '=', $id);
            $affected = $del->execute();

            echo json_encode(['success' => true, 'deleted' => (int)$affected], JSON_UNESCAPED_UNICODE);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
