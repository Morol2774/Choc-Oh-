# Choc Oh! Toronto — сайт

Статический сайт без сервера и CDN: всё, что нужно, лежит в этой папке.

## Структура

```
index.html            разметка
css/fonts.css         локальные шрифты (Jost, Cormorant Garamond)
css/style.css         стили
js/main.js            фото, меню, окно заказа, пружинные карточки, загрузка 3D
js/bonbons.bundle.js  готовая 3D-сцена (three.js 0.160 внутри, ~480 КБ)
src/bonbons.js        исходник 3D-сцены
fonts/                woff2 + лицензии OFL
images/               ваши фото (см. images/README.md)
.htaccess             заголовки безопасности для Apache
_headers              то же для Netlify / Cloudflare Pages
```

## Запуск локально

Откройте через локальный сервер (не двойным щелчком: браузер не даст загрузить фото в 3D-шары):

```
python3 -m http.server 8080
```

и перейдите на http://localhost:8080

## Где что менять

- **Фото** — `images/` + объект `PHOTOS` в `js/main.js`.
- **Цвета** — переменные в начале `css/style.css` (`--cream`, `--raspberry`, `--pistachio` …).
- **Бонбоны** — списки `DESKTOP` и `MOBILE` в `src/bonbons.js`.
  Каждая строка: `[секция, высота 0..1 (1 = стык со следующей), ширина 0..1, диаметр px, 'p' расписной | 'g' стеклянный, вкус или фото, 'b' сзади | 'f' спереди, скорость]`.
  Секции: 0 hero, 1 галерея, 2 бонбоны, 3 услуги, 4 торты, 5 история.
  Вкусы: `rasp`, `pist`, `gold`, `caramel`.
  После правки пересоберите: `npm i` и `npm run build`.
- **Пружины карточек** — константа `SP` в `js/main.js` (позиция 300/26, масштаб 420/28, наклон 220/20).

## Безопасность

- Content-Security-Policy без `unsafe-inline`: в HTML нет встроенных стилей и скриптов.
- Шрифты и three.js локальные, внешний источник только фото `images.unsplash.com`.
  Когда все фото заменены на свои, уберите `https://images.unsplash.com` из `img-src` в `.htaccess` / `_headers`.
- HTTPS-редирект, HSTS, nosniff, Referrer-Policy, Permissions-Policy, запрет встраивания во фрейм.
- Nginx: перенесите заголовки из `_headers` в блок `server { add_header ... always; }`.

## Перед запуском в продакшн

- Форма сейчас открывает почтовый клиент (`mailto:`). Для приёма заявок на сайте нужен серверный обработчик
  (Formspree / Netlify Forms или свой) с CSRF-защитой, ограничением частоты и проверкой полей на сервере.
- Политика конфиденциальности (PIPEDA), если форма будет собирать данные.
- Без JavaScript и без WebGL сайт работает полностью, просто без 3D-шаров.
