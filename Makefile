.PHONY: all

all: app/favicon.ico

app/favicon.ico: app/icons/logo.svg
	convert -background "#2fc2ef" -define icon:auto-resize $< $@
