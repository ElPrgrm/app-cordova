<?php
require_once __DIR__ . '/conector.php';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $db = getConexion();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$codigo = isset($_GET['codigo']) ? trim($_GET['codigo']) : null;
$modeEdit = isset($_GET['modeEdit']) ? trim($_GET['modeEdit']) : null;
$modeAdd = isset($_GET['modeAdd']) ? trim($_GET['modeAdd']) : null;

if (!$codigo && $modeEdit) {
    $codigo = $modeEdit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {

    switch ($method) {

        // =========================
        // GET
        // =========================
        case 'GET':

            if ($id) {

                $select = $db->select('productos');
                $select->where('id', '=', $id);

                $rows = $select->execute();

                if (empty($rows)) {
                    http_response_code(404);

                    echo json_encode([
                        'success' => false,
                        'error' => 'Producto no encontrado'
                    ]);
                    exit;
                }

                echo json_encode([
                    'success' => true,
                    'data' => $rows[0]
                ], JSON_UNESCAPED_UNICODE);

            } elseif ($codigo) {

                $select = $db->select('productos');
                $select->where('id', '=', $codigo);

                $rows = $select->execute();

                if (empty($rows)) {
                    http_response_code(404);

                    echo json_encode([
                        'success' => false,
                        'error' => 'Producto no encontrado'
                    ]);
                    exit;
                }

                echo json_encode([
                    'success' => true,
                    'data' => $rows[0]
                ], JSON_UNESCAPED_UNICODE);

            } else {

                $select = $db->select('productos');
                $all = $select->execute();

                echo json_encode([
                    'success' => true,
                    'data' => $all
                ], JSON_UNESCAPED_UNICODE);
            }

        break;


        // =========================
        // POST
        // =========================
        case 'POST':

            // Verificar que venga codigo
            if (!isset($input['id']) || $input['id'] === '') {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'Falta campo: codigo'
                ]);

                exit;
            }

            $codigo = $input['id'];

            // Buscar producto existente
            $buscar = $db->select('productos');
            $buscar->where('id', '=', $codigo);

            $resultado = $buscar->execute();

            // =====================================
            // SI EL PRODUCTO YA EXISTE
            // =====================================
            if (!empty($resultado)) {

                $producto = $resultado[0];

                $nuevaCantidad = intval($producto['cantidad']) + 1;

                $update = $db->update('productos');

                $update->set('cantidad', $nuevaCantidad);

                $update->where('id', '=', $codigo);

                $update->execute();

                echo json_encode([
                    'success' => true,
                    'status' => 'existe',
                    'mensaje' => 'Cantidad actualizada',
                    'producto' => $producto['nombre'],
                    'nueva_cantidad' => $nuevaCantidad
                ], JSON_UNESCAPED_UNICODE);

                exit;
            }

            // =====================================
            // SI NO EXISTE
            // =====================================

            // Si solo mandaron codigo
            $required = ['id','nombre', 'descripcion', 'precio', 'cantidad'];

            $faltanCampos = false;

            foreach ($required as $field) {
                if (!isset($input[$field]) || $input[$field] === '') {
                    $faltanCampos = true;
                }
            }

            // Respuesta para frontend
            if ($faltanCampos) {

                echo json_encode([
                    'success' => true,
                    'status' => 'nuevo',
                    'mensaje' => 'Producto no existe, registrar producto'
                ], JSON_UNESCAPED_UNICODE);

                exit;
            }

            // Crear producto nuevo
            $insert = $db->insert(
                'productos',
                'id,nombre,descripcion,precio,cantidad'
            );

            $insert->value($input['id']);
            $insert->value($input['nombre']);
            $insert->value($input['descripcion']);
            $insert->value($input['precio']);
            $insert->value($input['cantidad']);

            $insert->execute();


            echo json_encode([
                'success' => true,
                'status' => 'registrado',
                'mensaje' => 'Producto registrado correctamente'
            ], JSON_UNESCAPED_UNICODE);

        break;


        // =========================
        // PUT
        // =========================
        case 'PUT':

            if (!$id ) {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere iden la query string'
                ]);

                exit;
            }

            $allowed = [
                'nombre',
                'descripcion',
                'precio',
                'cantidad'
            ];

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

                echo json_encode([
                    'success' => false,
                    'error' => 'No hay campos para actualizar'
                ]);

                exit;
            }

            if ($id) {
                $update->where('id', '=', $id);
            }

            $affected = $update->execute();

            echo json_encode([
                'success' => true,
                'updated' => (int)$affected
            ], JSON_UNESCAPED_UNICODE);

        break;


        // =========================
        // DELETE
        // =========================
        case 'DELETE':

            if (!$id) {

                http_response_code(400);

                echo json_encode([
                    'success' => false,
                    'error' => 'Se requiere id en la query string'
                ]);

                exit;
            }

            $del = $db->delete('productos');

            $del->where('id', '=', $id);

            $affected = $del->execute();

            echo json_encode([
                'success' => true,
                'deleted' => (int)$affected
            ], JSON_UNESCAPED_UNICODE);

        break;


        default:

            http_response_code(405);

            echo json_encode([
                'success' => false,
                'error' => 'Método no permitido'
            ]);

        break;
    }

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>