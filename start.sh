#!/bin/bash
# ══════════════════════════════════════════════════════════
# DealerOS — Start Script (Mac)
# Run from the dealership-management/ root folder
# ══════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
DATA_DIR="$SCRIPT_DIR/data"
FILES_DIR="$SCRIPT_DIR/files"

echo "══════════════════════════════════════"
echo "  SA Motors DealerOS — Starting..."
echo "══════════════════════════════════════"

# Create required directories
mkdir -p "$DATA_DIR"
mkdir -p "$FILES_DIR/Cars"
mkdir -p "$FILES_DIR/Investors"
echo "✓ Directories ready"

# ── Set JAVA_HOME to Zulu 17 if available (most stable for Lombok) ──
if [ -d "/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home" ]; then
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
elif [ -d "/opt/homebrew/Cellar/openjdk@17" ]; then
    export JAVA_HOME="$(ls -d /opt/homebrew/Cellar/openjdk@17/*/libexec/openjdk.jdk/Contents/Home 2>/dev/null | tail -1)"
fi
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}/opt/homebrew/bin:/usr/local/bin:$PATH"

# ── Check Java 17+ ────────────────────────────────────────
if ! command -v java &> /dev/null; then
    echo "✗ Java not found. Install: brew install openjdk@17"
    echo "  Then: sudo ln -sfn \$(brew --prefix)/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk"
    exit 1
fi
JAVA_VER=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
if [ "${JAVA_VER:-0}" -lt 17 ] 2>/dev/null; then
    echo "✗ Java 17+ required. Found: $(java -version 2>&1 | head -1)"
    exit 1
fi
echo "✓ Java $JAVA_VER"

# ── Find Maven ────────────────────────────────────────────
MVN_CMD=""
if command -v mvn &> /dev/null; then
    MVN_CMD="mvn"
elif [ -f "$BACKEND_DIR/mvnw" ]; then
    MVN_CMD="$BACKEND_DIR/mvnw"
    chmod +x "$MVN_CMD"
else
    echo "✗ Maven not found. Install: brew install maven"
    exit 1
fi
echo "✓ Maven: $MVN_CMD"

# ── Build ─────────────────────────────────────────────────
echo ""
echo "Building... (first run downloads dependencies ~2 min)"
cd "$BACKEND_DIR"
$MVN_CMD package -q -DskipTests

JAR="$BACKEND_DIR/target/dealeros-backend-1.0.0.jar"
if [ ! -f "$JAR" ]; then
    echo "✗ Build failed — JAR not found"
    exit 1
fi
echo "✓ Build complete"

# ── Launch ────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════"
echo "  DealerOS is running!"
echo ""
echo "  App:        http://localhost:8080"
echo "  DB console: http://localhost:8080/h2-console"
echo "              JDBC URL: jdbc:h2:file:./data/dealeros"
echo ""
echo "  Press Ctrl+C to stop"
echo "══════════════════════════════════════"
echo ""

java -jar "$JAR"
