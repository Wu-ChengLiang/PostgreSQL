// Mock database for development without PostgreSQL
const users = [];
const items = [];

// Simulate database query
const query = async (text, params) => {
  console.log('Mock Query:', text, params);
  
  // Handle different query types
  if (text.includes('SELECT * FROM users WHERE email')) {
    const user = users.find(u => u.email === params[0]);
    return { rows: user ? [user] : [] };
  }
  
  if (text.includes('INSERT INTO users')) {
    const newUser = {
      id: users.length + 1,
      username: params[0],
      email: params[1],
      password: params[2],
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
  
  // Default response
  return { rows: [] };
};

module.exports = {
  query,
  pool: { end: () => Promise.resolve() }
};