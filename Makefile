.PHONY: dev build preview icons

FONT_URL := https://github.com/google/fonts/raw/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf

dev: ; docker compose up dev

build: ; docker compose run --rm builder

preview: ; docker compose run --rm --service-ports preview

# Regenerate public/icons (SVGs + PNGs) from scripts/make_icons.py.
icons:
	docker run --rm -v ./scripts:/job:ro -v ./public/icons:/out python:3.12-slim sh -c '\
	  apt-get update -qq >/dev/null && apt-get install -y -qq librsvg2-bin >/dev/null 2>&1 && \
	  pip install -q --root-user-action=ignore fonttools && \
	  python -I -c "import urllib.request as u; u.urlretrieve(\"$(FONT_URL)\", \"/tmp/font.ttf\")" && \
	  python -I /job/make_icons.py /tmp/font.ttf /out'
