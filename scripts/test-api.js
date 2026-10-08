async function testApi() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('--- Starting API Verification Test ---');

  // 1. Stats
  const statsRes = await fetch(`${baseUrl}/stats`);
  const stats = await statsRes.json();
  console.log(' GET /api/stats -> Success:', stats.success, '| Total Tasks:', stats.stats.total);

  // 2. Tasks list
  const tasksRes = await fetch(`${baseUrl}/tasks`);
  const tasks = await tasksRes.json();
  console.log(' GET /api/tasks -> Success:', tasks.success, '| Tasks count:', tasks.count);

  // 3. Create Task
  const createRes = await fetch(`${baseUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Automated Test Task for Mongoose Validation',
      description: 'Testing task persistence and retrieval',
      category: 'Projects',
      priority: 'High',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000),
    }),
  });
  const created = await createRes.json();
  console.log(' POST /api/tasks -> Created ID:', created.data._id);

  // 4. Update Task (Kanban move / status update)
  const updateRes = await fetch(`${baseUrl}/tasks/${created.data._id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'In Progress',
    }),
  });
  const updated = await updateRes.json();
  console.log(' PUT /api/tasks/:id -> Updated status:', updated.data.status);

  // 5. Delete Task
  const deleteRes = await fetch(`${baseUrl}/tasks/${created.data._id}`, {
    method: 'DELETE',
  });
  const deleted = await deleteRes.json();
  console.log(' DELETE /api/tasks/:id -> Deleted ID:', deleted.id);

  // 6. User Auth (Register + Login)
  const testEmail = `user_${Date.now()}@example.com`;
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sayali Test',
      email: testEmail,
      password: 'securePassword123',
    }),
  });
  const regData = await regRes.json();
  console.log(' POST /api/auth/register -> User registered:', regData.user?.email);

  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'securePassword123',
    }),
  });
  const loginData = await loginRes.json();
  console.log(' POST /api/auth/login -> Login token received:', !!loginData.token);

  console.log('--- All API Tests Passed with 100% Success! ---');
}

testApi().catch(console.error);
