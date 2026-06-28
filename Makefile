list:
	@grep "^[a-zA-Z\-]*:" Makefile | grep -v "grep" | sed -e 's/^/make /' | sed -e 's/://'

push:
	git push origin main --tags

release-patch:
	pnpm version patch

release-minor:
	pnpm version minor

release-major:
	pnpm version major
