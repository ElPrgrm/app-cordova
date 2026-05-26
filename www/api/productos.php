<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

// 2. Permitir los métodos HTTP que acepta tu API
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// 3. Permitir las cabeceras que el cliente intenta enviar (ej: Content-Type, Authorization)
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// 4. Si la petición actual es de tipo OPTIONS, responder y cortar la ejecución inmediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // 204 No Content es el estándar ideal para OPTIONS
    exit;
}
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
            // Si se recibe un id en la query string, devolver ese producto
            if ($id) {
                $select = $db->select('productos');
                $select->where('id', '=', $id);
                $rows = $select->execute();

                if (empty($rows)) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Producto no encontrado']);
                    exit;
                }

                // $rows es un arreglo de filas; tomar la primera
                $producto = $rows[0];

                echo json_encode(['success' => true, 'data' => $producto], JSON_UNESCAPED_UNICODE);
                break;
            }

            // Si no se indica id, devolver la lista completa
            $select = $db->select('productos');
            $all = $select->execute();
            echo json_encode(['success' => true, 'data' => $all], JSON_UNESCAPED_UNICODE);
            break;
        case 'POST':
            // Si se recibe solo el código, procesamos el escaneo y actualizamos cantidad.
            if (isset($input['codigo'])
                && !isset($input['nombre'])
                && !isset($input['descripcion'])
                && !isset($input['precio'])
                && !isset($input['cantidad'])) {

                $codigo = $input['codigo'];
                $select = $db->select('productos');
                $select->where('codigo', '=', $codigo);
                $rows = $select->execute();
                $producto = $rows[0] ?? null;

                if ($producto) {
                    $nuevaCantidad = $producto['cantidad'] + 1;
                    $update = $db->update('productos');
                    $update->set('cantidad', $nuevaCantidad);
                    $update->where('codigo', '=', $codigo);
                    $update->execute();

                    echo json_encode([
                        'status' => 'existe',
                        'mensaje' => 'Cantidad actualizada',
                        'nueva_cantidad' => $nuevaCantidad
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode(['status' => 'nuevo'], JSON_UNESCAPED_UNICODE);
                }

                break;
            }

            $required = ['codigo', 'nombre', 'descripcion', 'precio', 'cantidad'];
            foreach ($required as $field) {
                if (!isset($input[$field]) || $input[$field] === '') {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => "Falta campo: $field"]);
                    exit;
                }
            }

            $insert = $db->insert('productos', 'codigo,nombre,descripcion,precio,cantidad');
            $insert->value($input['codigo']);
            $insert->value($input['nombre']);
            $insert->value($input['descripcion']);
            $insert->value($input['precio']);
            $insert->value($input['cantidad']);

            $rows = $insert->execute();
            $newId = $db->lastInsertId();

            echo json_encode(['success' => true, 'inserted' => (int)$rows, 'id' => (int)$newId], JSON_UNESCAPED_UNICODE);
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

            foreach ($allowed as $field) {
                if (array_key_exists($field, $input)) {
                    $update->set($field, $input[$field]);
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
?>