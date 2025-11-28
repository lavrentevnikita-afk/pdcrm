# Launch Guide — Print CRM

Этот гайд описывает, как развернуть и запустить CRM/ERP-систему для типографии (Node.js + Express + SQLite + Vue 3).

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

- **Git** (по желанию, если проект в репозитории)
  - Проверка:
    ```bash
    git --version
    ```

- **SQLite3** (по желанию, для работы с БД из консоли)
  - Проверка:
    ```bash
    sqlite3 --version
    ```

---

## 2. Структура проекта

Предполагаемая структура папок:

```text
print-crm/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js        # точка входа backend
│       ├── app.js           # конфигурация Express
│       ├── config/
│       ├── db/
│       │   ├── knexfile.js
│       │   ├── connection.js
│       │   ├── migrations/
│       │   └── seeds/
│       ├── models/
│       ├── services/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       └── utils/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/
│       ├── store/
│       ├── api/
│       ├── views/
│       ├── components/
│       └── assets/
└── docs/
    ├── architecture.md
    └── launch.md            # данный файл
````

---

## 3. Первичная настройка проекта

1. **Склонировать репозиторий (если он в Git)**

   ```bash
   git clone <URL-ВАШЕГО-РЕПОЗИТОРИЯ> print-crm
   cd print-crm
   ```

   Либо просто скопировать все файлы проекта в папку, например `print-crm`.

2. **Настроить backend-зависимости**

   ```bash
   cd backend
   npm install
   ```

3. **Скопировать файл настроек окружения**

   Если есть `.env.example`, создайте файл `.env`:

   ```bash
   cp .env.example .env   # Linux/macOS
   # или скопируйте вручную в Windows
   ```

   Пример содержимого `.env` (можно адаптировать под себя):

   ```env
   NODE_ENV=development
   PORT=3000
   DB_PATH=./data/crm.sqlite
   JWT_SECRET=super-secret-key
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Выполнить миграции и сиды БД (если используется Knex)**

   Из папки `backend`:

   ```bash
   npx knex migrate:latest
   npx knex seed:run
   ```

   Это создаст таблицы (пользователи, товары, заказы и т.д.) и заполнит стартовыми данными (включая 11 сотрудников).

5. **Настроить frontend-зависимости**

   ```bash
   cd ../frontend
   npm install
   ```

6. **Вернуться в корневую папку проекта (по желанию)**

   ```bash
   cd ..
   ```

---

## 4. Запуск в режиме разработки

Рекомендуется использовать **два терминала**: один для backend, второй для frontend.

### 4.1. Backend (API-сервер)

В первом терминале:

```bash
cd path/to/print-crm/backend
npm run dev
```

Обычно команда `npm run dev`:

* запускает `nodemon src/server.js`;
* поднимает Express сервер на порту, указанном в `.env` (например, `http://localhost:3000`).

Проверьте консоль — там должно появиться сообщение вида:

```text
CRM backend server running at http://localhost:3000
```

### 4.2. Frontend (Vue-приложение)

Во втором терминале:

```bash
cd path/to/print-crm/frontend
npm run dev
```

По умолчанию Vite запустит dev-сервер, например, на:

```text
http://localhost:5173
```

Откройте этот адрес в браузере — вы должны увидеть экран авторизации (ввод кода доступа), а после ввода — основное приложение с дэшбордом.

---

## 5. Сборка и запуск в продакшене

### 5.1. Сборка frontend

Из папки `frontend`:

```bash
npm run build
```

Vite соберёт статические файлы в папку `dist/`:

```text
frontend/
└── dist/
    ├── index.html
    ├── assets/
    └── ...
```

Дальше есть два варианта:

1. **Отдавать dist через отдельный веб-сервер** (Nginx, Apache)
2. **Научить backend (Express) раздавать статические файлы** из `dist/`.

### 5.2. Настройка backend для продакшена

1. Убедитесь, что в `.env` выставлен нужный режим:

   ```env
   NODE_ENV=production
   PORT=3000
   DB_PATH=./data/crm.sqlite
   ```

2. Если Express должен раздавать собранный фронт, в `backend/src/app.js` обычно добавляется что-то вроде:

   ```js
   const path = require('path');
   const express = require('express');
   const app = express();

   // ... ваши API маршруты ...

   // Отдача статического фронта (если dist скопирован в backend/public)
   app.use(express.static(path.join(__dirname, '..', 'public')));

   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
   });

   module.exports = app;
   ```

3. Запуск backend в продакшене:

   Из папки `backend`:

   ```bash
   npm install --production
   npm run start   # например, "node src/server.js"
   ```

   Для постоянной работы на сервере обычно используют **pm2**:

   ```bash
   npm install -g pm2
   pm2 start src/server.js --name print-crm
   ```

---

## 6. Авторизация и тестовые доступы

Система использует авторизацию **по кодам доступа** (без логина и пароля).

* На экране логина вводится только **код доступа**.
* После успешного входа в шапке (`header`) отображается:

  * приветствие по времени суток:
    «Доброе утро, Александр!» / «Добрый день, Евгений!» и т.п.;
  * мотивационная фраза;
  * имя текущего пользователя.

Стартовые пользователи (пример):

* Дизайнеры: Александр, Анастасия, Валентина, Юлия, Ольга
* Производство: Никита, Виктор, Павел, Екатерина
* Директор: Евгений
* Админ: Андрей

Стандартные демо-коды доступа (по умолчанию из сидов базы данных):

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

Коды доступа задаются в базе через сиды или через интерфейс администратора (в разделе **Справочники и Настройки → Пользователи/Права доступа**).

---

## 7. Частые проблемы и их решения

### 7.1. `node: command not found` / `npm: command not found`

* Убедитесь, что Node.js установлен и добавлен в `PATH`.
* Перезапустите терминал/командную строку после установки Node.js.

### 7.2. Проблемы с `npm install`

* Почистите кэш:

  ```bash
  npm cache clean --force
  ```
* Удалите `node_modules` и `package-lock.json`, затем попробуйте ещё раз:

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### 7.3. Backend не запускается / падает с ошибками миграций

* Проверьте файл `.env` (особенно `DB_PATH`).
* Убедитесь, что миграции были выполнены:

  ```bash
  cd backend
  npx knex migrate:latest
  npx knex seed:run
  npm run dev
  ```

### 7.4. Frontend не видит API (CORS / 404)

* Проверьте, что backend поднят на том же порту, что указан в `CORS_ORIGIN`.
* Проверьте базовый URL в `frontend/src/api/index.js` (например, `http://localhost:3000/api`).
* Убедитесь, что нужные маршруты действительно существуют в `backend/src/routes`.

### 7.5. Пустая страница / ошибки в браузерной консоли

* Откройте DevTools (F12) → вкладка **Console**.
* Проверьте сообщения об ошибках (JS-ошибки, ошибки запросов к API).
* Убедитесь, что `npm run dev` на фронте работает без ошибок.