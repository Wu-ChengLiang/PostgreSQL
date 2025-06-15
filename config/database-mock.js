// Mock database for development without PostgreSQL
const users = [];
const items = [];
const therapists = [
  { id: 1, name: '陈老师', specialties: ['经络疏通', '肩颈调理'], experience_years: 10 },
  { id: 2, name: '李师傅', specialties: ['足底按摩', '全身放松'], experience_years: 8 },
  { id: 3, name: '王技师', specialties: ['拔罐刮痧', '艾灸理疗'], experience_years: 5 }
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
      return {
        ...a,
        therapist_name: therapist ? therapist.name : null,
        therapist_specialties: therapist ? therapist.specialties : [],
        store_name: '徐汇店', // 模拟门店名称
        store_address: '上海市徐汇区XX路XX号' // 模拟门店地址
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