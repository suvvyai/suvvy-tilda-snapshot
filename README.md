# Снапшот suvvy.ai с Тильды (превью)

Статическая выгрузка Тильды (июль 2026) для сравнения со сборкой на Astro
(`landing-preview`). Отдаётся Caddy; `Caddyfile` сгенерён из тильдовского
`htaccess` — все человеческие URL (`/contact`, `/case-*`, `/chat-bot-*`) работают.

- Не для прода: `noindex, nofollow` + `robots.txt: Disallow: /`.
- Обновление: `py "перенос сайта/gen_caddyfile.py"` + пересинк `export/savvi` → `site/`.
