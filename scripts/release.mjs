#!/usr/bin/env node

/**
 * Novel Hunter - Script Automatizado de Release & GitHub Upload
 *
 * Flujo:
 * 1. Lee la versión actual de package.json (ej: 1.1.0 -> tag v1.1.0).
 * 2. Detecta el repositorio GitHub y obtiene el token de autenticación (vía env o git credentials).
 * 3. Opcionalmente compila el ejecutable portable para Windows con `npm run dist:win`.
 * 4. Verifica y crea/sube la etiqueta git correspondiente si no existe en el repositorio remoto.
 * 5. Genera o actualiza el GitHub Release con el changelog de commits.
 * 6. Sube el binario portable (Novel_Hunter_<version>.exe) a los assets de la release.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Leer package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
const version = pkg.version;
const tagName = `v${version}`;
const binaryName = `Novel_Hunter_${version}.exe`;
const binaryPath = path.join(rootDir, 'dist', binaryName);

// Analizar argumentos CLI
const args = process.argv.slice(2);
const skipBuild = args.includes('--skip-build');
const forceUpload = args.includes('--force');
const isDryRun = args.includes('--dry-run');

console.log('='.repeat(70));
console.log(`🚀 Novel Hunter - Release Automatizado (${tagName})`);
console.log('='.repeat(70));

// 1. Obtener Token de GitHub
function getGitHubToken() {
  if (process.env.GITHUB_TOKEN?.trim()) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GH_TOKEN?.trim()) return process.env.GH_TOKEN.trim();
  try {
    const credsOutput = execSync('printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const match = credsOutput.match(/password=(.+)/);
    if (match && match[1]) return match[1].trim();
  } catch {
    // ignorar error y fallback
  }
  return null;
}

// 2. Obtener Nombre del Repositorio Remoto (owner/repo)
function getRepoSlug() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf-8', cwd: rootDir }).trim();
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
    if (match && match[1] && match[2]) {
      return `${match[1]}/${match[2]}`;
    }
  } catch {
    // fallback
  }
  return 'juanmarcoscabezas/novel-hunter';
}

const repoSlug = getRepoSlug();
const token = getGitHubToken();

if (!token && !isDryRun) {
  console.error('\n❌ ERROR: No se encontró un token de GitHub válido.');
  console.error('Por favor, configura la variable de entorno GITHUB_TOKEN o autentica git con GitHub.');
  process.exit(1);
}

console.log(`📦 Repositorio: ${repoSlug}`);
console.log(`🔖 Versión:      ${version} (Tag: ${tagName})`);
console.log(`💻 Binario:      ${binaryName}`);

// 3. Compilación del Ejecutable
if (skipBuild) {
  console.log('\n⏩ Saltando compilación (--skip-build especificado)...');
  if (!fs.existsSync(binaryPath)) {
    console.error(`❌ ERROR: No existe el binario en: ${binaryPath}`);
    console.error('Ejecuta primero "npm run dist:win" o elimina la bandera --skip-build.');
    process.exit(1);
  }
} else {
  console.log('\n🔨 Paso 1: Compilando ejecutable portable para Windows (npm run dist:win)...');
  if (!isDryRun) {
    execSync('npm run dist:win', { stdio: 'inherit', cwd: rootDir });
  } else {
    console.log('   [DRY-RUN] Simulación: Compilación omitida.');
  }

  if (!isDryRun && !fs.existsSync(binaryPath)) {
    console.error(`❌ ERROR: No se encontró el binario generado en: ${binaryPath}`);
    process.exit(1);
  }
}

const binarySizeMB = fs.existsSync(binaryPath)
  ? (fs.statSync(binaryPath).size / (1024 * 1024)).toFixed(1)
  : '0.0';
console.log(`   ✓ Binario verificado: ${binaryName} (${binarySizeMB} MB)`);

// 4. Asegurar Tag en Git
console.log('\n🏷️  Paso 2: Verificando etiquetas Git...');
const existingTags = execSync('git tag -l', { encoding: 'utf-8', cwd: rootDir }).split('\n').map(t => t.trim());
if (!existingTags.includes(tagName)) {
  console.log(`   Creando etiqueta git local ${tagName}...`);
  if (!isDryRun) {
    execSync(`git tag -a ${tagName} -m "Release ${tagName} - Novel Hunter"`, { stdio: 'inherit', cwd: rootDir });
  }
} else {
  console.log(`   ✓ Etiqueta local ${tagName} ya existe.`);
}

console.log(`   Sincronizando etiqueta ${tagName} con el repositorio remoto...`);
if (!isDryRun) {
  try {
    execSync(`git push origin ${tagName}`, { stdio: 'inherit', cwd: rootDir });
  } catch {
    console.log('   (La etiqueta ya está en el repositorio remoto o no requirió cambios).');
  }
}

// 5. Generar Changelog para la Release
function generateChangelog() {
  try {
    const prevTag = execSync(`git describe --tags --abbrev=0 ${tagName}^ 2>/dev/null || true`, {
      encoding: 'utf-8',
      cwd: rootDir
    }).trim();

    const range = prevTag ? `${prevTag}..${tagName}` : tagName;
    const log = execSync(`git log ${range} --pretty=format:"- %s" 2>/dev/null || true`, {
      encoding: 'utf-8',
      cwd: rootDir
    }).trim();

    return log || '- Mejoras generales de estabilidad y rendimiento.';
  } catch {
    return '- Mejoras y nuevas funcionalidades en Novel Hunter.';
  }
}

const changelog = generateChangelog();
const releaseTitle = `Novel Hunter ${tagName}`;
const releaseBody = `## 🚀 Novedades en Novel Hunter ${tagName}

${changelog}

---
### 📥 Descarga para Windows:
Descarga el ejecutable portable autónomo adjunto (**\`${binaryName}\`**). No requiere instalación.
`;

// 6. Consultar / Crear Release en GitHub
async function publishRelease() {
  if (isDryRun) {
    console.log('\n[DRY-RUN] Simulación completa sin llamadas a la API de GitHub.');
    return;
  }

  console.log('\n🌐 Paso 3: Gestionando GitHub Release...');
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Novel-Hunter-Release-Script'
  };

  // Comprobar si la release ya existe
  let release = null;
  const getReleaseRes = await fetch(`https://api.github.com/repos/${repoSlug}/releases/tags/${tagName}`, { headers });
  if (getReleaseRes.ok) {
    release = await getReleaseRes.json();
    console.log(`   ✓ Release existente encontrada (ID: ${release.id})`);
  } else if (getReleaseRes.status === 404) {
    console.log(`   Creando nueva release para ${tagName}...`);
    const createRes = await fetch(`https://api.github.com/repos/${repoSlug}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: tagName,
        target_commitish: 'main',
        name: releaseTitle,
        body: releaseBody,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      console.error('❌ Error al crear release:', errData);
      process.exit(1);
    }
    release = await createRes.json();
    console.log(`   ✓ Release creada exitosamente (ID: ${release.id})`);
  } else {
    console.error('❌ Error inesperado consultando releases en GitHub:', await getReleaseRes.text());
    process.exit(1);
  }

  // 7. Comprobar y Subir Binario como Asset
  console.log(`\n📤 Paso 4: Subiendo binario ${binaryName} a GitHub Assets...`);

  // Verificar si el asset ya existe
  const existingAsset = release.assets?.find(a => a.name === binaryName);
  if (existingAsset) {
    if (forceUpload) {
      console.log(`   Eliminando asset anterior existente (ID: ${existingAsset.id})...`);
      const delRes = await fetch(`https://api.github.com/repos/${repoSlug}/releases/assets/${existingAsset.id}`, {
        method: 'DELETE',
        headers
      });
      if (!delRes.ok) {
        console.error('❌ Error al eliminar asset previo:', await delRes.text());
        process.exit(1);
      }
      console.log('   ✓ Asset previo eliminado correctamente.');
    } else {
      console.log(`   ℹ️ El asset ${binaryName} ya está subido en esta release.`);
      console.log(`   🔗 Enlace de descarga: ${existingAsset.browser_download_url}`);
      console.log('   (Usa --force para sobrescribirlo si lo recompilaste).');
      printSuccess(release.html_url, existingAsset.browser_download_url);
      return;
    }
  }

  const binaryBuffer = fs.readFileSync(binaryPath);
  const uploadUrl = release.upload_url.replace('{?name,label}', `?name=${encodeURIComponent(binaryName)}`);

  console.log(`   Subiendo ${binarySizeMB} MB a GitHub... (esto puede tardar unos segundos)`);
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/vnd.microsoft.portable-executable',
      'Content-Length': binaryBuffer.length.toString()
    },
    body: binaryBuffer
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.json();
    console.error('❌ Error al subir asset:', uploadErr);
    process.exit(1);
  }

  const uploadedAsset = await uploadRes.json();
  console.log('   ✓ Binario subido con éxito!');
  printSuccess(release.html_url, uploadedAsset.browser_download_url);
}

function printSuccess(releaseUrl, downloadUrl) {
  console.log('\n' + '='.repeat(70));
  console.log('🎉 ¡RELEASE PUBLICADA Y DISPONIBLE EXITOSAMENTE EN GITHUB!');
  console.log('='.repeat(70));
  console.log(`🔗 Página del Release:   ${releaseUrl}`);
  console.log(`💾 Descarga del Binario: ${downloadUrl}`);
  console.log('='.repeat(70) + '\n');
}

publishRelease().catch(err => {
  console.error('\n❌ Error inesperado durante el release:', err);
  process.exit(1);
});
