#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import json

def check_database_structure():
    """检查数据库结构和数据"""
    conn = sqlite3.connect('mingyi.db')
    cursor = conn.cursor()
    
    try:
        print("🗄️ 数据库结构分析")
        print("=" * 60)
        
        # 获取所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        print(f"📋 数据库中共有 {len(tables)} 个表:")
        for table in tables:
            print(f"  - {table[0]}")
        
        print("\n" + "=" * 60)
        
        # 重点分析门店和技师相关的表
        important_tables = ['stores', 'therapists', 'appointments', 'users']
        
        for table_name in important_tables:
            if (table_name,) in tables:
                print(f"\n🔍 分析表: {table_name}")
                print("-" * 40)
                
                # 获取表结构
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                
                print("📊 字段结构:")
                for col in columns:
                    print(f"  {col[1]} ({col[2]}) {'- 主键' if col[5] else ''} {'- 非空' if col[3] else ''}")
                
                # 获取数据量
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"📈 数据量: {count} 条记录")
                
                # 显示几条示例数据
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                    rows = cursor.fetchall()
                    if rows:
                        print("📝 示例数据:")
                        for i, row in enumerate(rows, 1):
                            print(f"  记录{i}: {row}")
        
        print("\n" + "=" * 60)
        print("✅ 数据库结构分析完成")
        
    except Exception as e:
        print(f"❌ 数据库分析失败: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_database_structure() 