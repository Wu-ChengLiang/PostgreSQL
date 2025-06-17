# 智能预约API测试脚本 (PowerShell版)
Write-Host "🤖 智能预约API测试" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

$BASE_URL = "http://localhost:3001"

# 测试1: 马老师16:30预约
Write-Host "`n🧠 测试1: 模拟大模型解析 '我需要调理师-马老师为我服务，预计16:30到店'" -ForegroundColor Cyan
$body1 = @{
    therapist_name = "马老师"
    appointment_time = "16:30"
    customer_name = "联系人_1750127546284"
    store_name = "名医堂·颈肩腰腿特色调理（静安寺店）"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$BASE_URL/api/v1/client/appointments/smart" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ 响应:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: 李老师下午3点
Write-Host "`n🧠 测试2: 模拟大模型解析 '预约今天下午3点钟的李老师'" -ForegroundColor Cyan
$body2 = @{
    therapist_name = "李老师"
    appointment_time = "15:00"
    customer_name = "测试用户A"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL/api/v1/client/appointments/smart" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ 响应:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 只有技师名，其他自动填充
Write-Host "`n🧠 测试3: 模拟大模型解析 '我要预约陈老师' (只有技师名，其他自动填充)" -ForegroundColor Cyan
$body3 = @{
    therapist_name = "陈老师"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$BASE_URL/api/v1/client/appointments/smart" -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "✅ 响应:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: 只有时间，自动匹配技师
Write-Host "`n🧠 测试4: 模拟大模型解析 '我要预约明天上午10点半' (只有时间)" -ForegroundColor Cyan
$body4 = @{
    appointment_time = "10:30"
    appointment_date = "2025-06-18"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "$BASE_URL/api/v1/client/appointments/smart" -Method POST -Body $body4 -ContentType "application/json"
    Write-Host "✅ 响应:" -ForegroundColor Green
    $response4 | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ 错误: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📊 查看门店列表验证API可用性:" -ForegroundColor Yellow
try {
    $stores = Invoke-RestMethod -Uri "$BASE_URL/api/v1/client/stores" -Method GET
    Write-Host "✅ 门店数量: $($stores.data.stores.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法获取门店列表: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ 智能预约测试完成!" -ForegroundColor Green
Write-Host "请在前端查看预约记录是否正确显示" -ForegroundColor Yellow

# 显示使用说明
Write-Host "`n📝 使用说明:" -ForegroundColor Magenta
Write-Host "1. 确保服务器正在运行: npm start" -ForegroundColor White
Write-Host "2. 运行此脚本: .\test_smart_api.ps1" -ForegroundColor White
Write-Host "3. 在浏览器中访问前端查看预约记录" -ForegroundColor White 