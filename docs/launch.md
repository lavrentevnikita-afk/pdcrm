````markdown
# Launch Guide — Print CRM

Этот гайд описывает, как развернуть и запустить CRM/ERP-систему для типографии  
(Backend: Node.js + Express + SQLite + Knex, Frontend: Vue 3 + Vite + Pinia + Vue Router).

---

## 1. Prerequisites

Перед началом убедитесь, что у вас установлено:

- **Node.js и npm**
  - Рекомендуется LTS-версия Node.js.
  - Проверка версий:
    ```bash
    node -v
    npm -v
    ```
  - Установка: https://nodejs.org/

- **Git** (если проект хранится в репозитории)
  - Проверка:
    ```bash
    git --version
    ```

- **SQLite3** (опционально — для работы с БД из консоли)
  - Проверка:
    ```bash
    sqlite3 --version
    ```

---

## 2. Структура проекта

Предполагаемая структура папок:

```text
pdcrm/
├── backend/
│   ├── package.json
│   ├── knexfile.js          # конфиг для Knex (SQLite)
│   ├── .env.example
│   └── src/
│       ├── server.js        # точка входа backend
│       ├── app.js           # конфигурация Express
│       ├── config/          # чтение .env, глобальные настройки
│       ├── db/
│       │   ├── connection.js
│       │   ├── migrations/  # миграции (users, orders, products и т.д.)
│       │   └── seeds/       # стартовые данные (11 пользователей и прочее)
│       ├── models/          # низкоуровневый доступ к БД через Knex
│       ├── services/        # бизнес-логика
│       ├── controllers/     # обработка req/res
│       ├── routes/          # REST-маршруты /api/...
│       ├── middleware/      # auth, permissions, error handler
│       └── utils/           # вспомогательные функции
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js          # точка входа фронта
│       ├── App.vue
│       ├── router/          # маршрутизация (login, dashboard, orders и т.д.)
│       ├── store/           # Pinia (authStore, uiStore, ordersStore...)
│       ├── api/             # Axios-клиенты к backend API
│       ├── views/           # страницы: DashboardView, OrdersView, CashView...
│       ├── components/      # общие компоненты, layout, карточки
│       └── assets/          # стили, шрифты, картинки
└── docs/
    ├── architecture.md      # архитектура приложения
    └── launch.md            # данный файл
````

---

## 3. Первичная настройка проекта

### 3.1. Клонирование репозитория

Если проект в GitHub:

```bash
git clone <URL-ВАШЕГО-РЕПОЗИТОРИЯ> pdcrm
cd pdcrm
```

Либо просто положите все файлы проекта в директорию `pdcrm`.

---

### 3.2. Настройка backend

Перейти в папку backend и установить зависимости:

```bash
cd backend
npm install
```

Создать файл окружения `.env` (из `.env.example`):

```bash
cp .env.example .env   # Linux/macOS
# В Windows можно просто скопировать .env.example вручную и переименовать в .env
```

Пример содержимого `.env`:

```env
NODE_ENV=development
PORT=3000
DB_PATH=./data/crm.sqlite
JWT_SECRET=super-secret-key
CORS_ORIGIN=http://localhost:5173
```

> **Важно:**
>
> * `PORT` — порт, на котором будет слушать backend (по умолчанию 3000).
> * `DB_PATH` — путь к файлу SQLite (будет создан автоматически при миграциях).
> * `CORS_ORIGIN` — адрес фронта в dev-режиме (обычно `http://localhost:5173`).

Выполнить миграции и сиды базы данных (через Knex):

```bash
# из папки backend
npx knex migrate:latest
npx knex seed:run
```

Миграции создадут все нужные таблицы (users, orders, products, warehouse и т.д.),
а сиды заполнят стартовыми данными (включая 11 сотрудников с ролями и кодами доступа).

---

### 3.3. Настройка frontend

Перейдите в папку `frontend` и установите зависимости:

```bash
cd ../frontend
npm install
```

При необходимости можно настроить базовый URL для API в `src/api/*` (например в общем Axios-инстансе):

```js
// пример: src/api/http.js
import axios from 'axios';

export const http = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: false,
});
```

Вернитесь в корень проекта при желании:

```bash
cd ..
```

---

## 4. Запуск в режиме разработки

Рекомендуется использовать **два терминала**: один для backend, второй для frontend.

### 4.1. Запуск backend (API-сервер)

В первом терминале:

```bash
cd path/to/pdcrm/backend
npm run dev
```

Обычно `npm run dev` запускает `nodemon src/server.js` и поднимает Express сервер
на порту, указанном в `.env` (по умолчанию `http://localhost:3000`).

Ожидаемое сообщение в консоли:

```text
Print CRM backend server running at http://localhost:3000
```

### 4.2. Запуск frontend (Vue-приложение)

Во втором терминале:

```bash
cd path/to/pdcrm/frontend
npm run dev
```

По умолчанию Vite запустит dev-сервер на:

```text
http://localhost:5173
```

Откройте этот адрес в браузере. Вы должны увидеть:

1. Экран авторизации по коду доступа.
2. После успешного входа — основное приложение:

   * слева — меню (Дэшборд, Заказы, Касса, Склад, Персонал, Аналитика, Справочники, Настройки, Разрешения);
   * сверху — хэдер с приветствием, именем, ролью и серыми кругами:

     * круг темы (переключатель светлая/тёмная),
     * круг уведомлений (колокольчик).

---

## 5. Сборка и запуск в продакшене

### 5.1. Сборка frontend

Из папки `frontend`:

```bash
npm run build
```

Vite соберёт статические файлы в `frontend/dist/`:

```text
frontend/
└── dist/
    ├── index.html
    ├── assets/
    └── ...
```

Дальше можно:

1. Раздавать `dist/` через отдельный веб-сервер (Nginx/Apache), **или**
2. Скопировать содержимое `dist/` в папку внутри backend (например, `backend/public/`) и раздавать через Express.

### 5.2. Настройка backend для раздачи фронта (опционально)

Если хотите, чтобы Express раздавал статический фронт:

1. Скопируйте содержимое `frontend/dist` в `backend/public` (папку можно назвать иначе):

   ```bash
   # пример (Linux/macOS), предварительно создайте backend/public
   cp -r ../frontend/dist/* ./public/
   ```

2. Добавьте в `backend/src/app.js` (после объявления API-маршрутов):

   ```js
   const path = require('path');
   const express = require('express');
   const app = express();

   // ... здесь подключаете middleware и API-маршруты /api/... ...

   const publicPath = path.join(__dirname, '..', 'public');
   app.use(express.static(publicPath));

   // Для client-side routing (Vue Router) — отдаём index.html на все остальные маршруты
   app.get('*', (req, res) => {
     res.sendFile(path.join(publicPath, 'index.html'));
   });

   module.exports = app;
   ```

3. В `.env` для продакшена:

   ```env
   NODE_ENV=production
   PORT=3000
   DB_PATH=./data/crm.sqlite
   JWT_SECRET=super-secret-key
   CORS_ORIGIN=http://localhost:3000
   ```

### 5.3. Запуск backend в продакшене

Из папки `backend`:

```bash
npm install --production
npm run start  # например, "node src/server.js"
```

Для постоянной работы на сервере можно использовать **pm2**:

```bash
npm install -g pm2
pm2 start src/server.js --name pdcrm
pm2 status
```

---

## 6. Авторизация, роли и интерфейс

### 6.1. Авторизация по коду доступа

Система использует **авторизацию по коду**, без логина/пароля.

* На экране логина вводится **только код доступа**.
* Backend:

  * ищет пользователя по `access_code_hash` в таблице `users`;
  * при успехе выдаёт JWT и данные пользователя.
* После входа:

  * в шапке отображается приветствие по времени суток:

    * «Доброе утро, Александр!»,
    * «Добрый день, Евгений!»,
    * «Добрый вечер, Никита!» и т.п.;
  * показывается мотивационная фраза;
  * имя и роль (например, “Никита — Производство”).

### 6.2. Роли пользователей

Стартовые пользователи (по сид-данным):

* **Дизайнеры**: Александр, Анастасия, Валентина, Юлия, Ольга (`role = 'designer'`)
* **Производство**: Никита, Виктор, Павел, Екатерина (`role = 'production'`)
* **Директор**: Евгений (`role = 'director'`)
* **Админ**: Андрей (`role = 'admin'`)

Пример **демо-кодов доступа** (могут отличаться от реальных — смотреть seeds):

* Евгений (директор): `1001`
* Андрей (админ): `1002`
* Александр (дизайнер): `2001`
* Анастасия (дизайнер): `2002`
* Валентина (дизайнер): `2003`
* Юлия (дизайнер): `2004`
* Ольга (дизайнер): `2005`
* Никита (производство): `3001`
* Виктор (производство): `3002`
* Павел (производство): `3003`
* Екатерина (производство): `3004`

Фактические коды берутся из `backend/src/db/seeds/...`.
В будущем коды можно менять через интерфейс администратора в разделе:

> **Справочники / Настройки → Пользователи / Права доступа**

### 6.3. Хэдер: тема и уведомления

После логина в хэдере сверху справа:

* **Серый круг №1** — переключатель светлая/тёмная тема:

  * по клику меняет тему интерфейса на лету;
  * выбор темы сохраняется (например, в `localStorage`).
* **Серый круг №2** — иконка уведомлений:

  * при наличии непрочитанных событий показывает бейдж с количеством;
  * по клику открывает список уведомлений (новые заказы в производстве, изменения статусов, низкие остатки на складе и т.п.).
* **(Опционально) Серый круг №3** — резерв под быстрые настройки или статус системы.

---

## 7. Частые проблемы и их решения

### 7.1. `node: command not found` / `npm: command not found`

* Убедитесь, что Node.js установлен и добавлен в `PATH`.
* Перезапустите терминал/командную строку после установки Node.js.

### 7.2. Ошибки при `npm install`

* Почистите кэш npm:

  ```bash
  npm cache clean --force
  ```

* Удалите `node_modules` и `package-lock.json` (или `pnpm-lock.yaml` / `yarn.lock`, если используются другие менеджеры пакетов), затем установите зависимости заново:

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 7.3. Проблемы с миграциями / БД

* Проверьте `.env` — корректен ли путь к БД (`DB_PATH`).

* Убедитесь, что вы запускаете Knex из папки `backend`:

  ```bash
  cd backend
  npx knex migrate:latest
  npx knex seed:run
  npm run dev
  ```

* Если структура БД поменялась, возможно, потребуется удалить старый файл БД (например, `data/crm.sqlite`) и повторно выполнить миграции/сиды.

### 7.4. Frontend не может достучаться до API (CORS / 404)

* Убедитесь, что backend запущен и слушает порт, указанный в `baseURL` Axios.
* Проверьте, что в `.env` backend верное значение `CORS_ORIGIN` (адрес dev-сервера фронта).
* Проверьте базовый URL в `frontend/src/api/http.js` (или аналогичном файле):

  ```js
  baseURL: 'http://localhost:3000/api'
  ```
* Убедитесь, что нужные маршруты действительно существуют в `backend/src/routes`.

### 7.5. Пустая страница / ошибки в консоли браузера

* Откройте DevTools (F12) → вкладка **Console**.
* Проверьте JS-ошибки или ошибки сетевых запросов.
* Убедитесь, что `npm run dev` в `frontend` и `npm run dev` в `backend` запущены и не падают с ошибками.
* Если вы используете client-side routing (Vue Router) и раздачу через Express — убедитесь, что маршрут `app.get('*', ...)` настроен корректно.
