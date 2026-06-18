#!/bin/bash
cd backend
python -m uvicorn main:app --reload --port 8000 > backend.log 2>&1 &
echo $! > backend.pid
