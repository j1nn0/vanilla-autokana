list:
	@grep "^[a-zA-Z\-]*:" Makefile | grep -v "grep" | sed -e 's/^/make /' | sed -e 's/://'

push:
	git push origin main --tags

release-patch:
	pnpm release patch

release-minor:
	pnpm release minor

release-major:
	pnpm release major
