.PHONY: dev build test stats preview icons font

FONT_URL := https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf

dev: ; docker compose up dev

build: ; docker compose run --rm builder

test: ; docker compose run --rm builder sh -c "npm install && npm test"

stats: ; docker compose run --rm builder sh -c "npm run stats --silent"

preview: ; docker compose run --rm --service-ports preview

# Regenerate public/icons (SVGs + PNGs) and public/favicon.ico from scripts/make_icons.py.
icons:
	docker run --rm -v ./scripts:/job:ro -v ./public:/public python:3.12-slim sh -c '\
	  apt-get update -qq >/dev/null && apt-get install -y -qq librsvg2-bin >/dev/null 2>&1 && \
	  pip install -q --root-user-action=ignore fonttools && \
	  python -I -c "import urllib.request as u; u.urlretrieve(\"$(FONT_URL)\", \"/tmp/font.ttf\")" && \
	  python -I /job/make_icons.py /tmp/font.ttf /public/icons'

# Rebuild the self-hosted font subset in src/assets/fonts from scripts/subset_font.py.
font:
	docker run --rm -v ./scripts:/job:ro -v ./src/assets/fonts:/out python:3.12-slim sh -c '\
	  pip install -q --root-user-action=ignore fonttools brotli && \
	  python -I -c "import urllib.request as u; u.urlretrieve(\"$(FONT_URL)\", \"/tmp/font.ttf\")" && \
	  python -I /job/subset_font.py /tmp/font.ttf /out/bricolage-grotesque-latin.woff2'
