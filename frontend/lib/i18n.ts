// 中文本地化配置
export const zh = {
  common: {
    loading: '加载中...',
    error: '错误',
    success: '成功',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    filter: '筛选',
    refresh: '刷新',
    export: '导出',
    import: '导入',
    viewAll: '查看全部',
    viewDetails: '查看详情',
    noData: '暂无数据',
    confirm: '确认',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    close: '关闭',
    submit: '提交',
    reset: '重置',
    action: '操作',
  },
  
  dashboard: {
    title: '控制台',
    subtitle: '欢迎使用中医理疗预约管理系统',
    stats: {
      totalUsers: '用户总数',
      totalTherapists: '技师总数',
      totalAppointments: '预约总数',
      totalStores: '门店总数',
      todayAppointments: '今日预约',
      weekRevenue: '本周营收',
      monthRevenue: '本月营收',
      averageRating: '平均评分',
    },
    cards: {
      appointments: '预约管理',
      appointmentsDesc: '管理所有预约信息',
      therapists: '技师管理',
      therapistsDesc: '管理技师档案信息',
      stores: '门店管理',
      storesDesc: '管理门店位置信息',
      users: '用户管理',
      usersDesc: '管理系统用户信息',
    },
    charts: {
      appointmentTrend: '预约趋势',
      therapistUtilization: '技师利用率',
    },
    table: {
      recentAppointments: '最近预约',
    },
  },
  
  appointment: {
    title: '预约管理',
    fields: {
      id: '预约编号',
      date: '预约日期',
      time: '预约时间',
      startTime: '开始时间',
      endTime: '结束时间',
      patient: '患者',
      therapist: '技师',
      location: '门店',
      service: '服务项目',
      status: '状态',
      notes: '备注',
      createdAt: '创建时间',
      updatedAt: '更新时间',
    },
    status: {
      scheduled: '已预约',
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
    },
    actions: {
      create: '创建预约',
      confirm: '确认预约',
      cancel: '取消预约',
      complete: '完成预约',
      reschedule: '重新预约',
    },
  },
  
  therapist: {
    title: '技师管理',
    fields: {
      id: '技师编号',
      name: '姓名',
      title: '职称',
      store: '所属门店',
      specialties: '专长',
      serviceTypes: '服务类型',
      experience: '从业年限',
      rating: '评分',
      bio: '简介',
      status: '状态',
      schedule: '排班',
    },
    status: {
      active: '在职',
      inactive: '离职',
      vacation: '休假中',
    },
  },
  
  store: {
    title: '门店管理',
    fields: {
      id: '门店编号',
      name: '门店名称',
      address: '地址',
      phone: '联系电话',
      businessHours: '营业时间',
      rating: '评分',
      reviewCount: '评价数',
      therapistCount: '技师数量',
      status: '状态',
    },
    status: {
      open: '营业中',
      closed: '已关闭',
      renovation: '装修中',
    },
  },
  
  user: {
    title: '用户管理',
    fields: {
      id: '用户编号',
      username: '用户名',
      email: '邮箱',
      phone: '手机号',
      role: '角色',
      status: '状态',
      createdAt: '注册时间',
      lastLogin: '最后登录',
    },
    role: {
      admin: '管理员',
      therapist: '技师',
      customer: '客户',
      staff: '员工',
    },
    status: {
      active: '活跃',
      inactive: '未激活',
      blocked: '已封禁',
    },
  },
  
  service: {
    types: {
      massage: '推拿',
      acupuncture: '针灸',
      cupping: '拔罐',
      scraping: '刮痧',
      moxibustion: '艾灸',
      physiotherapy: '理疗',
      footTherapy: '足疗',
      headTherapy: '头疗',
      boneCorrection: '正骨',
      rehabilitation: '康复训练',
    },
  },
}

// 获取本地化文本的辅助函数
export function t(path: string): string {
  const keys = path.split('.')
  let value: any = zh
  
  for (const key of keys) {
    value = value?.[key]
    if (value === undefined) {
      console.warn(`Translation missing for key: ${path}`)
      return path
    }
  }
  
  return typeof value === 'string' ? value : path
}

export default zh