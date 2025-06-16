const puppeteer = require('puppeteer');
const axios = require('axios');

const BASE_URL = 'http://localhost:8089';

// 测试结果收集
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
};

// 彩色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function logTest(name, status, error = null) {
    testResults.total++;
    const result = {
        name,
        status,
        timestamp: new Date().toISOString(),
        error: error ? error.message || error : null
    };
    
    if (status === 'pass') {
        testResults.passed++;
        console.log(`${colors.green}✓${colors.reset} ${name}`);
    } else {
        testResults.failed++;
        console.log(`${colors.red}✗${colors.reset} ${name}`);
        if (error) {
            console.log(`  ${colors.red}Error: ${error}${colors.reset}`);
        }
    }
    
    testResults.details.push(result);
}

async function testClientFrontend(browser) {
    console.log(`\n${colors.cyan}=== 测试客户端前端 ===${colors.reset}\n`);
    
    const page = await browser.newPage();
    
    try {
        // 1. 访问首页
        await page.goto(`${BASE_URL}/frontend/index.html`);
        logTest('访问客户端首页', 'pass');
        
        // 2. 检查页面元素
        const elements = {
            '导航栏': '.navbar',
            '搜索区域': '.search-section',
            '技师列表': '#therapistList',
            '门店下拉框': '#storeSelect',
            '搜索按钮': 'button[onclick="searchTherapists()"]'
        };
        
        for (const [name, selector] of Object.entries(elements)) {
            const element = await page.$(selector);
            if (element) {
                logTest(`页面元素存在 - ${name}`, 'pass');
            } else {
                logTest(`页面元素存在 - ${name}`, 'fail', `找不到选择器: ${selector}`);
            }
        }
        
        // 3. 等待门店数据加载
        await page.waitForTimeout(2000);
        const storeOptions = await page.$$eval('#storeSelect option', options => options.length);
        if (storeOptions > 1) {
            logTest('门店下拉框数据加载', 'pass');
        } else {
            logTest('门店下拉框数据加载', 'fail', '门店数据未加载');
        }
        
        // 4. 检查技师列表是否有数据
        const therapistCards = await page.$$('.therapist-card');
        if (therapistCards.length > 0) {
            logTest('推荐技师显示', 'pass');
        } else {
            logTest('推荐技师显示', 'fail', '没有显示技师');
        }
        
        // 5. 测试搜索功能
        await page.select('#experienceSelect', '5');
        await page.click('button[onclick="searchTherapists()"]');
        await page.waitForTimeout(1000);
        logTest('搜索技师功能', 'pass');
        
        // 6. 测试预约模态框
        const bookButton = await page.$('.book-btn');
        if (bookButton) {
            await bookButton.click();
            await page.waitForSelector('#appointmentModal', { visible: true, timeout: 5000 });
            logTest('打开预约模态框', 'pass');
            
            // 关闭模态框
            await page.click('#appointmentModal .close');
            await page.waitForTimeout(500);
        } else {
            logTest('打开预约模态框', 'fail', '找不到预约按钮');
        }
        
    } catch (error) {
        logTest('客户端前端测试', 'fail', error);
    } finally {
        await page.close();
    }
}

async function testAdminFrontend(browser) {
    console.log(`\n${colors.cyan}=== 测试管理端前端 ===${colors.reset}\n`);
    
    const page = await browser.newPage();
    
    try {
        // 1. 访问管理页面
        await page.goto(`${BASE_URL}/frontend/admin.html`);
        logTest('访问管理端页面', 'pass');
        
        // 2. 检查登录表单
        const loginForm = await page.$('#loginForm');
        if (loginForm) {
            logTest('登录表单存在', 'pass');
        } else {
            logTest('登录表单存在', 'fail');
        }
        
        // 3. 测试登录
        await page.type('#username', 'admin');
        await page.type('#password', 'admin123');
        await page.click('#loginForm button[type="submit"]');
        
        // 等待登录成功
        await page.waitForTimeout(2000);
        
        // 检查是否跳转到管理界面
        const adminPage = await page.$('#adminPage');
        const isVisible = await page.evaluate(() => {
            const adminPage = document.getElementById('adminPage');
            return adminPage && adminPage.style.display !== 'none';
        });
        
        if (isVisible) {
            logTest('管理员登录', 'pass');
        } else {
            logTest('管理员登录', 'fail', '登录后未显示管理界面');
        }
        
        // 4. 检查管理界面元素
        const adminElements = {
            '侧边栏': '.sidebar',
            '数据概览': '#dashboardSection',
            '技师管理链接': 'a[onclick*="therapists"]',
            '预约管理链接': 'a[onclick*="appointments"]',
            '门店管理链接': 'a[onclick*="stores"]'
        };
        
        for (const [name, selector] of Object.entries(adminElements)) {
            const element = await page.$(selector);
            if (element) {
                logTest(`管理界面元素 - ${name}`, 'pass');
            } else {
                logTest(`管理界面元素 - ${name}`, 'fail', `找不到选择器: ${selector}`);
            }
        }
        
        // 5. 测试切换到技师管理
        await page.click('a[onclick*="therapists"]');
        await page.waitForTimeout(1000);
        const therapistSection = await page.$('#therapistsSection');
        const isTherapistVisible = await page.evaluate(() => {
            const section = document.getElementById('therapistsSection');
            return section && section.style.display !== 'none';
        });
        
        if (isTherapistVisible) {
            logTest('切换到技师管理', 'pass');
        } else {
            logTest('切换到技师管理', 'fail');
        }
        
        // 6. 测试添加技师按钮
        const addButton = await page.$('button[onclick="openAddTherapistModal()"]');
        if (addButton) {
            await addButton.click();
            await page.waitForSelector('#addTherapistModal', { visible: true, timeout: 5000 });
            logTest('打开添加技师模态框', 'pass');
            
            // 关闭模态框
            await page.click('#addTherapistModal .close');
            await page.waitForTimeout(500);
        } else {
            logTest('打开添加技师模态框', 'fail', '找不到添加按钮');
        }
        
    } catch (error) {
        logTest('管理端前端测试', 'fail', error);
    } finally {
        await page.close();
    }
}

async function runTests() {
    console.log(`${colors.yellow}开始前端测试${colors.reset}`);
    console.log(`测试地址: ${BASE_URL}`);
    console.log(`测试时间: ${new Date().toLocaleString('zh-CN')}`);
    
    // 确保服务器正在运行
    try {
        await axios.get(`${BASE_URL}/health`);
        console.log(`${colors.green}服务器连接成功${colors.reset}`);
    } catch (error) {
        console.error(`${colors.red}无法连接到服务器，请确保服务器正在运行${colors.reset}`);
        process.exit(1);
    }
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        await testClientFrontend(browser);
        await testAdminFrontend(browser);
    } finally {
        await browser.close();
    }
    
    // 输出测试结果
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    
    console.log(`\n${colors.cyan}=== 测试结果汇总 ===${colors.reset}`);
    console.log(`总测试数: ${testResults.total}`);
    console.log(`${colors.green}通过: ${testResults.passed}${colors.reset}`);
    console.log(`${colors.red}失败: ${testResults.failed}${colors.reset}`);
    console.log(`成功率: ${successRate}%`);
    
    // 写入测试报告
    const fs = require('fs');
    const report = {
        summary: {
            total: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: `${successRate}%`,
            timestamp: new Date().toISOString(),
            type: 'frontend'
        },
        details: testResults.details
    };
    
    fs.writeFileSync('frontend-test-report.json', JSON.stringify(report, null, 2));
    console.log(`\n测试报告已保存到: frontend-test-report.json`);
    
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// 运行测试
runTests().catch(error => {
    console.error(`${colors.red}测试过程中发生错误:${colors.reset}`, error);
    process.exit(1);
});