#!/bin/bash
# Start backend and frontend in background, run Cypress, then kill servers

set -u

# Ensure test data exists before starting backend
bash backend/tests/copy-test-data.sh

# Start backend in test mode
export TEST_MODE=1
npm run start:backend &
BACKEND_PID=$!

# Start frontend
cd frontend && npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# Wait for servers to be ready
sleep 5

# Run Cypress tests
cd frontend && npx cypress run
TEST_RESULT=$?
cd ..

# Kill servers if they are still running
kill "$BACKEND_PID" 2>/dev/null || true
kill "$FRONTEND_PID" 2>/dev/null || true

exit $TEST_RESULT
