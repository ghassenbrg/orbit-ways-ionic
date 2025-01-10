@echo off

echo Building the application...
ionic build --prod && (
    echo Ionic build succeeded!
    echo Building the Docker image...
    docker build -t ghassenbrg/orbit-ways-ionic:1.0.0-SNAPSHOT ./ && (
        echo Docker image built successfully!
        echo Build completed successfully!
    ) || (
        echo Docker build failed!
        exit /b 1
    )
) || (
    echo Ionic build failed!
    exit /b 1
)
pause
