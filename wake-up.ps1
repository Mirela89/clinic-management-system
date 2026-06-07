Write-Host "MediCare+ - Pornire servicii Render..." -ForegroundColor Cyan

$services = @(
    @{ Name = "Discovery Server"; Url = "https://medicare-discovery.onrender.com/actuator/health" },
    @{ Name = "User Service"; Url = "https://medicare-user.onrender.com/actuator/health" },
    @{ Name = "Notification"; Url = "https://medicare-notification.onrender.com/actuator/health" },
    @{ Name = "Medical Service"; Url = "https://medicare-medical.onrender.com/actuator/health" },
    @{ Name = "API Gateway"; Url = "https://medicare-gateway-cwpx.onrender.com/actuator/health" }
)

foreach ($service in $services)
{
    Write-Host "Pornesc $( $service.Name )..." -ForegroundColor Yellow
    try
    {
        $response = Invoke-WebRequest -Uri $service.Url -TimeoutSec 90 -UseBasicParsing
        Write-Host "$( $service.Name ) - UP" -ForegroundColor Green
    }
    catch
    {
        Write-Host "  $( $service.Name ) - pornire lenta, continui..." -ForegroundColor Red
    }
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "Gata! Asteapta 2-3 minute apoi acceseaza:" -ForegroundColor Green
Write-Host "   https://medicare-frontend-l3e5.onrender.com" -ForegroundColor Cyan