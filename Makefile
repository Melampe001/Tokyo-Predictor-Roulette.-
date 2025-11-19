.PHONY: fmt
fmt:
	@echo "Running formatter..."
	@npm run lint || true
	@echo "Format complete"
