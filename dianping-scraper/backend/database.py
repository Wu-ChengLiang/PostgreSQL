import sqlite3
import hashlib
import json
import logging
import threading
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, db_path='dianping_history.db'):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(DatabaseManager, cls).__new__(cls)
                    cls._instance.db_path = db_path
                    cls._instance.conn = None
                    cls._instance._init_db()
        return cls._instance

    def _init_db(self):
        """初始化数据库和表"""
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            cursor = self.conn.cursor()
            
            # 原有消息表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT,
                    raw_data TEXT NOT NULL,
                    processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_chat_id ON messages (chat_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON messages (timestamp)')
            

            self.conn.commit()
            logger.info(f"[数据库] 数据库 '{self.db_path}' 初始化成功")
        except sqlite3.Error as e:
            logger.error(f"[数据库] 数据库初始化失败: {e}")
            raise

    def _generate_message_id(self, message: Dict[str, Any]) -> str:
        """
        为消息生成一个确定性的唯一ID。
        使用消息内容和时间戳生成，确保唯一性
        """
        keys_to_hash = [
            str(message.get('chatId', '')),
            str(message.get('role', '')),
            str(message.get('content', '')),
            str(message.get('timestamp', ''))  # 添加时间戳确保唯一性
        ]
        
        message_string = "".join(keys_to_hash)
        return hashlib.md5(message_string.encode('utf-8')).hexdigest()

    def is_message_processed(self, message_id: str) -> bool:
        """检查消息ID是否已在数据库中"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1 FROM messages WHERE id = ?", (message_id,))
            return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logger.error(f"[数据库] 查询消息失败 (ID: {message_id}): {e}")
            return False # 出错时保守地认为未处理

    def add_message(self, message: Dict[str, Any]):
        """将一条消息添加到数据库"""
        message_id = self._generate_message_id(message)
        
        # 添加调试日志
        logger.debug(f"[数据库调试] 准备添加消息，ID: {message_id}")
        
        if self.is_message_processed(message_id):
            logger.debug(f"[数据库调试] 消息已存在，跳过: {message_id}")
            return

        chat_id = message.get('chatId', 'unknown_chat')
        role = message.get('role', 'unknown')
        content = message.get('content', '')
        
        # 统一时间戳格式
        timestamp = message.get('timestamp')
        if isinstance(timestamp, (int, float)):
            # 如果是时间戳数字，转换为ISO格式
            timestamp = datetime.fromtimestamp(timestamp / 1000 if timestamp > 1e10 else timestamp).isoformat()
        elif timestamp is None:
            timestamp = datetime.now().isoformat()
        
        logger.debug(f"[数据库调试] 添加消息: Role={role}, ChatID={chat_id}, Timestamp={timestamp}")
        
        raw_data = json.dumps({
            **message,
            'timestamp': timestamp  # 确保raw_data中也是标准格式
        }, ensure_ascii=False)

        try:
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO messages (id, chat_id, role, content, timestamp, raw_data) VALUES (?, ?, ?, ?, ?, ?)",
                (message_id, chat_id, role, content, timestamp, raw_data)
            )
            self.conn.commit()
            logger.debug(f"[数据库调试] 消息添加成功: {message_id}")
        except sqlite3.IntegrityError:
             # 并发情况下可能重复插入，可以安全忽略
            logger.debug(f"[数据库调试] 消息重复，忽略: {message_id}")
            pass
        except sqlite3.Error as e:
            logger.error(f"[数据库] 添加消息失败 (ID: {message_id}): {e}")

    def should_reply_to_chat(self, chat_id: str, contact_name: str = None) -> bool:
        """
        判断是否应该回复指定聊天
        规则：
        1. 如果最后一条消息是商家发送的，不回复
        2. 如果距离最后一条客户消息时间 > 5分钟，不回复
        3. 如果距离最后一条客户消息时间 <= 5分钟且最后一条是客户消息，回复
        """
        try:
            cursor = self.conn.cursor()
            
            # 修复时间戳混乱问题：只考虑有效的时间戳（不能是未来时间）
            current_time = datetime.now()
            future_threshold = current_time + timedelta(minutes=1)  # 允许1分钟的时间偏差
            
            cursor.execute("""
                SELECT role, timestamp, content FROM messages 
                WHERE chat_id = ? 
                AND (
                    -- 过滤掉未来时间戳，只取有效的时间戳
                    (timestamp LIKE '%Z' AND datetime(substr(timestamp, 1, 19)) <= datetime('now', '+1 minutes')) OR
                    (timestamp NOT LIKE '%Z' AND datetime(substr(timestamp, 1, 19)) <= datetime('now', '+1 minutes'))
                )
                ORDER BY 
                    CASE 
                        WHEN timestamp LIKE '%Z' THEN 
                            datetime(substr(timestamp, 1, 19))  -- UTC时间
                        ELSE 
                            datetime(substr(timestamp, 1, 19))  -- 本地时间  
                    END DESC,
                    rowid DESC  -- 使用rowid作为额外排序条件
                LIMIT 1
            """, (chat_id,))
            
            last_message = cursor.fetchone()
            
            if not last_message:
                logger.debug(f"[回复控制调试] {contact_name}: 没有找到有效的消息历史")
                return False
            
            role, timestamp, content = last_message
            logger.debug(f"[回复控制调试] {contact_name}: 最后一条有效消息 Role={role}, Time={timestamp}, Content={content[:50]}...")
            
            # 如果最后一条是商家发送的消息，不回复
            if role == 'assistant':
                logger.info(f"[回复控制] {contact_name}: 最后一条消息是商家发送，不回复")
                return False
            
            # 检查最后一条客户消息的时间
            # 转换时间戳为datetime对象
            try:
                if timestamp.endswith('Z'):
                    # UTC时间戳，需要转换为本地时间
                    msg_time = datetime.fromisoformat(timestamp[:-1]).replace(tzinfo=timezone.utc)
                    msg_time = msg_time.astimezone(timezone(timedelta(hours=8)))  # 转换为北京时间
                else:
                    # 本地时间戳
                    msg_time = datetime.fromisoformat(timestamp[:19])
                
                time_diff = datetime.now() - msg_time.replace(tzinfo=None)
                minutes_passed = time_diff.total_seconds() / 60
                
                logger.debug(f"[回复控制调试] {contact_name}: 距离最后消息 {minutes_passed:.1f} 分钟")
                
                if minutes_passed > 5:
                    logger.info(f"[回复控制] {contact_name}: 距离最后消息超过5分钟({minutes_passed:.1f}分钟)，不回复")
                    return False
                else:
                    logger.info(f"[回复控制] {contact_name}: 最后消息是客户发送且在5分钟内({minutes_passed:.1f}分钟)，需要回复")
                    return True
                
            except Exception as e:
                logger.error(f"[回复控制] {contact_name}: 时间戳解析错误: {e}, timestamp: {timestamp}")
                return False
            
        except Exception as e:
            logger.error(f"[回复控制] {contact_name}: 检查回复条件时出错: {e}")
            return False

    def get_chat_history(self, chat_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """获取指定聊天的历史记录"""
        history = []
        try:
            cursor = self.conn.cursor()
            # 按时间戳排序，确保顺序
            cursor.execute(
                "SELECT raw_data FROM messages WHERE chat_id = ? ORDER BY timestamp ASC LIMIT ?",
                (chat_id, limit)
            )
            rows = cursor.fetchall()
            for row in rows:
                history.append(json.loads(row['raw_data']))
        except sqlite3.Error as e:
            logger.error(f"[数据库] 获取聊天历史失败 (ChatID: {chat_id}): {e}")
        return history
    
    def get_active_chats(self, hours: int = 24) -> List[Dict[str, Any]]:
        """获取指定小时内的活跃聊天"""
        try:
            cursor = self.conn.cursor()
            since_time = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            cursor.execute("""
                SELECT DISTINCT chat_id, 
                       MAX(timestamp) as last_activity,
                       COUNT(*) as message_count
                FROM messages 
                WHERE timestamp > ?
                GROUP BY chat_id
                ORDER BY last_activity DESC
            """, (since_time,))
            
            return [dict(row) for row in cursor.fetchall()]
            
        except sqlite3.Error as e:
            logger.error(f"[数据库] 获取活跃聊天失败: {e}")
            return []

    def close(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            self.conn = None
            logger.info("[数据库] 数据库连接已关闭")

# 单例模式，方便在应用中各处调用
db_manager = DatabaseManager() 