@echo off
chcp 65001 >nul
echo ====================================
echo 文件管理系统 - 启动服务
echo ====================================
echo.

cd backend

echo 正在启动服务...
echo 首次启动需要下载依赖，请耐心等待...
echo.

if exist "gradlew.bat" (
    call gradlew.bat bootRun
) else (
    echo 正在初始化Gradle Wrapper...
    gradle wrapper
    call gradlew.bat bootRun
)

pause
