<?php
$conn = new mysqli("localhost", "root", "");

if ($conn->connect_error) {
    die("Connection failed");
}

// Create database if not exists
$conn->query("CREATE DATABASE IF NOT EXISTS smart_parking");

$conn->select_db("smart_parking");

// Create table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle VARCHAR(50),
    floor INT,
    duration INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$vehicle = $_POST['vehicle'];
$floor = $_POST['floor'];
$duration = $_POST['duration'];

$conn->query("INSERT INTO bookings (vehicle, floor, duration)
              VALUES ('$vehicle', '$floor', '$duration')");

echo "✅ Booking Saved Successfully!";
?>