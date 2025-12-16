-- Вставка вакансий (все на русском, как и требовалось для БД)
-- Используем user_id = 1 как работодателя (или замените на актуальный ID)

INSERT INTO jobs (title, description, salary_min, salary_max, currency, location, employer_id, created_at, is_active) VALUES
('Грузчик на склад', 'Погрузка и разгрузка товаров, перемещение грузов по складу. Требуется физическая выносливость.', 45000, 60000, 'RUB', 'Москва', 1, NOW(), TRUE),
('Уборщик помещений', 'Влажная и сухая уборка офисных помещений. График 5/2.', 35000, 45000, 'RUB', 'Санкт-Петербург', 1, NOW(), TRUE),
('Курьер пеший', 'Доставка документов и малогабаритных грузов по городу. Оплата проезда.', 50000, 70000, 'RUB', 'Москва', 1, NOW(), TRUE),
('Водитель такси', 'Перевозка пассажиров. Стаж вождения от 3 лет. Автомобиль компании или свой.', 80000, 120000, 'RUB', 'Казань', 1, NOW(), TRUE),
('Повар в столовую', 'Приготовление горячих и холодных блюд по техкартам. Опыт работы желателен.', 55000, 75000, 'RUB', 'Екатеринбург', 1, NOW(), TRUE),
('Разнорабочий на стройку', 'Помощь мастерам, вынос мусора, замешивание растворов. Проживание предоставляется.', 60000, 90000, 'RUB', 'Сочи', 1, NOW(), TRUE),
('Кассир в супермаркет', 'Обслуживание покупателей на кассе, выкладка товара в прикассовой зоне.', 40000, 55000, 'RUB', 'Новосибирск', 1, NOW(), TRUE),
('Швея на производство', 'Пошив спецодежды. Работа на профессиональном оборудовании.', 50000, 80000, 'RUB', 'Иваново', 1, NOW(), TRUE),
('Официант', 'Обслуживание гостей ресторана, прием заказов, подача блюд.', 45000, 80000, 'RUB', 'Москва', 1, NOW(), TRUE),
('Дворник', 'Уборка придомовой территории, чистка снега зимой.', 30000, 40000, 'RUB', 'Самара', 1, NOW(), TRUE);

-- Создаем таблицу job_skills если ее нет (проверка структуры)
CREATE TABLE IF NOT EXISTS job_skills (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL
);

-- Очистка старых навыков, если они были (для идемпотентности, хотя мы и удалили вакансии)
DELETE FROM job_skills;

-- Вставка навыков для созданных вакансий
-- Предполагаем, что ID вакансий идут последовательно, так как мы только что очистили таблицу.
-- Но для надежности лучше использовать подзапросы, но для простоты скрипта и так как таблица была пуста,
-- мы можем рассчитывать на то, что ID будут новыми. 
-- Однако, PostgreSQL не сбрасывает sequence при DELETE.
-- Поэтому правильнее будет найти ID по названию.

-- Грузчик (1)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Физическая сила' FROM jobs WHERE title = 'Грузчик на склад';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Ответственность' FROM jobs WHERE title = 'Грузчик на склад';

-- Уборщик (2)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Аккуратность' FROM jobs WHERE title = 'Уборщик помещений';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Пунктуальность' FROM jobs WHERE title = 'Уборщик помещений';

-- Курьер (3)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Знание города' FROM jobs WHERE title = 'Курьер пеший';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Быстрота' FROM jobs WHERE title = 'Курьер пеший';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Навигатор' FROM jobs WHERE title = 'Курьер пеший';

-- Водитель (4)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Водительские права B' FROM jobs WHERE title = 'Водитель такси';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Стаж вождения 3+' FROM jobs WHERE title = 'Водитель такси';

-- Повар (5)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Санкнижка' FROM jobs WHERE title = 'Повар в столовую';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Готовка' FROM jobs WHERE title = 'Повар в столовую';

-- Разнорабочий (6)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Выносливость' FROM jobs WHERE title = 'Разнорабочий на стройку';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Без опыта' FROM jobs WHERE title = 'Разнорабочий на стройку';

-- Кассир (7)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Внимательность' FROM jobs WHERE title = 'Кассир в супермаркет';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Обучаемость' FROM jobs WHERE title = 'Кассир в супермаркет';

-- Швея (8)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Шитье' FROM jobs WHERE title = 'Швея на производство';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Опыт 1 год' FROM jobs WHERE title = 'Швея на производство';

-- Официант (9)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Вежливость' FROM jobs WHERE title = 'Официант';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Русский язык' FROM jobs WHERE title = 'Официант';

-- Дворник (10)
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Трудолюбие' FROM jobs WHERE title = 'Дворник';
INSERT INTO job_skills (job_id, skill_name) 
SELECT id, 'Без вредных привычек' FROM jobs WHERE title = 'Дворник';
