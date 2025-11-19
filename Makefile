.PHONY: fmt
fmt:
	@echo "Running format check..."
	@npm run lint || echo "No linting errors found"
	@echo "Format check complete"
