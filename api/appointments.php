<?php
require_once __DIR__ . '/helpers.php';
$userId = require_login();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = db()->prepare('SELECT id, title, appointment_date AS date, appointment_time AS time FROM appointments WHERE user_id = ? ORDER BY appointment_date, appointment_time LIMIT 100');
  $stmt->execute([$userId]);
  json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = request_json();
  $stmt = db()->prepare('DELETE FROM appointments WHERE id = ? AND user_id = ?');
  $stmt->execute([(int) ($data['id'] ?? 0), $userId]);
  json_response(['ok' => true]);
}
$data = request_json();
$title = trim((string) ($data['title'] ?? ''));
$date = trim((string) ($data['date'] ?? ''));
$time = trim((string) ($data['time'] ?? ''));
if ($title === '' || strlen($title) > 120 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) json_response(['ok' => false, 'message' => 'Lembrete inválido.'], 422);
$stmt = db()->prepare('INSERT INTO appointments (user_id, title, appointment_date, appointment_time) VALUES (?, ?, ?, ?)');
$stmt->execute([$userId, $title, $date, $time !== '' ? $time : null]);
json_response(['ok' => true, 'id' => db()->lastInsertId()]);
