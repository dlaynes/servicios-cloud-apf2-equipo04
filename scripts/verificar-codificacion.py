#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verifica la codificacion de los archivos de texto del repositorio.

Criterios (los tres deben cumplirse):
  1. Sin BOM UTF-8 (los BOM rompen la compilacion de Java y el
     analisis de YAML en algunos readers).
  2. Decodificables como UTF-8 estricto.
  3. Sin caracteres de control C1 (U+0080-U+009F), que son la huella
     de una doble codificacion UTF-8 -> Latin-1 -> UTF-8.

Uso:
    python scripts/verificar-codificacion.py [directorio]
Codigo de salida: 0 si todo es correcto, 1 si hay hallazgos.
"""

import pathlib
import sys

SKIP_DIRS = {".git", "node_modules", "target", "dist", ".mvn", ".idea", ".vscode"}
BINARY_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".ico", ".zip", ".gz",
    ".jar", ".war", ".class", ".woff", ".woff2", ".ttf", ".eot", ".mp4",
    # Documentos de Office: son contenedores ZIP con XML interno.
    ".docx", ".xlsx", ".pptx", ".doc", ".xls",
}
# Se ignoran porque son artefactos generados, no codigo fuente.
SKIP_FILES = {"package-lock.json"}


def is_probably_text(path: pathlib.Path) -> bool:
    if path.suffix.lower() in BINARY_SUFFIXES:
        return False
    return True


def scan(root: pathlib.Path):
    findings = []
    checked = 0

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.name in SKIP_FILES:
            continue
        if not is_probably_text(path):
            continue

        raw = path.read_bytes()
        if not raw:
            continue

        checked += 1
        rel = path.relative_to(root)

        if raw.startswith(b"\xef\xbb\xbf"):
            findings.append((rel, "BOM UTF-8 presente"))
            continue

        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError as exc:
            findings.append((rel, "no decodificable como UTF-8: %s" % exc))
            continue

        for number, line in enumerate(text.splitlines(), 1):
            controls = [c for c in line if 0x80 <= ord(c) <= 0x9F]
            if controls:
                findings.append(
                    (rel, "linea %d: posible doble codificacion (%s)"
                     % (number, " ".join("U+%04X" % ord(c) for c in controls)))
                )

    return checked, findings


def main() -> int:
    root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()

    if not root.is_dir():
        print("ERROR: no existe el directorio %s" % root)
        return 2

    checked, findings = scan(root)

    print("Archivos de texto verificados: %d" % checked)

    if not findings:
        print("RESULTADO: OK - sin BOM, UTF-8 valido y sin doble codificacion.")
        return 0

    print("RESULTADO: %d hallazgo(s)" % len(findings))
    for rel, message in findings:
        print("  - %s: %s" % (rel, message))
    return 1


if __name__ == "__main__":
    sys.exit(main())
