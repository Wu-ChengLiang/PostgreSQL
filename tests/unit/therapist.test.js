const therapistService = require('../../src/services/therapistService');

// Mock数据库连接
jest.mock('../../src/database/db', () => {
    const mockDb = {
        connect: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
        all: jest.fn(),
        get: jest.fn(),
        run: jest.fn()
    };
    
    return {
        getInstance: () => mockDb,
        Database: jest.fn(() => mockDb)
    };
});

describe('TherapistService', () => {
    let mockDb;
    
    beforeEach(() => {
        const { getInstance } = require('../../src/database/db');
        mockDb = getInstance();
        jest.clearAllMocks();
    });
    
    describe('searchTherapists', () => {
        it('应该返回技师列表', async () => {
            const mockTherapists = [
                {
                    id: 1,
                    name: '张老师',
                    position: '调理师',
                    experience_years: 10,
                    specialties: '["按摩", "艾灸"]',
                    store_id: 1,
                    store_name: '宜山路店',
                    store_address: '上海市宜山路'
                }
            ];
            
            mockDb.get.mockResolvedValue({ count: 1 });
            mockDb.all.mockResolvedValue(mockTherapists);
            
            const result = await therapistService.searchTherapists({
                specialty: '按摩',
                page: 1,
                limit: 20
            });
            
            expect(result.total).toBe(1);
            expect(result.therapists).toHaveLength(1);
            expect(result.therapists[0].name).toBe('张老师');
            expect(result.therapists[0].specialties).toEqual(['按摩', '艾灸']);
        });
        
        it('应该正确处理筛选条件', async () => {
            mockDb.get.mockResolvedValue({ count: 0 });
            mockDb.all.mockResolvedValue([]);
            
            await therapistService.searchTherapists({
                storeId: 1,
                specialty: '推拿',
                minExperience: 15
            });
            
            // 验证SQL查询包含筛选条件
            const query = mockDb.all.mock.calls[0][0];
            expect(query).toContain('store_id = ?');
            expect(query).toContain('specialties LIKE ?');
            expect(query).toContain('experience_years >= ?');
        });
    });
    
    describe('getTherapistSchedule', () => {
        it('应该返回可用时间段', async () => {
            mockDb.get.mockResolvedValue({
                id: 1,
                name: '张老师',
                status: 'active'
            });
            
            mockDb.all.mockResolvedValue([
                { appointment_time: '10:00' },
                { appointment_time: '14:00' }
            ]);
            
            const result = await therapistService.getTherapistSchedule(1, '2025-01-16');
            
            expect(result.available_times).not.toContain('10:00');
            expect(result.available_times).not.toContain('14:00');
            expect(result.available_times).toContain('09:00');
            expect(result.available_times).toContain('11:00');
        });
        
        it('应该在技师不存在时抛出错误', async () => {
            mockDb.get.mockResolvedValue(null);
            
            await expect(
                therapistService.getTherapistSchedule(999, '2025-01-16')
            ).rejects.toThrow('技师不存在或已停职');
        });
    });
    
    describe('createTherapist', () => {
        it('应该成功创建技师', async () => {
            const newTherapist = {
                store_id: 1,
                name: '李老师',
                position: '推拿师',
                years_of_experience: 8,
                specialties: ['推拿', '正骨']
            };
            
            mockDb.run.mockResolvedValue({ id: 100 });
            mockDb.get.mockResolvedValue({
                ...newTherapist,
                id: 100,
                specialties: '["推拿", "正骨"]'
            });
            
            const result = await therapistService.createTherapist(newTherapist);
            
            expect(result.id).toBe(100);
            expect(result.name).toBe('李老师');
            expect(mockDb.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO therapists'),
                expect.arrayContaining([1, '李老师', '推拿师', 8])
            );
        });
    });
});