const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    
    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱和密码为必填项'
      });
    }
    
    // 创建用户
    const user = await User.createUser({
      username,
      email,
      phone,
      password
    });
    
    // 生成令牌
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    
    if (error.message === '用户名已存在') {
      return res.status(409).json({
        success: false,
        error: '用户名已存在'
      });
    }
    
    if (error.message === '邮箱已被注册') {
      return res.status(409).json({
        success: false,
        error: '邮箱已被注册'
      });
    }
    
    res.status(500).json({
      success: false,
      error: '用户注册失败'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '请提供用户名和密码'
      });
    }
    
    // 验证用户
    const user = await User.verifyPassword(username, password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    // 生成令牌
    const token = generateToken(user);
    
    res.json({
      success: true,
      user: user,
      token: token
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      error: '用户登录失败'
    });
  }
});

// 获取用户信息
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await User.getUserInfo(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

// 获取用户统计信息
router.get('/:id/stats', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const stats = await User.getUserStats(id);
    
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户统计失败'
    });
  }
});

// 更新用户信息
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { email, phone } = req.body;
    
    const updateData = {};
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    
    const user = await User.update(id, updateData);
    delete user.password_hash;
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    });
  }
});

// 修改密码
router.put('/:id/password', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { old_password, new_password } = req.body;
    
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: '请提供旧密码和新密码'
      });
    }
    
    // 获取用户信息
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }
    
    // 验证旧密码
    const validUser = await User.verifyPassword(user.username, old_password);
    if (!validUser) {
      return res.status(401).json({
        success: false,
        error: '旧密码错误'
      });
    }
    
    // 更新密码
    await User.updatePassword(id, new_password);
    
    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败'
    });
  }
});

// 搜索用户
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: '请提供搜索关键词'
      });
    }
    
    const users = await User.search(keyword);
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('搜索用户失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索用户失败'
    });
  }
});

// 获取所有用户（管理员功能）
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({}, { orderBy: 'created_at DESC' });
    
    // 移除密码哈希
    const safeUsers = users.map(user => {
      delete user.password_hash;
      return user;
    });
    
    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
});

module.exports = router;