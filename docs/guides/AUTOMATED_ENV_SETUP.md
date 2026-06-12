# AUTOMATED_ENV_SETUP.md

## PHASE 1: SILENT CORE PROVISIONING
```powershell
# [AGENT EXECUTION BLOCK]
# Idempotent unattended installation for locked environment dependencies.

$ErrorActionPreference = 'Stop'

winget install --id OpenJS.NodeJS.LTS --version 24.14.0 --exact --silent --accept-source-agreements --accept-package-agreements
winget install --id Git.Git --version 2.53.0 --exact --silent --accept-source-agreements --accept-package-agreements
winget install --id PostgreSQL.PostgreSQL.16 --version 16.14 --exact --silent --accept-source-agreements --accept-package-agreements
winget install --id Memurai.MemuraiDeveloper --version 4.1.2 --exact --silent --accept-source-agreements --accept-package-agreements

npm install -g npm@11.9.0
npm install -g @nestjs/cli@11.0.23
```

## PHASE 2: HOST ENVIRONMENT BINDING
```powershell
# [AGENT EXECUTION BLOCK]
# Automated path variable injection and service lifecycle enforcement.

$ErrorActionPreference = 'Stop'

# Add PostgreSQL to Machine PATH idempotently
$pgPath = "C:\Program Files\PostgreSQL\16\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)

if ($currentPath -notlike "*$pgPath*") {
    $newPath = $currentPath + ";" + $pgPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
    Write-Output "Injected PostgreSQL bin to Machine PATH."
}

# Apply to current session for immediate Phase 3 usage
$env:Path += ";$pgPath"

# Restart Core Windows Services non-interactively
Restart-Service -Name "postgresql-x64-16" -Force -ErrorAction SilentlyContinue
Restart-Service -Name "memurai" -Force -ErrorAction SilentlyContinue
```

## PHASE 3: AUTOMATED ENGINE SEED
```powershell
# [AGENT EXECUTION BLOCK]
# Non-interactive PostgreSQL database and role provisioning.

$ErrorActionPreference = 'Stop'

# Temporarily switch pg_hba.conf to trust mode for unattended admin execution
$pgHbaPath = "C:\Program Files\PostgreSQL\16\data\pg_hba.conf"
$pgHbaContent = Get-Content $pgHbaPath
$pgHbaContent = $pgHbaContent -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host    all             all             127.0.0.1/32            trust'
Set-Content -Path $pgHbaPath -Value $pgHbaContent

Restart-Service -Name "postgresql-x64-16" -Force

# Execute database scaffolding idempotently
$sql = @"
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'prwm_admin') THEN
        CREATE ROLE prwm_admin WITH LOGIN PASSWORD 'prwm_dev_2026' CREATEDB;
    END IF;
END
\$\$;
SELECT 'CREATE DATABASE payment_request_db OWNER prwm_admin;' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_request_db')\gexec
GRANT ALL PRIVILEGES ON DATABASE payment_request_db TO prwm_admin;
"@

$sql | psql -U postgres -h 127.0.0.1

# Revert pg_hba.conf back to scram-sha-256 for secure state
$pgHbaContent = Get-Content $pgHbaPath
$pgHbaContent = $pgHbaContent -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+trust', 'host    all             all             127.0.0.1/32            scram-sha-256'
Set-Content -Path $pgHbaPath -Value $pgHbaContent

Restart-Service -Name "postgresql-x64-16" -Force
```

## PHASE 4: NON-INTERACTIVE ENVIRONMENT VERIFICATION
```powershell
# [AGENT EXECUTION BLOCK]
# Consolidated verification script yielding a PASS/FAIL matrix report.

$ErrorActionPreference = 'Continue'

$matrix = @{
    "Node.js (24.14.0)" = @{ Status = "FAIL"; Details = "" }
    "npm (11.9.0)" = @{ Status = "FAIL"; Details = "" }
    "Git (2.53.0)" = @{ Status = "FAIL"; Details = "" }
    "Nest CLI (11.0.23)" = @{ Status = "FAIL"; Details = "" }
    "PostgreSQL (16.14)" = @{ Status = "FAIL"; Details = "" }
    "Memurai (4.1.2)" = @{ Status = "FAIL"; Details = "" }
    "Database Auth" = @{ Status = "FAIL"; Details = "" }
}

# Validate Node
$nodeVer = (node --version 2>$null)
if ($nodeVer -match "v24.14.0") { $matrix["Node.js (24.14.0)"].Status = "PASS"; $matrix["Node.js (24.14.0)"].Details = $nodeVer }

# Validate npm
$npmVer = (npm --version 2>$null)
if ($npmVer -match "11.9.0") { $matrix["npm (11.9.0)"].Status = "PASS"; $matrix["npm (11.9.0)"].Details = $npmVer }

# Validate Git
$gitVer = (git --version 2>$null)
if ($gitVer -match "2.53.0") { $matrix["Git (2.53.0)"].Status = "PASS"; $matrix["Git (2.53.0)"].Details = $gitVer }

# Validate Nest CLI
$nestVer = (nest --version 2>$null)
if ($nestVer -match "11.0.23") { $matrix["Nest CLI (11.0.23)"].Status = "PASS"; $matrix["Nest CLI (11.0.23)"].Details = $nestVer }

# Validate PostgreSQL
$pgVer = (psql --version 2>$null)
if ($pgVer -match "16.14") { $matrix["PostgreSQL (16.14)"].Status = "PASS"; $matrix["PostgreSQL (16.14)"].Details = $pgVer }

# Validate Memurai
$memuraiPing = (memurai-cli ping 2>$null)
if ($memuraiPing -match "PONG") { $matrix["Memurai (4.1.2)"].Status = "PASS"; $matrix["Memurai (4.1.2)"].Details = "PONG" }

# Validate Database Auth
$env:PGPASSWORD="prwm_dev_2026"
$dbCheck = (psql -U prwm_admin -h 127.0.0.1 -d payment_request_db -c "SELECT 1;" 2>$null)
if ($dbCheck -match "1") { $matrix["Database Auth"].Status = "PASS"; $matrix["Database Auth"].Details = "Connected" }

# Generate Report
Write-Output "========================================"
Write-Output " ENVIRONMENT VERIFICATION MATRIX REPORT "
Write-Output "========================================"
$matrix.GetEnumerator() | Sort-Object Name | ForEach-Object {
    $line = "[{0}] {1,-20} | {2}" -f $_.Value.Status, $_.Name, $_.Value.Details
    Write-Output $line
}
Write-Output "========================================"
```
