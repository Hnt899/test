Панель администратора BTX

Административная панель для тестового задания Middle Frontend Developer.
Приложение построено на Next.js App Router и демонстрирует работу с публичным API, реальными CRUD-операциями, real-time оповещениями через Socket.IO и адаптивной версткой под десктоп и мобильные устройства.

🚀 Основные возможности

Аутентификация и защита маршрутов.
Пользователь входит через форму app/(auth)/login. Бэкенд-маршруты в app/api/* общаются с тестовым API и сохраняют JWT в HttpOnly cookie. middleware.ts перенаправляет незалогиненных пользователей на страницу входа.

Единый layout панели.
В app/panel/layout.tsx настроены сайдбар, верхние панели и мобильные вкладки. Также подключена прослушка событий SocketEvents для инвалидации данных.

Страницы сущностей:

Posts — поиск, сортировка по просмотрам, лайкам, комментариям; пагинация с кнопкой «Show more»; карточки авторов и адаптивное отображение.

Users — поиск, создание, редактирование, удаление через модальные окна; статистика постов/лайков/комментариев; бейджи ролей и отдельный мобильный layout.

Admins — CRUD-модалки, табличное и мобильное представления, работа с ролями.

Реалтайм-уведомления.
Компонент shared/components/SocketEvents.tsx принимает события user:* и admin:*, показывает toast-уведомления через sonner и обновляет списки.

Работа с TanStack Query v5.
Хуки usePosts, useUsers, useAdmins кэшируют данные, используют placeholderData и синхронизируются с WebSocket-событиями.

Переиспользуемые компоненты.
Модалки (Modal, UserFormModal, AdminFormModal, ChangePasswordModal), карточки профиля, мобильные панели, утилиты shared/lib/* для форматирования данных.

Стилизация.
Tailwind CSS и SCSS (app/globals.scss) обеспечивают темизацию, сетки, тени и единый дизайн.

🧩 Архитектура проекта
app/
  (auth)/login/       — страница входа
  api/                — серверные роуты (auth/me/logout/change-password)
  panel/              — layout панели и страницы posts, users, admins, profile
  providers.tsx       — обертка TanStack Query + toasts

shared/
  api-services/       — работа с REST API (users, posts, admins, profile, comments)
  components/         — переиспользуемые UI-компоненты
  config/             — env-конфигурация API и cookies
  hooks/              — кастомные хуки TanStack Query
  lib/                — хелперы (пагинация, форматирование, socket)

socket-server/        — локальный ретранслятор событий Socket.IO

🌐 Работа с API

Базовый URL: https://test-api.live-server.xyz (NEXT_PUBLIC_API_BASE)

Переменные окружения:

NEXT_PUBLIC_SOCKET_URL — адрес WebSocket-сервера (по умолчанию http://localhost:4000)

NEXT_PUBLIC_DEV_LOGIN=1 — вход без реального запроса к API (dev-режим, тестовый токен)

Сервисы в shared/api-services/* инкапсулируют все запросы. Хелперы приводят данные API к единым форматам (например, нормализуют количество лайков и комментариев).

⚡ Real-time

В папке socket-server находится легковесный ретранслятор Socket.IO.
В dev-режиме он запускается вместе с приложением и пересылает любые входящие события всем клиентам.
Клиентские хуки и мутации генерируют события user:* и admin:*, синхронизируя вкладки и уведомления.

⚙️ Требования к окружению

Node.js ≥ 18.18

npm (используется package-lock.json)

Установка зависимостей:

npm install


Создайте файл .env.local при необходимости и задайте переменные:

NEXT_PUBLIC_API_BASE=
NEXT_PUBLIC_SOCKET_URL=
NEXT_PUBLIC_DEV_LOGIN=

📜 Скрипты

npm run dev — запуск Socket.IO сервера и Next.js (Turbopack) (быстрый запуск проекта после установки зависимостей)

npm run build — production-сборка

npm run start — запуск собранного приложения

npm run socket — локальный сервер Socket.IO отдельно

npm run lint — проверка ESLint (через eslint.config.mjs)

✅ Соответствие требованиям тестового задания

Next.js + SCSS + Tailwind — используется App Router и глобальные стили.

TanStack Query — запросы к API реализованы через хуки @tanstack/react-query v5.

Socket.IO — UI реагирует на события в реальном времени.

CRUD и поиск — реализованы для админов, пользователей и постов.

Адаптивность — десктопные таблицы и мобильные карточки; отдельная навигация.

📚 Полезные материалы

Макет Figma —  [тут](https://www.figma.com/design/cuX2kdGHH9YZlQLhQ9bLTr/%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%BE%D0%B5-%D0%B7%D0%B0%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5?node-id=0-1&t=q8ZxoOYogMXp9w5J-1)

Тестовый API — https://test-api.live-server.xyz

Примеры данных — https://dummyjson.com
