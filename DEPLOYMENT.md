# Публічний API для Telegram Mini App

Цей фронтенд розміщений на GitHub Pages, а API має працювати на окремому
публічному HTTPS-домені. Не використовуйте URL GitHub Pages для `/mini-api`:
GitHub Pages є лише статичним хостингом і повертатиме `404`.

## 1. Отримайте правильний URL бекенду у Vercel

1. Відкрийте [Vercel Dashboard](https://vercel.com/dashboard) і виберіть
   проєкт бекенду EYE NEMO.
2. Відкрийте **Settings → Domains**.
3. Скопіюйте production-домен, наприклад
   `https://eye-nemo-backend.vercel.app`. Не використовуйте URL з Preview
   deployment: він може змінюватися після кожного деплою.
4. Відкрийте `https://<ваш-домен>/health` у режимі інкогніто. Очікувана
   відповідь: JSON на кшталт `{"status":"ok"}`. Сторінка входу Vercel,
   HTML або `404` означає, що це не публічний API.

## 2. Вимкніть захист Vercel для API

Якщо замість JSON бачите **Log in to Vercel**, запит захищений Vercel
Deployment Protection і Mini App не зможе до нього звернутися.

1. У Vercel відкрийте бекенд-проєкт.
2. Перейдіть до **Settings → Deployment Protection**.
3. Для Production вимкніть **Vercel Authentication** / **Deployment
   Protection**, або додайте `/health` та `/mini-api/*` до дозволених
   публічних шляхів, якщо ваша версія Vercel підтримує bypass paths.
4. Натисніть **Save** і, якщо Vercel попросить, виконайте Redeploy.
5. Повторіть перевірку з попереднього розділу в інкогніто.

> Не вимикайте авторизацію самого застосунку. Публічним має бути лише
> мережевий доступ до FastAPI; `/mini-api/*` все одно перевіряє підписані
> Telegram `initData` на кожному запиті.

## 3. Дозвольте GitHub Pages звертатися до API

У змінних середовища бекенду задайте:

```env
FRONTEND_ORIGIN=https://hang8s.github.io
MINI_APP_URL=https://hang8s.github.io/EYE_NEMO_FRONTEND/
```

Після зміни Environment Variables виконайте Redeploy бекенду. `FRONTEND_ORIGIN`
має містити лише origin, без `/EYE_NEMO_FRONTEND/` наприкінці.

## 4. Передайте URL API у збірку GitHub Pages

1. Відкрийте репозиторій
   [Hang8s/EYE_NEMO_FRONTEND](https://github.com/Hang8s/EYE_NEMO_FRONTEND).
2. Відкрийте **Settings → Secrets and variables → Actions → Variables**.
3. Створіть або відредагуйте repository variable:

   ```text
   Name:  VITE_API_BASE_URL
   Value: https://<ваш-публічний-домен-бекенду>
   ```

   Значення обов'язково має починатися з `https://` і не має закінчуватися
   `/mini-api`.
4. Відкрийте **Actions → Deploy frontend to GitHub Pages → Run workflow**
   або зробіть commit у `main`.
5. Дочекайтеся успішного завершення workflow та відкрийте Mini App через
   кнопку бота в Telegram, а не напряму в браузері.

## 5. Перевірка

У DevTools → Network перший запит повинен мати такий вигляд:

```text
GET https://<ваш-публічний-домен-бекенду>/mini-api/chats
X-Telegram-Init-Data: <підписані дані Telegram>
```

Очікуваний результат — `200` та JSON `{"items":[...]}`. Запит без заголовка
`X-Telegram-Init-Data` має повертати `401`; це нормальна та потрібна поведінка.

## Як визначається власник чатів

Фронтенд не передає `user_id` у URL. Бекенд дістає Telegram ID із перевірених
`initData` і повертає лише чати з активних `BusinessConnection`, власником яких
є цей Telegram-користувач. Тому один користувач не може отримати чати іншого,
підставивши інший параметр у запит.
