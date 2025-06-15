// Mock database for development without PostgreSQL
const users = [];
const items = [];
const stores = [
  { id: 1, name: '名医堂·颈肩腰腿特色调理（莘庄店）', address: '上海市闵行区莘庄', business_hours: '09:00-21:00' },
  { id: 2, name: '名医堂妙康中医·推拿正骨·针灸·艾灸', address: '上海市', business_hours: '09:00-21:00' },
  { id: 3, name: '名医堂永康中医·推拿正骨·针灸·艾灸', address: '上海市', business_hours: '09:00-21:00' },
  { id: 4, name: '名医堂·颈肩腰腿特色调理（隆昌路店）', address: '上海市杨浦区隆昌路', business_hours: '09:00-21:00' },
  { id: 5, name: '名医堂·颈肩腰腿特色调理（爱琴海店）', address: '上海市闵行区吴中路爱琴海', business_hours: '09:00-21:00' },
  { id: 6, name: '名医堂·颈肩腰腿特色调理（关山路店）', address: '上海市浦东新区关山路', business_hours: '09:00-21:00' },
  { id: 7, name: '名医堂·颈肩腰腿特色调理（五角场万达店）', address: '上海市杨浦区五角场万达广场', business_hours: '09:00-21:00' },
  { id: 8, name: '名医堂·颈肩腰腿特色调理（国顺店）', address: '上海市杨浦区国顺路', business_hours: '09:00-21:00' },
  { id: 9, name: '名医堂·颈肩腰腿特色调理（春申路店）', address: '上海市闵行区春申路', business_hours: '09:00-21:00' },
  { id: 10, name: '名医堂·颈肩腰腿特色调理（兰溪路店）', address: '上海市普陀区兰溪路', business_hours: '09:00-21:00' },
  { id: 11, name: '名医堂·颈肩腰腿特色调理（浦东大道店）', address: '上海市浦东新区浦东大道', business_hours: '09:00-21:00' },
  { id: 12, name: '名医堂·颈肩腰腿特色调理（龙华路店）', address: '上海市徐汇区龙华路', business_hours: '09:30-21:00' },
  { id: 13, name: '名医堂·颈肩腰腿特色调理（世纪公园店）', address: '上海市浦东新区世纪公园', business_hours: '10:00-21:00' }
];
const therapists = [
  // 莘庄店
  { id: 1, store_id: 1, name: '陈老师', title: '调理师', specialties: ['妇科调理', '经络疏通', '艾灸'], experience_years: 18, rating_count: 55, is_recommended: true },
  { id: 2, store_id: 1, name: '孟老师', title: '调理师', specialties: ['按摩', '经络疏通', '艾灸'], experience_years: 23, rating_count: 109 },
  { id: 3, store_id: 1, name: '于老师', title: '调理师', specialties: ['经络疏通', '艾灸', 'SPA'], experience_years: 12, rating_count: 78 },
  { id: 4, store_id: 1, name: '赵老师', title: '调理师', specialties: ['颈肩腰腿疼调理', '脏腑调理', '推拿正骨'], experience_years: 24, rating_count: 30 },
  { id: 5, store_id: 1, name: '李想', title: '调理师', specialties: ['按摩', '艾灸', '经络疏通'], experience_years: 22, rating_count: 34 },
  { id: 6, store_id: 1, name: '刘老师', title: '健康师', specialties: ['刮痧', '按摩', '艾灸'], experience_years: 20, rating_count: 5 },
  { id: 7, store_id: 1, name: '朱老师', title: '艾灸师', specialties: ['刮痧', '经络疏通', '艾灸'], experience_years: 18, rating_count: 3 },
  
  // 妙康中医
  { id: 8, store_id: 2, name: '何正芳', title: '医师', specialties: ['中医内科', '中医妇科', '中医皮肤科'], experience_years: 7 },
  { id: 9, store_id: 2, name: '刁松山', title: '医师', specialties: ['中医内科', '中医男科', '中医不孕不育'], experience_years: 27 },
  { id: 10, store_id: 2, name: '胡科娜', title: '医师', specialties: ['中医内科', '中医妇科', '中医康复科'], experience_years: 8 },
  
  // 隆昌路店
  { id: 11, store_id: 4, name: '邹老师', title: '调理师', specialties: ['颈肩腰腿疼特色', '经络疏通', '艾灸'], experience_years: 15, rating_count: 102 },
  { id: 12, store_id: 4, name: '吴老师', title: '调理师', specialties: ['按摩', '经络疏通', '颈肩腰腿疼特色'], experience_years: 23, rating_count: 90 },
  
  // 爱琴海店
  { id: 13, store_id: 5, name: '杜老师', title: '调理师', specialties: ['脾胃调理', '颈肩腰腿痛调理', '推拿正骨'], experience_years: 16, rating_count: 26, is_recommended: true },
  { id: 14, store_id: 5, name: '邱老师', title: '调理师', specialties: ['正骨', '颈肩腰腿疼特色', '脏腑调理'], experience_years: 18, rating_count: 79, service_count: 1 }
];
const appointments = [];

// Simulate database query
const query = async (text, params) => {
  console.log('Mock Query:', text, params);
  
  // Handle different query types
  if (text.includes('SELECT id FROM users WHERE email')) {
    const user = users.find(u => u.email === params[0]);
    return { rows: user ? [user] : [] };
  }
  
  if (text.includes('SELECT id, email, password_hash, name FROM users WHERE email')) {
    const user = users.find(u => u.email === params[0]);
    return { rows: user ? [user] : [] };
  }
  
  if (text.includes('INSERT INTO users')) {
    const newUser = {
      id: users.length + 1,
      email: params[0],
      password_hash: params[1],
      name: params[2],
      created_at: new Date()
    };
    users.push(newUser);
    return { rows: [newUser] };
  }
  
  if (text.includes('SELECT * FROM items')) {
    return { rows: items };
  }
  
  if (text.includes('INSERT INTO items')) {
    const newItem = {
      id: items.length + 1,
      name: params[0],
      description: params[1],
      price: params[2],
      user_id: params[3],
      created_at: new Date()
    };
    items.push(newItem);
    return { rows: [newItem] };
  }
  
  // Stores queries
  if (text.includes('SELECT * FROM stores')) {
    if (text.includes('WHERE status')) {
      return { rows: stores.filter(s => s.status === params[0] || s.status === undefined) };
    }
    return { rows: stores };
  }
  
  // Therapists queries
  if (text.includes('SELECT * FROM therapists')) {
    if (text.includes('WHERE name ILIKE')) {
      const searchName = params[0]?.replace(/%/g, '');
      const filtered = therapists.filter(t => 
        t.name.toLowerCase().includes(searchName.toLowerCase())
      );
      return { rows: filtered };
    }
    return { rows: therapists };
  }
  
  // Complex therapists query with joins
  if (text.includes('SELECT t.*, s.name as store_name') && text.includes('FROM therapists t')) {
    let results = therapists.map(t => {
      const store = stores.find(s => s.id === t.store_id);
      return {
        ...t,
        store_name: store ? store.name : null
      };
    });
    
    // Apply filters if any
    if (text.includes('WHERE t.status')) {
      results = results.filter(t => t.status === 'active' || t.status === undefined);
    }
    
    return { rows: results };
  }
  
  // Handle get_therapist_appointments function call
  if (text.includes('get_therapist_appointments')) {
    const therapist_name = params[0];
    const store_name = params[1];
    const service_type = params[2];
    
    let filtered = therapists;
    
    // Filter by therapist name
    if (therapist_name) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(therapist_name.toLowerCase())
      );
    }
    
    // Filter by store name
    if (store_name) {
      filtered = filtered.filter(t => {
        const store = stores.find(s => s.id === t.store_id);
        return store && store.name.toLowerCase().includes(store_name.toLowerCase());
      });
    }
    
    // Filter by service type
    if (service_type && service_type !== null) {
      filtered = filtered.filter(t => 
        t.specialties && t.specialties.some(s => 
          s.toLowerCase().includes(service_type.toLowerCase())
        )
      );
    }
    
    // Join with stores and format result
    const result = filtered.map(t => {
      const store = stores.find(s => s.id === t.store_id);
      return {
        id: t.id,
        name: t.name,
        title: t.title,
        store_id: t.store_id,
        store_name: store ? store.name : null,
        specialties: t.specialties || [],
        experience_years: t.experience_years || 0,
        rating_count: t.rating_count || 0,
        is_recommended: t.is_recommended || false
      };
    });
    
    return { rows: result };
  }
  
  // Appointments queries
  if (text.includes('SELECT * FROM appointments')) {
    if (text.includes('WHERE user_id')) {
      const userAppointments = appointments.filter(a => a.user_id === params[0]);
      return { rows: userAppointments };
    }
    if (text.includes('WHERE id = $1 AND username = $2')) {
      const id = typeof params[0] === 'string' ? parseInt(params[0]) : params[0];
      const appointment = appointments.find(a => a.id === id && a.username === params[1]);
      return { rows: appointment ? [appointment] : [] };
    }
    if (text.includes('WHERE therapist_id')) {
      const therapistAppointments = appointments.filter(a => 
        a.therapist_id === params[0] && a.appointment_date === params[1]
      );
      return { rows: therapistAppointments };
    }
    return { rows: appointments };
  }
  
  // Appointments with joins
  if (text.includes('SELECT a.*, t.name as therapist_name')) {
    let filteredAppointments = [...appointments];
    
    // Filter by username
    if (text.includes('WHERE a.username = $1')) {
      filteredAppointments = filteredAppointments.filter(a => a.username === params[0]);
    }
    
    // Filter by id - handle both numeric and string IDs
    if (text.includes('WHERE a.id = $1')) {
      const id = typeof params[0] === 'string' ? parseInt(params[0]) : params[0];
      filteredAppointments = filteredAppointments.filter(a => a.id === id);
    }
    
    // Add therapist and store info
    const result = filteredAppointments.map(a => {
      const therapist = therapists.find(t => t.id === a.therapist_id);
      const store = therapist ? stores.find(s => s.id === therapist.store_id) : null;
      return {
        ...a,
        therapist_name: therapist ? therapist.name : null,
        therapist_specialties: therapist ? therapist.specialties : [],
        store_name: store ? store.name : null,
        store_address: store ? store.address : null
      };
    });
    
    return { rows: result };
  }
  
  // Update appointments
  if (text.includes('UPDATE appointments SET status')) {
    let appointment;
    if (text.includes('WHERE id = $2 AND username = $3')) {
      const id = typeof params[1] === 'string' ? parseInt(params[1]) : params[1];
      appointment = appointments.find(a => a.id === id && a.username === params[2]);
      if (appointment) {
        appointment.status = params[0];
      }
    }
    return { rows: appointment ? [appointment] : [] };
  }
  
  // Check therapist availability
  if (text.includes('SELECT appointment_time FROM appointments')) {
    const therapistId = typeof params[0] === 'string' ? parseInt(params[0]) : params[0];
    const therapistAppointments = appointments.filter(a => 
      a.therapist_id === therapistId && 
      a.appointment_date === params[1] && 
      a.status !== 'cancelled'
    );
    return { rows: therapistAppointments.map(a => ({ appointment_time: a.appointment_time })) };
  }
  
  // Get single therapist
  if (text.includes('SELECT * FROM therapists WHERE id')) {
    const id = typeof params[0] === 'string' ? parseInt(params[0]) : params[0];
    const therapist = therapists.find(t => t.id === id);
    return { rows: therapist ? [therapist] : [] };
  }
  
  if (text.includes('INSERT INTO appointments')) {
    const newAppointment = {
      id: appointments.length + 1,
      username: params[0],
      customer_name: params[1],
      customer_phone: params[2],
      store_id: params[3],
      therapist_id: params[4],
      appointment_date: params[5],
      appointment_time: params[6],
      service_type: params[7],
      notes: params[8],
      status: params[9] || 'confirmed',
      user_id: params[10],
      created_at: new Date()
    };
    appointments.push(newAppointment);
    return { rows: [newAppointment] };
  }
  
  // Default response
  return { rows: [] };
};

module.exports = {
  query,
  pool: { end: () => Promise.resolve() }
};