<?php
header('Content-Type: application/json');
require_once 'db.php';

$action = $_GET['action'] ?? '';

try {
    switch($action) {
        case 'dashboard':
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings");
            $totalBookings = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            $stmt = $pdo->query("SELECT SUM(amount) as revenue FROM bookings");
            $totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['revenue'] ?? 0;

            $stmt = $pdo->query("SELECT COUNT(*) as occupied FROM parking_slots WHERE status='occupied'");
            $occupiedSlots = $stmt->fetch(PDO::FETCH_ASSOC)['occupied'];

            $availableSlots = 50 - $occupiedSlots;

            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5");
            $recentBookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'availableSlots'=>$availableSlots,
                'occupiedSlots'=>$occupiedSlots,
                'totalRevenue'=>number_format($totalRevenue,2),
                'totalBookings'=>$totalBookings,
                'recentBookings'=>$recentBookings
            ]);
            break;

        case 'slots':
            $floor = $_GET['floor'] ?? 1;
            $stmt = $pdo->prepare("SELECT * FROM parking_slots WHERE floor=? ORDER BY slot_id");
            $stmt->execute([$floor]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'admin':
            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY created_at DESC");
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $stmt = $pdo->query("SELECT SUM(amount) as total FROM bookings");
            $totalRevenue = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

            echo json_encode([
                'bookings'=>$bookings,
                'totalRevenue'=>number_format($totalRevenue,2)
            ]);
            break;

        default:
            echo json_encode(['error'=>'Invalid action']);
    }
} catch(PDOException $e) {
    echo json_encode(['error'=>true, 'message'=>$e->getMessage()]);
}
?>