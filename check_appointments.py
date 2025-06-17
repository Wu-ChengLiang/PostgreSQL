import sqlite3
import json

# 连接数据库
conn = sqlite3.connect('mingyi.db')
cursor = conn.cursor()

# 查询最新的预约记录
cursor.execute("""
SELECT 
    id, 
    customer_name, 
    therapist_name, 
    appointment_date, 
    appointment_time, 
    status,
    store_name,
    created_at
FROM appointments 
ORDER BY id DESC 
LIMIT 10
""")

rows = cursor.fetchall()

print("=== 最新10条预约记录 ===")
if not rows:
    print("❌ 没有找到任何预约记录")
else:
    for i, row in enumerate(rows, 1):
        print(f"{i}. ID:{row[0]} 客户:{row[1]} 技师:{row[2]} 时间:{row[3]} {row[4]} 状态:{row[5]} 门店:{row[6] or '未设置'} 创建时间:{row[7]}")

# 查询预约总数
cursor.execute("SELECT COUNT(*) FROM appointments")
total = cursor.fetchone()[0]
print(f"\n📊 总预约数: {total}")

# 查询今天的预约
cursor.execute("SELECT COUNT(*) FROM appointments WHERE appointment_date = '2025-06-17'")
today_count = cursor.fetchone()[0]
print(f"📅 今天的预约数: {today_count}")

conn.close() 