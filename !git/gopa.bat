@echo off
if "%~1"=="" (
    echo Не указано сообщение для коммита!
    echo Использование: gopa "commit message"
    exit /b 1
)

git add .
git commit -m "%~1"
git push
