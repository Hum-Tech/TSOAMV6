#!/bin/bash

echo "================================================"
echo " TSOAM Church Management System"
echo " Starting Server..."
echo "================================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if setup has been run
if [ ! -d "node_modules" ]; then
    echo "First time setup detected..."
    echo "Running automated setup..."
    npm run setup
    if [ $? -ne 0 ]; then
        echo "Setup failed! Please check the errors above."
        exit 1
    fi
fi

# Get local IP address
LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)

# Start the server
echo "Starting TSOAM Church Management System..."
echo
echo "Access the system at:"
echo "  - Local: http://localhost:3001"
if [ ! -z "$LOCAL_IP" ]; then
    echo "  - Network: http://$LOCAL_IP:3001"
fi
echo
echo "Press Ctrl+C to stop the server"
echo

cd server
npm start
