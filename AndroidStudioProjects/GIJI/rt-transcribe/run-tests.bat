@echo off
echo Running tests...
"%ProgramFiles%\nodejs\node.exe" test.js
if %ERRORLEVEL% EQU 0 (
    echo Tests completed successfully!
) else (
    echo Tests failed with error code %ERRORLEVEL%
)
pause
