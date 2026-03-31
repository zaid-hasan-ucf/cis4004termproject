import React, { useState } from 'react';

const initialUsers = [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
  { id: 2, name: 'Bob Johnson', email: 'bob@example.com' },
];

const AdminPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [editingUser, setEditingUser] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    setUsers([
      ...users,
      { id: Date.now(), name: newUser.name, email: newUser.email },
    ]);
    setNewUser({ name: '', email: '' });
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setNewUser({ name: user.name, email: user.email });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...newUser } : u));
    setEditingUser(null);
    setNewUser({ name: '', email: '' });
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Admin Dashboard</h1>
      <nav style={{ marginBottom: '1rem' }}>
        <a href="#users" style={{ marginRight: '1rem' }}>Users</a>
        <a href="#settings" style={{ marginRight: '1rem' }}>Settings</a>
        <a href="#reports">Reports</a>
      </nav>
      <section id="users">
        <h2>Manage Users</h2>
        <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={newUser.name}
            onChange={handleInputChange}
            required
            style={{ marginRight: '0.5rem' }}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={newUser.email}
            onChange={handleInputChange}
            required
            style={{ marginRight: '0.5rem' }}
          />
          <button type="submit">{editingUser ? 'Update User' : 'Add User'}</button>
          {editingUser && (
            <button type="button" onClick={() => { setEditingUser(null); setNewUser({ name: '', email: '' }); }} style={{ marginLeft: '0.5rem' }}>
              Cancel
            </button>
          )}
        </form>
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button onClick={() => handleEditClick(user)} style={{ marginRight: '0.5rem' }}>Edit</button>
                  <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section id="settings" style={{ marginTop: '2rem' }}>
        <h2>Settings</h2>
        <p>Additional admin settings can go here.</p>
      </section>
      <section id="reports" style={{ marginTop: '2rem' }}>
        <h2>Reports</h2>
        <p>Admin can view reports here.</p>
      </section>
    </div>
  );
};

export default AdminPage;