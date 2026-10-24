-- Execute uma vez no banco atual do VITTA (por exemplo, pelo phpMyAdmin).
-- A tabela nova fica vinculada aos usuários existentes e não altera seus dados atuais.
CREATE TABLE IF NOT EXISTS food_diary_entries (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  meal_category VARCHAR(32) NOT NULL,
  food_description VARCHAR(1000) NOT NULL,
  meal_date DATE NOT NULL,
  meal_time TIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_food_diary_user_date (user_id, meal_date),
  CONSTRAINT fk_food_diary_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
