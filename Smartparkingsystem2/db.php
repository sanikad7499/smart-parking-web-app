<?php
// db.php — just connect
$host = "127.0.0.1";
$port = 3307;  // change if needed
$dbname = "smart_parking";
$username = "root";
$password = "";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(['error' => true, 'message' => "Database connection failed: " . $e->getMessage()]));
}
?>