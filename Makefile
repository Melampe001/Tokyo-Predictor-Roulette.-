.PHONY: fmt
fmt:
	@echo "Running format check..."
	@npm run lint || true
	@echo "Format check complete"
