.PHONY: all

all: public/favicon.ico

public/favicon.ico: public/icon.svg
	convert -background none -define icon:auto-resize $< $@
