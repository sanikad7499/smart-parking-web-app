<?php
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? $input['action'] ?? '';

if ($action === 'clear') {
    try {
        $pdo->exec("DELETE FROM bookings");
        $pdo->exec("UPDATE parking_slots SET status = 'available'");
        echo json_encode(['success' => true, 'message' => 'All records cleared']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// Validate input
if (!$input || empty(trim($input['vehicle'] ?? ''))) {
    echo json_encode(['success' => false, 'message' => 'Vehicle number required']);
    exit;
}

try {
    // Sanitize inputs
    $vehicle = trim(strtoupper($input['vehicle']));
    $floor = (int)($input['floor'] ?? 1);
    $duration = max(1, min(24, (int)($input['duration'] ?? 1)));
    $userType = in_array($input['user_type'] ?? '', ['Normal', 'Monthly', 'Yearly']) 
        ? $input['user_type'] : 'Normal';

    // Calculate pricing
    $baseRate = 20.0;
    $rate = $baseRate;
    if ($userType === 'Monthly') $rate *= 0.7;
    elseif ($userType === 'Yearly') $rate *= 0.5;
    $amount = round($rate * $duration, 2);

    // Find available slot on floor
    $stmt = $pdo->prepare("SELECT slot_id FROM parking_slots WHERE floor = ? AND status = 'available' LIMIT 1");
    $stmt->execute([$floor]);
    $slot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot) {
        echo json_encode(['success' => false, 'message' => "No slots available on Floor $floor"]);
        exit;
    }

    $slotId = $slot['slot_id'];

    // QR data
    $qrData = json_encode([
        'booking_id' => 0,
        'vehicle' => $vehicle,
        'floor' => $floor,
        'slot_id' => $slotId,
        'duration' => $duration,
        'amount' => $amount,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    // Insert booking
    $stmt = $pdo->prepare("
        INSERT INTO bookings (vehicle, floor, duration, user_type, amount, slot_id, qr_code) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$vehicle, $floor, $duration, $userType, $amount, $slotId, $qrData]);
    $bookingId = $pdo->lastInsertId();

    // Update QR with real booking ID
    $qrData = json_encode(array_merge(json_decode($qrData, true), ['booking_id' => $bookingId]));
    $stmt = $pdo->prepare("UPDATE bookings SET qr_code = ? WHERE id = ?");
    $stmt->execute([$qrData, $bookingId]);

    // Mark slot occupied
    $stmt = $pdo->prepare("UPDATE parking_slots SET status = 'occupied' WHERE slot_id = ?");
    $stmt->execute([$slotId]);

    echo json_encode([
        'success' => true,
        'message' => 'Booking created successfully',
        'bookingId' => $bookingId,
        'slotId' => $slotId,
        'amount' => number_format($amount, 2),
        'qrData' => $qrData,
        'vehicle' => $vehicle
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage(),
        'debug' => $input // Remove in production
    ]);
}
?>