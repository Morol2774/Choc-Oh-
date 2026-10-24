# images/

Сюда кладутся собственные фото. Имена слотов:

| Файл | Где на сайте |
|---|---|
| hero.jpg (или hero.mp4) | первый экран, левая половина |
| tile-1.jpg … tile-3.jpg | 3 стеклянные карточки в первом экране |
| gallery-01.jpg … gallery-09.jpg | тёмная галерея, бегущая лента |
| bonbons-bg.jpg, card-1.jpg … card-4.jpg | секция Bonbons |
| services-bg.jpg | секция What we make |
| cake-bg.jpg, cake-1.jpg … cake-3.jpg | секция Custom cakes |
| story.jpg | секция why choc oh! |
| contact-bg.jpg | фон окна заказа |

Чтобы файл из этой папки заработал, удалите строку с тем же именем в объекте `PHOTOS` в `js/main.js`.
Пока строка есть, грузится стоковое фото Unsplash.

Фото card-1, card-2, card-3, card-4, tile-2, tile-3 видны ещё и внутри стеклянных 3D-шаров.
Для них лучше квадратный кадр, конфета по центру.

Размер: 1600–2400 px по длинной стороне (карточки и галерея 700–900 px), формат webp или jpg.
