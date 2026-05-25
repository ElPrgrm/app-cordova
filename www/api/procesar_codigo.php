<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Content-Type: application/json; charset=utf-8');


$host = '127.0.0.1';
$db   = 'tiendita';
$user = 'root'; 
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Verificamos que se haya enviado el código
    if (isset($_POST['codigo'])) {
        $codigo = $_POST['codigo'];

        // 1. Buscar si el producto ya existe
        $stmt = $pdo->prepare("SELECT id, cantidad FROM productos WHERE codigo = ?");
        $stmt->execute([$codigo]);
        $producto = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($producto) {
            // 2. Si existe, sumamos 1 a la cantidad
            $nuevaCantidad = $producto['cantidad'] + 1;
            $updateStmt = $pdo->prepare("UPDATE productos SET cantidad = ? WHERE codigo = ?");
            $updateStmt->execute([$nuevaCantidad, $codigo]);
            
            echo json_encode([
                'status' => 'existe', 
                'mensaje' => 'Cantidad actualizada',
                'nueva_cantidad' => $nuevaCantidad
            ]);
        } else {
            // 3. Si no existe, avisamos al frontend
            echo json_encode([
                'status' => 'nuevo'
            ]);
        }
    } else {
        echo json_encode(['error' => 'No se recibió ningún código.']);
    }

} catch(PDOException $e) {
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
}
?>