<?php
require_once __DIR__ . '/helpers.php';
$userId = require_login();
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = db()->prepare('SELECT id, emotion, note, created_at FROM emotion_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
  $stmt->execute([$userId]);
  json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
}
$data = request_json();
$emotion = trim((string) ($data['emotion'] ?? ''));
$note = trim((string) ($data['note'] ?? ''));
if ($emotion === '' || strlen($emotion) > 30 || strlen($note) > 500) json_response(['ok' => false, 'message' => 'Registro inválido.'], 422);
$stmt = db()->prepare('INSERT INTO emotion_entries (user_id, emotion, note) VALUES (?, ?, ?)');
$stmt->execute([$userId, $emotion, $note !== '' ? $note : null]);
json_response(['ok' => true, 'id' => db()->lastInsertId()]);
