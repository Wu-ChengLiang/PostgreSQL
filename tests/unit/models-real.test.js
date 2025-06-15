const database = require('../../src/config/database-sqlite');
const Store = require('../../src/models/Store');
const Therapist = require('../../src/models/Therapist');
const Appointment = require('../../src/models/Appointment');
const User = require('../../src/models/User');
const path = require('path');
const fs = require('fs');

describe('Real Model Tests', () => {
  beforeAll(async () => {
    // 使用测试数据库
    process.env.SQLITE_DB_PATH = path.join(__dirname, '../../test-models.db');
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
    // 清理测试数据库
    if (fs.existsSync(process.env.SQLITE_DB_PATH)) {
      fs.unlinkSync(process.env.SQLITE_DB_PATH);
    }
  });

  describe('Store Model', () => {
    test('应该能够获取所有门店', async () => {
      const stores = await Store.findAll();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);
      expect(stores[0]).toHaveProperty('id');
      expect(stores[0]).toHaveProperty('name');
      expect(stores[0]).toHaveProperty('address');
    });

    test('应该能够根据ID查询门店', async () => {
      const store = await Store.findById(1);
      expect(store).toBeDefined();
      expect(store.id).toBe(1);
      expect(store.name).toBeTruthy();
    });

    test('应该能够按名称搜索门店', async () => {
      const stores = await Store.findByName('莘庄');
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThan(0);
      expect(stores[0].name).toContain('莘庄');
    });

    test('应该能够获取门店统计信息', async () => {
      const stores = await Store.getAllWithStats();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores[0]).toHaveProperty('therapist_count');
      expect(stores[0]).toHaveProperty('appointment_count');
    });
  });

  describe('Therapist Model', () => {
    test('应该能够获取所有技师', async () => {
      const therapists = await Therapist.findAll();
      expect(Array.isArray(therapists)).toBe(true);
      expect(therapists.length).toBeGreaterThan(0);
      expect(therapists[0]).toHaveProperty('name');
      expect(therapists[0]).toHaveProperty('store_id');
    });

    test('应该能够按名称查询技师', async () => {
      const therapists = await Therapist.findByName('陈');
      expect(Array.isArray(therapists)).toBe(true);
      expect(therapists.length).toBeGreaterThan(0);
      expect(therapists[0].name).toContain('陈');
      expect(therapists[0]).toHaveProperty('store_name');
    });

    test('应该能够按门店查询技师', async () => {
      const therapists = await Therapist.findByStore(1);
      expect(Array.isArray(therapists)).toBe(true);
      expect(therapists.length).toBeGreaterThan(0);
      expect(therapists[0].store_id).toBe(1);
    });

    test('应该能够按服务类型查询技师', async () => {
      const therapists = await Therapist.findByServiceType('推拿');
      expect(Array.isArray(therapists)).toBe(true);
      expect(therapists.length).toBeGreaterThan(0);
      expect(therapists[0].service_types).toContain('推拿');
    });

    test('应该能够获取技师可用时间', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      const slots = await Therapist.getAvailableSlots(1, dateStr);
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toHaveProperty('start');
      expect(slots[0]).toHaveProperty('end');
    });
  });

  describe('Appointment Model', () => {
    let testUserId;
    let testAppointmentId;

    beforeAll(async () => {
      // 创建测试用户
      const timestamp = Date.now();
      const user = await User.createUser({
        username: `testappointment_${timestamp}`,
        email: `testappointment_${timestamp}@example.com`,
        phone: '13800000000',
        password: 'test123'
      });
      testUserId = user.id;
    });

    test('应该能够创建预约', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const appointment = await Appointment.createAppointment({
        user_id: testUserId,
        therapist_id: 1,
        store_id: 1,
        service_type: '推拿',
        appointment_date: dateStr,
        start_time: '10:00',
        end_time: '11:00',
        notes: '测试预约'
      });

      expect(appointment.id).toBeDefined();
      expect(appointment.status).toBe('pending');
      testAppointmentId = appointment.id;
    });

    test('应该检测时间冲突', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await expect(Appointment.createAppointment({
        user_id: testUserId,
        therapist_id: 1,
        store_id: 1,
        service_type: '推拿',
        appointment_date: dateStr,
        start_time: '10:30',
        end_time: '11:30'
      })).rejects.toThrow('该时间段已被预约');
    });

    test('应该能够查询用户预约', async () => {
      const appointments = await Appointment.findByUser(testUserId);
      expect(Array.isArray(appointments)).toBe(true);
      expect(appointments.length).toBeGreaterThan(0);
      expect(appointments[0]).toHaveProperty('therapist_name');
      expect(appointments[0]).toHaveProperty('store_name');
    });

    test('应该能够更新预约状态', async () => {
      const updated = await Appointment.confirm(testAppointmentId);
      expect(updated.status).toBe('confirmed');
    });

    test('应该能够取消预约', async () => {
      const cancelled = await Appointment.cancel(testAppointmentId);
      expect(cancelled.status).toBe('cancelled');
    });

    test('应该能够获取预约统计', async () => {
      const stats = await Appointment.getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('confirmed');
      expect(stats).toHaveProperty('cancelled');
      expect(stats).toHaveProperty('completed');
    });
  });

  describe('User Model', () => {
    let testUserId = null;
    let testUsername = null;

    test('应该能够创建用户', async () => {
      const timestamp = Date.now();
      testUsername = `newuser_${timestamp}`;
      const user = await User.createUser({
        username: testUsername,
        email: `newuser_${timestamp}@example.com`,
        phone: '13900000000',
        password: 'password123'
      });

      expect(user.id).toBeDefined();
      expect(user.username).toBe(testUsername);
      expect(user.password_hash).toBeUndefined(); // 不应返回密码
      testUserId = user.id;
    });

    test('应该拒绝重复用户名', async () => {
      await expect(User.createUser({
        username: testUsername,
        email: 'another@example.com',
        password: 'password123'
      })).rejects.toThrow('用户名已存在');
    });

    test('应该能够验证用户密码', async () => {
      const user = await User.verifyPassword(testUsername, 'password123');
      expect(user).toBeDefined();
      expect(user.username).toBe(testUsername);
      expect(user.password_hash).toBeUndefined();
    });

    test('应该拒绝错误密码', async () => {
      const user = await User.verifyPassword(testUsername, 'wrongpassword');
      expect(user).toBeNull();
    });

    test('应该能够更新用户密码', async () => {
      // 首先获取用户ID
      const userInfo = await User.findByUsername(testUsername);
      expect(userInfo).toBeDefined();
      
      await User.updatePassword(userInfo.id, 'newpassword123');
      const user = await User.verifyPassword(testUsername, 'newpassword123');
      expect(user).toBeDefined();
    });

    test('应该能够搜索用户', async () => {
      const users = await User.search('newuser_');
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].username).toContain('newuser_');
      expect(users[0].password_hash).toBeUndefined();
    });
  });
});