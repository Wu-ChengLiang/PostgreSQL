const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库连接
const dbPath = path.join(process.cwd(), 'mingyi.db');

class MemberService {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    // 通过手机号查询会员信息
    async getMemberByPhone(phone) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, name, phone, email, gender, age, member_level,
                       membership_number, balance, points, total_spent, discount_rate,
                       medical_record_number, constitution_type, allergies,
                       emergency_contact_name, emergency_contact_phone,
                       sms_notifications, sms_marketing, status,
                       created_at, updated_at
                FROM users 
                WHERE phone = ?
            `;
            
            this.db.get(sql, [phone], (err, row) => {
                if (err) {
                    reject(new Error(`查询会员失败: ${err.message}`));
                    return;
                }
                
                if (!row) {
                    reject(new Error('会员不存在'));
                    return;
                }
                
                resolve(row);
            });
        });
    }

    // 创建新会员
    async createMember(memberData) {
        return new Promise((resolve, reject) => {
            const { name, phone, email, gender, age } = memberData;
            
            // 生成会员编号和病历号
            const membershipNumber = this.generateMembershipNumber();
            const medicalRecordNumber = this.generateMedicalRecordNumber();
            
            const sql = `
                INSERT INTO users (name, phone, email, gender, age, 
                                 membership_number, medical_record_number, 
                                 constitution_type, sms_notifications, sms_marketing, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, '待辨识', 1, 1, 'ACTIVE')
            `;
            
            this.db.run(sql, [name, phone, email, gender, age, membershipNumber, medicalRecordNumber], function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        reject(new Error('手机号已存在'));
                    } else {
                        reject(new Error(`创建会员失败: ${err.message}`));
                    }
                    return;
                }
                
                // 返回新创建的会员信息
                resolve({
                    id: this.lastID,
                    name,
                    phone,
                    email,
                    gender,
                    age,
                    membership_number: membershipNumber,
                    medical_record_number: medicalRecordNumber,
                    balance: 0,
                    points: 0,
                    member_level: 'normal',
                    status: 'ACTIVE'
                });
            });
        });
    }

    // 会员充值
    async recharge(phone, amount, paymentMethod = 'CASH', description = '会员充值') {
        return new Promise((resolve, reject) => {
            const db = this.db; // 保存数据库引用
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // 获取当前余额
                db.get('SELECT balance, total_spent FROM users WHERE phone = ?', [phone], (err, user) => {
                    if (err || !user) {
                        db.run('ROLLBACK');
                        reject(new Error('会员不存在'));
                        return;
                    }
                    
                    const oldBalance = parseFloat(user.balance) || 0;
                    const newBalance = oldBalance + parseFloat(amount);
                    const newTotalSpent = parseFloat(user.total_spent) + parseFloat(amount);
                    
                    // 更新用户余额和总消费
                    db.run(
                        'UPDATE users SET balance = ?, total_spent = ? WHERE phone = ?',
                        [newBalance, newTotalSpent, phone],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(new Error(`更新余额失败: ${err.message}`));
                                return;
                            }
                            
                            // 记录交易
                            db.run(
                                `INSERT INTO user_transactions 
                                 (user_phone, transaction_type, amount, balance_before, balance_after, 
                                  description, payment_method) 
                                 VALUES (?, 'RECHARGE', ?, ?, ?, ?, ?)`,
                                [phone, amount, oldBalance, newBalance, description, paymentMethod],
                                function(err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        reject(new Error(`记录交易失败: ${err.message}`));
                                        return;
                                    }
                                    
                                    db.run('COMMIT');
                                    resolve({
                                        transaction_id: this.lastID,
                                        old_balance: oldBalance,
                                        new_balance: newBalance,
                                        amount: parseFloat(amount),
                                        transaction_type: 'RECHARGE'
                                    });
                                }
                            );
                        }
                    );
                });
            });
        });
    }

    // 会员消费
    async consume(phone, amount, description = '服务消费') {
        return new Promise((resolve, reject) => {
            const db = this.db; // 保存数据库引用
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');
                
                // 获取会员信息
                db.get(
                    'SELECT balance, points, discount_rate, member_level FROM users WHERE phone = ?', 
                    [phone], 
                    (err, user) => {
                        if (err || !user) {
                            db.run('ROLLBACK');
                            reject(new Error('会员不存在'));
                            return;
                        }
                        
                        const oldBalance = parseFloat(user.balance) || 0;
                        const discountRate = parseFloat(user.discount_rate) || 1.0;
                        const actualAmount = parseFloat(amount) * discountRate;
                        
                        // 检查余额是否足够
                        if (oldBalance < actualAmount) {
                            db.run('ROLLBACK');
                            reject(new Error('余额不足'));
                            return;
                        }
                        
                        const newBalance = oldBalance - actualAmount;
                        const pointsEarned = Math.floor(parseFloat(amount) * 0.01); // 1%积分率
                        const newPoints = parseInt(user.points) + pointsEarned;
                        
                        // 更新用户余额和积分
                        db.run(
                            'UPDATE users SET balance = ?, points = ? WHERE phone = ?',
                            [newBalance, newPoints, phone],
                            (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    reject(new Error(`更新余额失败: ${err.message}`));
                                    return;
                                }
                                
                                // 记录交易
                                db.run(
                                    `INSERT INTO user_transactions 
                                     (user_phone, transaction_type, amount, balance_before, balance_after, 
                                      points_earned, description) 
                                     VALUES (?, 'CONSUME', ?, ?, ?, ?, ?)`,
                                    [phone, actualAmount, oldBalance, newBalance, pointsEarned, description],
                                    function(err) {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            reject(new Error(`记录交易失败: ${err.message}`));
                                            return;
                                        }
                                        
                                        db.run('COMMIT');
                                        resolve({
                                            transaction_id: this.lastID,
                                            old_balance: oldBalance,
                                            new_balance: newBalance,
                                            amount: actualAmount,
                                            points_earned: pointsEarned,
                                            transaction_type: 'CONSUME'
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });
    }

    // 获取交易记录
    async getTransactionHistory(phone, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT id, transaction_type, amount, balance_before, balance_after,
                       points_earned, description, payment_method, created_at
                FROM user_transactions 
                WHERE user_phone = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `;
            
            this.db.all(sql, [phone, limit], (err, rows) => {
                if (err) {
                    reject(new Error(`查询交易记录失败: ${err.message}`));
                    return;
                }
                
                resolve(rows || []);
            });
        });
    }

    // 更新会员等级
    async updateMemberLevel(phone) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT total_spent, member_level FROM users WHERE phone = ?', [phone], (err, user) => {
                if (err || !user) {
                    reject(new Error('会员不存在'));
                    return;
                }
                
                const totalSpent = parseFloat(user.total_spent) || 0;
                let newLevel = 'normal';
                let discountRate = 1.0;
                
                // 根据消费金额确定等级
                if (totalSpent >= 20000) {
                    newLevel = 'diamond';
                    discountRate = 0.85;
                } else if (totalSpent >= 5000) {
                    newLevel = 'gold';
                    discountRate = 0.9;
                } else if (totalSpent >= 1000) {
                    newLevel = 'silver';
                    discountRate = 0.95;
                }
                
                // 如果等级有变化，更新数据库
                if (newLevel !== user.member_level) {
                    this.db.run(
                        'UPDATE users SET member_level = ?, discount_rate = ? WHERE phone = ?',
                        [newLevel, discountRate, phone],
                        (err) => {
                            if (err) {
                                reject(new Error(`更新会员等级失败: ${err.message}`));
                                return;
                            }
                            resolve({ old_level: user.member_level, new_level: newLevel });
                        }
                    );
                } else {
                    resolve({ old_level: user.member_level, new_level: newLevel });
                }
            });
        });
    }

    // 生成会员编号
    generateMembershipNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `VIP${year}${month}${random}`;
    }

    // 生成病历号
    generateMedicalRecordNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `TCM${year}${month}${random}`;
    }

    // 关闭数据库连接
    close() {
        this.db.close();
    }
}

module.exports = new MemberService(); 