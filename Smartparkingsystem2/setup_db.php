<?php
require_once 'db.php';

// Drop and create tables if needed
$pdo->exec("DROP TABLE IF EXISTS parking_slots");
$pdo->exec("DROP TABLE IF EXISTS bookings");

$pdo->exec("CREATE TABLE parking_slots (
    slot_id INT PRIMARY KEY,
    floor INT NOT NULL,
    status ENUM('available','occupied') DEFAULT 'available',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$pdo->exec("CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle VARCHAR(20) NOT NULL,
    floor INT NOT NULL,
    duration INT NOT NULL,
    user_type ENUM('Normal','Monthly','Yearly') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    slot_id INT DEFAULT NULL,
    qr_code TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Insert 50 slots
for ($floor = 1; $floor <= 5; $floor++) {
    for ($slot = 1; $slot <= 10; $slot++) {
        $slot_id = ($floor - 1) * 10 + $slot;
        $pdo->exec("INSERT INTO parking_slots (slot_id, floor, status) VALUES ($slot_id, $floor, 'available')");
    }
}

$pdo->exec("DELETE FROM bookings");

echo "Database setup complete!";
?>s