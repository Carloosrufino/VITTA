<?php
require_once __DIR__ . '/helpers.php';
$data = request_json();
$username = clean_username($data['username'] ?? '');
$password = (string) ($data['password'] ?? '');
if (!preg_match('/^[A-Za-z0-9_]{3,40}$/', $username)) json_response(['ok' => false, 'message' => 'Use um usuário com 3 a 40 letras, números ou _.'], 422);
if (strlen($password) < 4) json_response(['ok' => false, 'message' => 'A senha precisa ter pelo menos 4 caracteres.'], 422);
try {
  $stmt = db()->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
  start_vitta_session();
  $_SESSION['user_id'] = (int) db()->lastInsertId();
  $_SESSION['username'] = $username;
  json_response(['ok' => true, 'user' => ['username' => $username]]);
} catch (PDOException $error) {
  if ((int) $error->errorInfo[1] === 1062) json_response(['ok' => false, 'message' => 'Este usuário já existe.'], 409);
  json_response(['ok' => false, 'message' => 'Não foi possível criar o usuário.'], 500);
}
