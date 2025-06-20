import sqlite3
from datetime import datetime

conn = sqlite3.connect('dianping_history.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print('=== 查询所有UTC时间戳消息（含Z） ===')
cursor.execute('''
    SELECT chat_id, role, content, timestamp, processed_at 
    FROM messages 
    WHERE chat_id LIKE '%1701529693%' 
      AND timestamp LIKE '%Z'
    ORDER BY timestamp DESC 
    LIMIT 20
''')

for i, row in enumerate(cursor.fetchall()):
    print(f'{i+1}. Role: {row["role"]:<10} | Timestamp: {row["timestamp"]} | Content: {row["content"][:30]}...')

print('\n=== 查询所有消息按原始timestamp排序 ===')
cursor.execute('''
    SELECT chat_id, role, content, timestamp, processed_at 
    FROM messages 
    WHERE chat_id LIKE '%1701529693%'
    ORDER BY timestamp DESC 
    LIMIT 10
''')

for i, row in enumerate(cursor.fetchall()):
    print(f'{i+1}. Role: {row["role"]:<10} | Timestamp: {row["timestamp"]} | Content: {row["content"][:30]}...')

print('\n=== 使用修正后的SQL查询最后一条消息 ===')
cursor.execute("""
    SELECT role, timestamp, content FROM messages 
    WHERE chat_id LIKE '%1701529693%' 
    ORDER BY 
        CASE 
            WHEN timestamp LIKE '%Z' THEN 
                datetime(substr(timestamp, 1, 19), '+8 hours')  -- UTC转本地
            ELSE 
                datetime(substr(timestamp, 1, 19))              -- 已是本地时间
        END DESC,
        rowid DESC  -- 使用rowid作为额外排序条件
    LIMIT 1
""")

last_msg = cursor.fetchone()
if last_msg:
    print(f'最后一条消息（修正SQL）: Role={last_msg["role"]}, Timestamp={last_msg["timestamp"]}, Content={last_msg["content"][:50]}...')
else:
    print('没有找到消息')

print('\n=== 查询最近5条消息（修正排序） ===')
cursor.execute("""
    SELECT role, timestamp, content FROM messages 
    WHERE chat_id LIKE '%1701529693%' 
    ORDER BY 
        CASE 
            WHEN timestamp LIKE '%Z' THEN 
                datetime(substr(timestamp, 1, 19), '+8 hours')  -- UTC转本地
            ELSE 
                datetime(substr(timestamp, 1, 19))              -- 已是本地时间
        END DESC,
        rowid DESC  -- 使用rowid作为额外排序条件
    LIMIT 5
""")

for i, row in enumerate(cursor.fetchall()):
    print(f'{i+1}. Role: {row["role"]:<10} | Timestamp: {row["timestamp"]} | Content: {row["content"][:30]}...')

conn.close() 