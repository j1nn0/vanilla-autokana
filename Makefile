list:
	@grep "^[a-zA-Z\-]*:" Makefile | grep -v "grep" | sed -e 's/^/make /' | sed -e 's/://'

push:
	git push origin main --tags

release-patch:
	pnpm run release -- patch

release-minor:
	pnpm run release -- minor

release-major:
	pnpm run release -- major

release-patch-dry-run:
	pnpm run release:dry-run -- patch

release-minor-dry-run:
	pnpm run release:dry-run -- minor

release-major-dry-run:
	pnpm run release:dry-run -- major
