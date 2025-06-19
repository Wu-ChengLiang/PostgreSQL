import sqlite3

try:
    conn = sqlite3.connect('mingyi.db')
    cursor = conn.cursor()
    
    # 查看users表结构
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    print("users表结构:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    print("\n查询最近的预约记录和用户信息:")
    cursor.execute('''
        SELECT a.id, u.username, u.phone, a.therapist_id, a.appointment_date, a.start_time, a.notes
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.appointment_date = '2025-06-19' 
        ORDER BY a.created_at DESC 
        LIMIT 5
    ''')
    
    appointments = cursor.fetchall()
    for apt in appointments:
        print(f'ID: {apt[0]}, 用户: {apt[1]}, 电话: {apt[2]}, 技师ID: {apt[3]}, 日期: {apt[4]}, 时间: {apt[5]}, 备注: {apt[6]}')
    
    # 查看用户ID为38的详细信息
    print("\n查看用户ID为38的详细信息:")
    cursor.execute('SELECT * FROM users WHERE id = 38')
    user = cursor.fetchone()
    if user:
        print(f'用户详情: {user}')
    else:
        print('未找到用户ID为38的用户')
    
    # 查看预约ID为49的详细信息
    print("\n查看预约ID为49的详细信息:")
    cursor.execute('SELECT * FROM appointments WHERE id = 49')
    appointment = cursor.fetchone()
    if appointment:
        print(f'预约详情: {appointment}')
    
    # 查看前端可能使用的表或视图
    print("\n查看数据库中所有表:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(f"  {table[0]}")
    
    conn.close()
except Exception as e:
    print(f'查询失败: {e}') 