const express = require('express');
const router = express.Router();
const database = require('../config/database-sqlite');

// 获取仪表板统计数据
router.get('/stats', async (req, res) => {
  try {
    // 获取各项统计数据
    const storeCount = await database.get('SELECT COUNT(*) as count FROM stores');
    const therapistCount = await database.get('SELECT COUNT(*) as count FROM therapists');
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    const appointmentCount = await database.get('SELECT COUNT(*) as count FROM appointments');
    
    // 获取今日预约数
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await database.get(
      'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
      [today]
    );
    
    // 获取预约状态统计
    const appointmentStats = await database.all(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `);
    
    // 获取本月预约趋势（最近30天）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const appointmentTrend = await database.all(`
      SELECT 
        appointment_date as date,
        COUNT(*) as count
      FROM appointments
      WHERE appointment_date >= ?
      GROUP BY appointment_date
      ORDER BY appointment_date
    `, [thirtyDaysAgo.toISOString().split('T')[0]]);
    
    // 获取热门服务类型
    const popularServices = await database.all(`
      SELECT 
        service_type,
        COUNT(*) as count
      FROM appointments
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 5
    `);
    
    // 获取技师利用率
    const therapistUtilization = await database.all(`
      SELECT 
        t.id,
        t.name,
        t.store_id,
        s.name as store_name,
        COUNT(DISTINCT a.id) as appointment_count,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_count
      FROM therapists t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN appointments a ON t.id = a.therapist_id
      GROUP BY t.id
      ORDER BY appointment_count DESC
      LIMIT 10
    `);
    
    // 计算利用率百分比
    therapistUtilization.forEach(therapist => {
      // 假设每个技师每天最多8个预约，过去30天计算
      const maxAppointments = 8 * 30;
      therapist.utilization_rate = Math.round((therapist.appointment_count / maxAppointments) * 100);
    });
    
    // 获取门店统计
    const storeStats = await database.all(`
      SELECT 
        s.id,
        s.name,
        s.rating,
        COUNT(DISTINCT t.id) as therapist_count,
        COUNT(DISTINCT a.id) as appointment_count
      FROM stores s
      LEFT JOIN therapists t ON s.id = t.store_id
      LEFT JOIN appointments a ON s.id = a.store_id
      GROUP BY s.id
      ORDER BY appointment_count DESC
    `);
    
    res.json({
      success: true,
      stats: {
        total_stores: storeCount.count,
        total_therapists: therapistCount.count,
        total_users: userCount.count,
        total_appointments: appointmentCount.count,
        today_appointments: todayAppointments.count,
        appointment_by_status: appointmentStats,
        appointment_trend: appointmentTrend,
        popular_services: popularServices,
        therapist_utilization: therapistUtilization,
        store_stats: storeStats
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

// 获取营收统计（示例）
router.get('/revenue', async (req, res) => {
  try {
    // 假设每个预约的基础价格
    const servicePrices = {
      '推拿': 198,
      '正骨': 298,
      '艾灸': 168,
      '拔罐': 128,
      '刮痧': 98,
      '理疗': 228,
      '头疗': 188,
      '足疗': 158
    };
    
    // 获取本月完成的预约
    const thisMonth = new Date();
    const firstDayOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const monthlyRevenue = await database.all(`
      SELECT 
        service_type,
        COUNT(*) as count,
        appointment_date
      FROM appointments
      WHERE status = 'completed'
        AND appointment_date >= ?
      GROUP BY service_type, appointment_date
      ORDER BY appointment_date
    `, [firstDayOfMonth.toISOString().split('T')[0]]);
    
    // 计算每日营收
    const dailyRevenue = {};
    let totalRevenue = 0;
    
    monthlyRevenue.forEach(item => {
      const price = servicePrices[item.service_type] || 188;
      const revenue = price * item.count;
      
      if (!dailyRevenue[item.appointment_date]) {
        dailyRevenue[item.appointment_date] = 0;
      }
      dailyRevenue[item.appointment_date] += revenue;
      totalRevenue += revenue;
    });
    
    // 按服务类型统计营收
    const revenueByService = await database.all(`
      SELECT 
        service_type,
        COUNT(*) as count
      FROM appointments
      WHERE status = 'completed'
        AND appointment_date >= ?
      GROUP BY service_type
    `, [firstDayOfMonth.toISOString().split('T')[0]]);
    
    const serviceRevenue = revenueByService.map(item => ({
      service_type: item.service_type,
      count: item.count,
      revenue: (servicePrices[item.service_type] || 188) * item.count
    }));
    
    res.json({
      success: true,
      revenue: {
        total_revenue: totalRevenue,
        daily_revenue: dailyRevenue,
        service_revenue: serviceRevenue,
        average_order_value: totalRevenue / (monthlyRevenue.length || 1)
      }
    });
  } catch (error) {
    console.error('获取营收统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取营收统计失败'
    });
  }
});

// 获取实时数据
router.get('/realtime', async (req, res) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    
    // 获取今日进行中的预约
    const ongoingAppointments = await database.all(`
      SELECT 
        a.*,
        t.name as therapist_name,
        s.name as store_name,
        u.username as user_name
      FROM appointments a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.appointment_date = ?
        AND a.status IN ('confirmed', 'pending')
        AND CAST(SUBSTR(a.start_time, 1, 2) AS INTEGER) <= ?
        AND CAST(SUBSTR(a.end_time, 1, 2) AS INTEGER) > ?
      ORDER BY a.start_time
    `, [today, currentHour, currentHour]);
    
    // 获取今日即将到来的预约（未来2小时内）
    const upcomingAppointments = await database.all(`
      SELECT 
        a.*,
        t.name as therapist_name,
        s.name as store_name,
        u.username as user_name
      FROM appointments a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.appointment_date = ?
        AND a.status IN ('confirmed', 'pending')
        AND CAST(SUBSTR(a.start_time, 1, 2) AS INTEGER) > ?
        AND CAST(SUBSTR(a.start_time, 1, 2) AS INTEGER) <= ?
      ORDER BY a.start_time
      LIMIT 10
    `, [today, currentHour, currentHour + 2]);
    
    // 获取最新预约
    const latestAppointments = await database.all(`
      SELECT 
        a.*,
        t.name as therapist_name,
        s.name as store_name,
        u.username as user_name
      FROM appointments a
      LEFT JOIN therapists t ON a.therapist_id = t.id
      LEFT JOIN stores s ON a.store_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);
    
    res.json({
      success: true,
      realtime: {
        current_time: now.toISOString(),
        ongoing_appointments: ongoingAppointments,
        upcoming_appointments: upcomingAppointments,
        latest_appointments: latestAppointments
      }
    });
  } catch (error) {
    console.error('获取实时数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取实时数据失败'
    });
  }
});

module.exports = router;