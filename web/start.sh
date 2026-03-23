#!/bin/bash
# TradingAgents Web - Khởi chạy nhanh
# Sử dụng: ./web/start.sh [--dev]

set -e
cd "$(dirname "$0")"

if [ "$1" = "--dev" ]; then
    echo "🚀 Chế độ phát triển (Development mode)"
    echo "   Backend: http://localhost:8000"
    echo "   Frontend: http://localhost:5173"
    echo ""

    # Start backend
    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    BACKEND_PID=$!
    cd ..

    # Start frontend dev server
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    # Cleanup on exit
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
else
    echo "🚀 Chế độ sản xuất (Production mode)"

    # Build frontend if needed
    if [ ! -d "frontend/dist" ]; then
        echo "📦 Đang build frontend..."
        cd frontend
        npm run build
        cd ..
    fi

    echo "   Web: http://localhost:8000"
    echo ""

    cd backend
    uvicorn main:app --host 0.0.0.0 --port 8000
fi
