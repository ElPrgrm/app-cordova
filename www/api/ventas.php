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
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

try {
    switch ($method) {
        case 'GET':
            // Recuperar historial de ventas (últimos 7 días por defecto)
            $dias = isset($_GET['dias']) ? intval($_GET['dias']) : 7;
            
            $select = $db->select('ventas', '*');
            $select->where('fecha', '>=', date('Y-m-d H:i:s', strtotime("-$dias days")));
            $select->orderby('fecha DESC');
            $ventas = $select->execute();

            // Para cada venta, obtener los detalles
            $result = [];
            foreach ($ventas as $venta) {
                $selectDet = $db->select('detalles_venta', '*');
                $selectDet->where('venta_id', '=', $venta['id']);
                $detalles = $selectDet->execute();

                $result[] = [
                    'id' => $venta['id'],
                    'fecha' => $venta['fecha'],
                    'total' => floatval($venta['total']),
                    'estado' => $venta['estado'],
                    'items' => count($detalles),
                    'detalles' => $detalles
                ];
            }

            echo json_encode(['success' => true, 'data' => $result], JSON_UNESCAPED_UNICODE);
            break;

        case 'POST':
            // Crear nueva venta
            if (!isset($input['items']) || !is_array($input['items'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Se requiere un array de items']);
                exit;
            }

            if (count($input['items']) === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No hay items en la venta']);
                exit;
            }

            $total = 0;
            foreach ($input['items'] as $item) {
                $total += floatval($item['subtotal']);
            }

            // Insertar venta
            $ins = $db->insert('ventas', 'fecha,total,estado');
            $ins->value(date('Y-m-d H:i:s'));
            $ins->value($total);
            $ins->value('completada');
            $ins->execute();

            $ventaId = $db->lastInsertId();

            // Insertar detalles de venta
            foreach ($input['items'] as $item) {
                $insDet = $db->insert('detalles_venta', 'venta_id,producto_id,cantidad,precio_unitario,subtotal');
                $insDet->value($ventaId);
                $insDet->value($item['producto_id']);
                $insDet->value($item['cantidad']);
                $insDet->value($item['precio_unitario']);
                $insDet->value($item['subtotal']);
                $insDet->execute();
            }

            echo json_encode([
                'success' => true,
                'venta_id' => (int)$ventaId,
                'total' => $total,
                'items_count' => count($input['items'])
            ], JSON_UNESCAPED_UNICODE);
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
