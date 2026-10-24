<?php
require_once __DIR__ . '/helpers.php';
start_vitta_session();
json_response(['ok' => true, 'user' => !empty($_SESSION['user_id']) ? ['username' => $_SESSION['username']] : null]);
