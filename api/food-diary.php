<?php
require_once __DIR__ . '/helpers.php';
$userId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = db()->prepare('SELECT id, meal_category AS category, food_description AS description, meal_date AS date, meal_time AS time FROM food_diary_entries WHERE user_id = ? ORDER BY meal_date DESC, meal_time DESC, id DESC LIMIT 100');
  $stmt->execute([$userId]);
  json_response(['ok' => true, 'items' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
  $data = request_json();
  $stmt = db()->prepare('DELETE FROM food_diary_entries WHERE id = ? AND user_id = ?');
  $stmt->execute([(int) ($data['id'] ?? 0), $userId]);
  json_response(['ok' => true]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  json_response(['ok' => false, 'message' => 'Método não permitido.'], 405);
}

$data = request_json();
$category = trim((string) ($data['category'] ?? ''));
$description = trim((string) ($data['description'] ?? ''));
$date = trim((string) ($data['date'] ?? ''));
$time = trim((string) ($data['time'] ?? ''));
$allowedCategories = ['cafe_da_manha', 'lanche_da_manha', 'almoco', 'lanche_da_tarde', 'jantar', 'ceia', 'outro'];
$dateParts = [];
if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $dateParts)) {
  $validDate = checkdate((int) $dateParts[2], (int) $dateParts[3], (int) $dateParts[1]);
} else {
  $validDate = false;
}
$validTime = $time === '' || preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time);
if (!in_array($category, $allowedCategories, true) || $description === '' || strlen($description) > 4000 || !$validDate || !$validTime) {
  json_response(['ok' => false, 'message' => 'Confira a refeição, a descrição, a data e o horário.'], 422);
}

$stmt = db()->prepare('INSERT INTO food_diary_entries (user_id, meal_category, food_description, meal_date, meal_time) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$userId, $category, $description, $date, $time !== '' ? $time : null]);
json_response(['ok' => true, 'id' => db()->lastInsertId()]);
