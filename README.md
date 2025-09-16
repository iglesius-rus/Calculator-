# Calc_final_v002 (flat)
Файлы кидай в корень репозитория (без папок). Работает офлайн как PWA.

Что сделать:
1) Включить GitHub Pages (Settings → Pages → Deploy from branch, ветка main, /root).
2) Залить эти файлы в корень.
3) Открыть сайт один раз онлайн. Потом офлайн работает.
4) На Android: меню → «Добавить на главный экран».

Примечание:
- Если сайт открывается по адресу вида username.github.io/repo, в index.html регистрация SW уже относительная: ./service-worker.js
- Для обновления подними CACHE_NAME в service-worker.js
