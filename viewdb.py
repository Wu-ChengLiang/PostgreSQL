import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import sqlite3
import os
from datetime import datetime

class DatabaseViewer:
    def __init__(self, root):
        self.root = root
        self.root.title("Database Viewer - 数据库查看器")
        self.root.geometry("1200x800")
        
        # 数据库路径
        self.db_path = 'dianping-scraper/backend/dianping_history.db'
        
        # 创建主框架
        self.create_widgets()
        
        # 加载数据
        self.load_data()
        
    def create_widgets(self):
        # 顶部工具栏
        toolbar = ttk.Frame(self.root)
        toolbar.pack(fill=tk.X, padx=5, pady=5)
        
        # 刷新按钮
        ttk.Button(toolbar, text="刷新数据", command=self.load_data).pack(side=tk.LEFT, padx=5)
        
        # 搜索框
        ttk.Label(toolbar, text="搜索:").pack(side=tk.LEFT, padx=(20, 5))
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(toolbar, textvariable=self.search_var, width=30)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        self.search_entry.bind('<KeyRelease>', self.on_search)
        
        # 记录统计
        self.stats_label = ttk.Label(toolbar, text="")
        self.stats_label.pack(side=tk.RIGHT, padx=5)
        
        # 主容器 - 使用PanedWindow分割视图
        paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 左侧 - 数据表格
        left_frame = ttk.Frame(paned)
        paned.add(left_frame, weight=3)
        
        # 创建Treeview表格
        columns = ('ID', 'Chat ID', 'Role', 'Timestamp', 'Content Preview')
        self.tree = ttk.Treeview(left_frame, columns=columns, show='headings', height=20)
        
        # 设置列标题和宽度
        self.tree.heading('ID', text='ID')
        self.tree.heading('Chat ID', text='Chat ID')
        self.tree.heading('Role', text='角色')
        self.tree.heading('Timestamp', text='时间')
        self.tree.heading('Content Preview', text='内容预览')
        
        self.tree.column('ID', width=100)
        self.tree.column('Chat ID', width=150)
        self.tree.column('Role', width=80)
        self.tree.column('Timestamp', width=150)
        self.tree.column('Content Preview', width=300)
        
        # 添加滚动条
        scrollbar_y = ttk.Scrollbar(left_frame, orient=tk.VERTICAL, command=self.tree.yview)
        scrollbar_x = ttk.Scrollbar(left_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=scrollbar_y.set, xscrollcommand=scrollbar_x.set)
        
        # 布局表格和滚动条
        self.tree.grid(row=0, column=0, sticky='nsew')
        scrollbar_y.grid(row=0, column=1, sticky='ns')
        scrollbar_x.grid(row=1, column=0, sticky='ew')
        
        left_frame.grid_rowconfigure(0, weight=1)
        left_frame.grid_columnconfigure(0, weight=1)
        
        # 绑定选择事件
        self.tree.bind('<<TreeviewSelect>>', self.on_item_select)
        
        # 右侧 - 详细信息面板
        right_frame = ttk.Frame(paned)
        paned.add(right_frame, weight=2)
        
        # 详细信息标题
        ttk.Label(right_frame, text="详细信息", font=('Arial', 12, 'bold')).pack(pady=(0, 10))
        
        # 创建Notebook用于分标签显示
        self.notebook = ttk.Notebook(right_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # 基本信息标签
        info_frame = ttk.Frame(self.notebook)
        self.notebook.add(info_frame, text="基本信息")
        
        # 创建信息显示字段
        info_fields = [
            ("ID:", "id_label"),
            ("Chat ID:", "chat_id_label"),
            ("角色:", "role_label"),
            ("时间戳:", "timestamp_label")
        ]
        
        for i, (label_text, attr_name) in enumerate(info_fields):
            ttk.Label(info_frame, text=label_text, font=('Arial', 9, 'bold')).grid(row=i, column=0, sticky='w', padx=5, pady=2)
            label = ttk.Label(info_frame, text="", wraplength=300)
            label.grid(row=i, column=1, sticky='w', padx=5, pady=2)
            setattr(self, attr_name, label)
        
        # 内容标签
        content_frame = ttk.Frame(self.notebook)
        self.notebook.add(content_frame, text="消息内容")
        
        self.content_text = scrolledtext.ScrolledText(content_frame, wrap=tk.WORD, height=15)
        self.content_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 原始数据标签
        raw_frame = ttk.Frame(self.notebook)
        self.notebook.add(raw_frame, text="原始数据")
        
        self.raw_text = scrolledtext.ScrolledText(raw_frame, wrap=tk.WORD, height=15)
        self.raw_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
    def load_data(self):
        """加载数据库数据"""
        if not os.path.exists(self.db_path):
            messagebox.showerror("错误", f"数据库文件不存在: {self.db_path}")
            return
            
        try:
            # 清空现有数据
            for item in self.tree.get_children():
                self.tree.delete(item)
                
            # 连接数据库
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 查询数据
            cursor.execute("SELECT id, chat_id, role, content, timestamp, raw_data FROM messages ORDER BY timestamp DESC")
            rows = cursor.fetchall()
            
            # 插入数据到表格
            for row in rows:
                id_val, chat_id, role, content, timestamp, raw_data = row
                
                # 截取内容预览（前50个字符）
                content_preview = (content[:50] + "...") if content and len(content) > 50 else content or ""
                
                # 格式化时间戳
                try:
                    if timestamp:
                        # 尝试解析时间戳
                        if timestamp.replace('.', '').replace('-', '').replace(':', '').replace(' ', '').isdigit():
                            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00') if timestamp.endswith('Z') else timestamp)
                            formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
                        else:
                            formatted_time = timestamp
                    else:
                        formatted_time = ""
                except:
                    formatted_time = timestamp or ""
                
                self.tree.insert('', 'end', values=(
                    id_val or "",
                    chat_id or "",
                    role or "",
                    formatted_time,
                    content_preview
                ), tags=(id_val,))
            
            # 更新统计信息
            self.stats_label.config(text=f"总记录数: {len(rows)}")
            
            conn.close()
            
        except Exception as e:
            messagebox.showerror("错误", f"加载数据时出错: {str(e)}")
    
    def on_item_select(self, event):
        """当选择表格项时显示详细信息"""
        selection = self.tree.selection()
        if not selection:
            return
            
        item = self.tree.item(selection[0])
        values = item['values']
        record_id = item['tags'][0] if item['tags'] else None
        
        if not record_id:
            return
            
        try:
            # 查询完整记录
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, chat_id, role, content, timestamp, raw_data FROM messages WHERE id = ?", (record_id,))
            row = cursor.fetchone()
            
            if row:
                id_val, chat_id, role, content, timestamp, raw_data = row
                
                # 更新基本信息
                self.id_label.config(text=id_val or "")
                self.chat_id_label.config(text=chat_id or "")
                self.role_label.config(text=role or "")
                self.timestamp_label.config(text=timestamp or "")
                
                # 更新内容
                self.content_text.delete(1.0, tk.END)
                if content:
                    self.content_text.insert(1.0, content)
                
                # 更新原始数据
                self.raw_text.delete(1.0, tk.END)
                if raw_data:
                    self.raw_text.insert(1.0, raw_data)
            
            conn.close()
            
        except Exception as e:
            messagebox.showerror("错误", f"查询详细信息时出错: {str(e)}")
    
    def on_search(self, event):
        """搜索功能"""
        search_term = self.search_var.get().lower()
        
        if not search_term:
            # 如果搜索框为空，显示所有记录
            self.load_data()
            return
            
        try:
            # 清空现有数据
            for item in self.tree.get_children():
                self.tree.delete(item)
                
            # 连接数据库并搜索
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # 在多个字段中搜索
            query = """
            SELECT id, chat_id, role, content, timestamp, raw_data 
            FROM messages 
            WHERE LOWER(content) LIKE ? 
               OR LOWER(role) LIKE ? 
               OR LOWER(chat_id) LIKE ?
               OR LOWER(id) LIKE ?
            ORDER BY timestamp DESC
            """
            search_pattern = f"%{search_term}%"
            cursor.execute(query, (search_pattern, search_pattern, search_pattern, search_pattern))
            rows = cursor.fetchall()
            
            # 插入搜索结果
            for row in rows:
                id_val, chat_id, role, content, timestamp, raw_data = row
                content_preview = (content[:50] + "...") if content and len(content) > 50 else content or ""
                
                try:
                    if timestamp:
                        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00') if timestamp.endswith('Z') else timestamp)
                        formatted_time = dt.strftime("%Y-%m-%d %H:%M:%S")
                    else:
                        formatted_time = ""
                except:
                    formatted_time = timestamp or ""
                
                self.tree.insert('', 'end', values=(
                    id_val or "",
                    chat_id or "",
                    role or "",
                    formatted_time,
                    content_preview
                ), tags=(id_val,))
            
            # 更新统计信息
            self.stats_label.config(text=f"搜索结果: {len(rows)} 条记录")
            
            conn.close()
            
        except Exception as e:
            messagebox.showerror("错误", f"搜索时出错: {str(e)}")

def main():
    root = tk.Tk()
    app = DatabaseViewer(root)
    root.mainloop()

if __name__ == "__main__":
    main() 