#!/bin/bash

# Script para iniciar preview de Cora Notes

echo "🚀 Iniciando servidor de preview para Cora Notes..."
echo ""

# Detectar si Python está disponible
if command -v python3 &> /dev/null; then
    PORT=8000
    echo "✓ Usando Python 3 HTTP Server"
    echo "✓ Servidor corriendo en: http://localhost:$PORT"
    echo ""
    echo "📱 Para probar:"
    echo "   - App principal: http://localhost:$PORT/index.html"
    echo "   - Test módulos:  http://localhost:$PORT/test-modules.html"
    echo ""
    echo "Presiona Ctrl+C para detener el servidor"
    echo "─────────────────────────────────────────────────────────"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    PORT=8000
    echo "✓ Usando Python 2 HTTP Server"
    echo "✓ Servidor corriendo en: http://localhost:$PORT"
    echo ""
    echo "📱 Para probar:"
    echo "   - App principal: http://localhost:$PORT/index.html"
    echo "   - Test módulos:  http://localhost:$PORT/test-modules.html"
    echo ""
    echo "Presiona Ctrl+C para detener el servidor"
    echo "─────────────────────────────────────────────────────────"
    python -m SimpleHTTPServer $PORT
elif command -v php &> /dev/null; then
    PORT=8000
    echo "✓ Usando PHP Built-in Server"
    echo "✓ Servidor corriendo en: http://localhost:$PORT"
    echo ""
    echo "📱 Para probar:"
    echo "   - App principal: http://localhost:$PORT/index.html"
    echo "   - Test módulos:  http://localhost:$PORT/test-modules.html"
    echo ""
    echo "Presiona Ctrl+C para detener el servidor"
    echo "─────────────────────────────────────────────────────────"
    php -S localhost:$PORT
else
    echo "❌ No se encontró Python ni PHP"
    echo ""
    echo "Opciones:"
    echo "1. Instalar Python 3:"
    echo "   sudo apt install python3  (Ubuntu/Debian)"
    echo "   brew install python3      (macOS)"
    echo ""
    echo "2. Abrir index.html directamente en el navegador:"
    echo "   xdg-open index.html       (Linux)"
    echo "   open index.html           (macOS)"
    echo "   start index.html          (Windows)"
    echo ""
    echo "3. Usar npx (si tienes Node.js):"
    echo "   npx http-server -p 8000"
fi
