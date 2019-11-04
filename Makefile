NAME=console-frontend
VERSION=release5.0
REGISTRY=pnda

build:	## Build the docker image
	docker build -t "$(NAME):$(VERSION)" -f Dockerfile .

upload:	## Upload image to registry
	docker tag "$(NAME):$(VERSION)" "$(REGISTRY)/$(NAME):$(VERSION)"
	docker push "$(REGISTRY)/$(NAME):$(VERSION)"

help:	## This help
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: help
.DEFAULT_GOAL := help
