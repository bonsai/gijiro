param(
    [string]$RepoPath = "C:\Users\dance\AndroidStudioProjects\GIJI",
    [string]$Message = "",
    [string]$Remote = "",
    [string]$Branch = ""
)

$ErrorActionPreference = 'Stop'

function Resolve-NormalPath([string]$p) {
    return (Resolve-Path -Path $p).Path
}

function Write-Section($text) {
    Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Run-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & git @Args
    if ($LASTEXITCODE -ne 0) {
        throw "git failed: git $($Args -join ' ')"
    }
}

function Try-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
    & git @Args
    return $LASTEXITCODE
}

try {
    if (-not (Test-Path -Path $RepoPath)) {
        throw "RepoPath not found: $RepoPath"
    }

    Write-Section "Preparing"
    Push-Location $RepoPath

    # Ensure Git is available
    $null = & git --version 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Git is not installed or not in PATH." }

    # Verify we're inside a git repo
    $inside = (& git rev-parse --is-inside-work-tree 2>$null)
    if (-not $inside -or $inside.Trim() -ne 'true') {
        throw "Not a git repository: $RepoPath"
    }

    $top = Resolve-NormalPath (& git rev-parse --show-toplevel)
    $repoPathResolved = Resolve-NormalPath $RepoPath

    if ($top -ne $repoPathResolved) {
        throw "Safety check failed. Git toplevel is '$top' but RepoPath is '$repoPathResolved'. Aborting to avoid committing files outside GIJI. Move the .git folder into '$repoPathResolved' or run this script with RepoPath set to '$top'."
    }

    # Determine current branch
    if (-not $Branch) {
        $Branch = (& git rev-parse --abbrev-ref HEAD).Trim()
    }

    # Determine remote
    if (-not $Remote) {
        $remotes = (& git remote) -split "`n" | Where-Object { $_ -ne '' }
        if ($remotes.Count -gt 0) { $Remote = $remotes[0].Trim() } else { $Remote = 'origin' }
    }

    Write-Host "Repo:  $repoPathResolved" -ForegroundColor DarkGray
    Write-Host "Top:   $top" -ForegroundColor DarkGray
    Write-Host "Remote:$Remote" -ForegroundColor DarkGray
    Write-Host "Branch:$Branch" -ForegroundColor DarkGray

    Write-Section "Fetching"
    Run-Git fetch --all --prune

    Write-Section "Staging"
    Run-Git add -A -- .

    # Determine if we have staged changes
    $hasStaged = (Try-Git diff --cached --quiet); $hasStaged = ($hasStaged -ne 0)

    if ($hasStaged) {
        if (-not $Message -or $Message.Trim() -eq '') {
            $Message = "chore: auto-commit $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        }

        Write-Section "Committing"
        Run-Git commit -m $Message
    } else {
        Write-Host "No staged changes to commit." -ForegroundColor Yellow
    }

    Write-Section "Rebasing (pull --rebase --autostash)"
    # Use autostash to avoid local-modification blocks
    $pullExit = Try-Git pull --rebase --autostash $Remote $Branch
    if ($pullExit -ne 0) {
        throw "Pull with rebase failed. Resolve conflicts, then run: git rebase --continue"
    }

    Write-Section "Pushing"
    Run-Git push $Remote $Branch

    Write-Host "`nDone." -ForegroundColor Green
}
catch {
    Write-Error $_
    exit 1
}
finally {
    if ((Get-Location).Path -ne (Resolve-Path $RepoPath).Path) {
        # location may have changed in case of errors
        Set-Location $RepoPath
    }
    Pop-Location -ErrorAction SilentlyContinue
}