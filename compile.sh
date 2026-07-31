#!/bin/bash

# Compilar TypeScript para JavaScript
npx tsc src/main.ts --target es2020 --module es2020 --outDir public --lib es2020,dom --skipLibCheck

# Copiar arquivos de dados
cp -r src/data public/
