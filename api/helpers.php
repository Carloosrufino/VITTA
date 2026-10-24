<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';

function start_vitta_session(): void {
  if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
  }
}

function db(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

function json_response(array $payload, int $status = 200): never {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

function request_json(): array {
  $body = json_decode(file_get_contents('php://input'), true);
  return is_array($body) ? $body : [];
}

function require_login(): int {
  start_vitta_session();
  if (empty($_SESSION['user_id'])) json_response(['ok' => false, 'message' => 'Faça login para continuar.'], 401);
  return (int) $_SESSION['user_id'];
}

function clean_username(mixed $value): string {
  return trim((string) $value);
}
