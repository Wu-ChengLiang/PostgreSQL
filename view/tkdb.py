#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库查看器 - Tkinter桌面应用
用于查看mingyi.db数据库中的所有表数据
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import sqlite3
import os
from datetime import datetime

class DatabaseViewer:
    def __init__(self, root):
        self.root = root
        self.root.title("数据库查看器")
        self.root.geometry("1200x800")
        
        # 数据库路径
        self.db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'mingyi.db')
        
        # 检查数据库文件
        if not os.path.exists(self.db_path):
            messagebox.showerror("错误", f"数据库文件不存在: {self.db_path}")
            root.quit()
            return
        
        self.setup_ui()
        self.load_tables()
    
    def setup_ui(self):
        """设置用户界面"""
        # 主框架
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 配置行列权重
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        # 标题
        title_label = ttk.Label(main_frame, text="数据库查看器", font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # 左侧表列表
        left_frame = ttk.LabelFrame(main_frame, text="数据库表", padding="10")
        left_frame.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # 表列表
        self.table_listbox = tk.Listbox(left_frame, width=30)
        self.table_listbox.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        self.table_listbox.bind('<<ListboxSelect>>', self.on_table_select)
        
        # 表列表滚动条
        table_scrollbar = ttk.Scrollbar(left_frame, orient="vertical", command=self.table_listbox.yview)
        table_scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.table_listbox.configure(yscrollcommand=table_scrollbar.set)
        
        left_frame.columnconfigure(0, weight=1)
        left_frame.rowconfigure(0, weight=1)
        
        # 右侧数据显示区域
        right_frame = ttk.LabelFrame(main_frame, text="表数据", padding="10")
        right_frame.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 表信息标签
        self.info_label = ttk.Label(right_frame, text="请选择一个表查看数据")
        self.info_label.grid(row=0, column=0, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 数据表格
        self.tree = ttk.Treeview(right_frame)
        self.tree.grid(row=1, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 数据表格滚动条
        tree_v_scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=self.tree.yview)
        tree_v_scrollbar.grid(row=1, column=1, sticky=(tk.N, tk.S))
        self.tree.configure(yscrollcommand=tree_v_scrollbar.set)
        
        tree_h_scrollbar = ttk.Scrollbar(right_frame, orient="horizontal", command=self.tree.xview)
        tree_h_scrollbar.grid(row=2, column=0, sticky=(tk.W, tk.E))
        self.tree.configure(xscrollcommand=tree_h_scrollbar.set)
        
        # 配置权重
        right_frame.columnconfigure(0, weight=1)
        right_frame.rowconfigure(1, weight=1)
        
        # 底部按钮框架
        button_frame = ttk.Frame(right_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=(10, 0), sticky=(tk.W, tk.E))
        
        # 刷新按钮
        self.refresh_btn = ttk.Button(button_frame, text="刷新数据", command=self.refresh_current_table)
        self.refresh_btn.grid(row=0, column=0, padx=(0, 10))
        
        # 导出按钮
        self.export_btn = ttk.Button(button_frame, text="导出CSV", command=self.export_to_csv)
        self.export_btn.grid(row=0, column=1, padx=(0, 10))
        
        # 表结构按钮
        self.schema_btn = ttk.Button(button_frame, text="查看表结构", command=self.show_table_schema)
        self.schema_btn.grid(row=0, column=2)
        
        # 状态栏
        self.status_var = tk.StringVar()
        self.status_var.set("就绪")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
    
    def get_db_connection(self):
        """获取数据库连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def load_tables(self):
        """加载所有表名"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            
            self.table_listbox.delete(0, tk.END)
            for table in tables:
                self.table_listbox.insert(tk.END, table)
            
            self.status_var.set(f"找到 {len(tables)} 个表")
            
        except Exception as e:
            messagebox.showerror("错误", f"加载表列表失败: {str(e)}")
    
    def on_table_select(self, event):
        """表选择事件处理"""
        selection = self.table_listbox.curselection()
        if selection:
            table_name = self.table_listbox.get(selection[0])
            self.load_table_data(table_name)
    
    def load_table_data(self, table_name):
        """加载表数据"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # 获取表结构
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns_info = cursor.fetchall()
            
            # 获取数据
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 1000")  # 限制1000行以避免性能问题
            rows = cursor.fetchall()
            
            # 获取总行数
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            total_count = cursor.fetchone()[0]
            
            conn.close()
            
            # 清空现有数据
            for item in self.tree.get_children():
                self.tree.delete(item)
            
            # 设置列
            columns = [col[1] for col in columns_info]
            self.tree["columns"] = columns
            self.tree["show"] = "headings"
            
            # 设置列标题和宽度
            for col in columns:
                self.tree.heading(col, text=col)
                self.tree.column(col, width=100, minwidth=50)
            
            # 插入数据
            for row in rows:
                values = []
                for value in row:
                    if value is None:
                        values.append("NULL")
                    elif isinstance(value, str) and len(value) > 50:
                        values.append(value[:50] + "...")
                    else:
                        values.append(str(value))
                self.tree.insert("", tk.END, values=values)
            
            # 更新信息标签
            info_text = f"表: {table_name} | 总记录数: {total_count} | 显示: {len(rows)} 行 | 字段数: {len(columns)}"
            if total_count > 1000:
                info_text += " (仅显示前1000行)"
            self.info_label.config(text=info_text)
            
            self.current_table = table_name
            self.status_var.set(f"已加载表 {table_name}")
            
        except Exception as e:
            messagebox.showerror("错误", f"加载表数据失败: {str(e)}")
    
    def refresh_current_table(self):
        """刷新当前表数据"""
        if hasattr(self, 'current_table'):
            self.load_table_data(self.current_table)
        else:
            messagebox.showinfo("提示", "请先选择一个表")
    
    def export_to_csv(self):
        """导出当前表数据为CSV"""
        if not hasattr(self, 'current_table'):
            messagebox.showinfo("提示", "请先选择一个表")
            return
        
        try:
            from tkinter import filedialog
            import csv
            
            # 选择保存文件
            filename = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
                title="保存CSV文件"
            )
            
            if not filename:
                return
            
            conn = self.get_db_connection()
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {self.current_table}")
            rows = cursor.fetchall()
            
            # 获取列名
            column_names = [description[0] for description in cursor.description]
            
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(column_names)  # 写入表头
                
                for row in rows:
                    writer.writerow(row)
            
            conn.close()
            messagebox.showinfo("成功", f"数据已导出到: {filename}")
            
        except Exception as e:
            messagebox.showerror("错误", f"导出失败: {str(e)}")
    
    def show_table_schema(self):
        """显示表结构"""
        if not hasattr(self, 'current_table'):
            messagebox.showinfo("提示", "请先选择一个表")
            return
        
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # 获取表结构
            cursor.execute(f"PRAGMA table_info({self.current_table})")
            columns = cursor.fetchall()
            
            # 获取表的创建语句
            cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{self.current_table}'")
            create_sql = cursor.fetchone()[0]
            
            conn.close()
            
            # 创建新窗口显示表结构
            schema_window = tk.Toplevel(self.root)
            schema_window.title(f"表结构 - {self.current_table}")
            schema_window.geometry("600x500")
            
            # 表结构信息
            info_frame = ttk.LabelFrame(schema_window, text="字段信息", padding="10")
            info_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
            
            # 创建表格显示字段信息
            schema_tree = ttk.Treeview(info_frame, columns=("name", "type", "notnull", "default", "pk"), show="headings")
            schema_tree.pack(fill=tk.BOTH, expand=True)
            
            # 设置列标题
            schema_tree.heading("name", text="字段名")
            schema_tree.heading("type", text="类型")
            schema_tree.heading("notnull", text="非空")
            schema_tree.heading("default", text="默认值")
            schema_tree.heading("pk", text="主键")
            
            # 设置列宽度
            schema_tree.column("name", width=120)
            schema_tree.column("type", width=100)
            schema_tree.column("notnull", width=60)
            schema_tree.column("default", width=100)
            schema_tree.column("pk", width=60)
            
            # 插入字段信息
            for col in columns:
                schema_tree.insert("", tk.END, values=(
                    col[1],  # name
                    col[2],  # type
                    "是" if col[3] else "否",  # notnull
                    col[4] if col[4] else "",  # default
                    "是" if col[5] else "否"   # pk
                ))
            
            # SQL语句
            sql_frame = ttk.LabelFrame(schema_window, text="建表语句", padding="10")
            sql_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
            
            sql_text = scrolledtext.ScrolledText(sql_frame, height=10, wrap=tk.WORD)
            sql_text.pack(fill=tk.BOTH, expand=True)
            sql_text.insert(tk.END, create_sql)
            sql_text.config(state=tk.DISABLED)
            
        except Exception as e:
            messagebox.showerror("错误", f"获取表结构失败: {str(e)}")

def main():
    """主函数"""
    root = tk.Tk()
    
    # 设置窗口图标（如果有的话）
    try:
        root.iconbitmap('icon.ico')
    except:
        pass
    
    app = DatabaseViewer(root)
    root.mainloop()

if __name__ == "__main__":
    main() 