.PHONY: test prep

test:
	npm test

prep: test
	npm run lint && npm run prettier:fix
