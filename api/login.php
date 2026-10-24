<?php
require_once __DIR__ . '/helpers.php';
$data = request_json();
$username = clean_username($data['username'] ?? '');
$password = (string) ($data['password'] ?? '');
$stmt = db()->prepare('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch();
if (!$user || !password_verify($password, $user['password_hash'])) json_response(['ok' => false, 'message' => 'Usuário ou senha incorretos.'], 401);
start_vitta_session();
session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['username'] = $user['username'];
json_response(['ok' => true, 'user' => ['username' => $user['username']]]);
