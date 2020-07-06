.PHONY: all

all: public/favicon.ico

public/favicon.ico: public/icon.svg
	convert -background "#2fc2ef" -define icon:auto-resize $< $@
