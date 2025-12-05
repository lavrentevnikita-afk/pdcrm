const bcrypt = require('bcrypt');

const users = [
  {
    name: 'Администратор',
    role: 'admin',
    department: 'Администрирование',
    phone: '+7 911 000-00-00',
    email: 'admin@pdcrm.local',
    workload: 1,
    code: '3333',
    permissions: {
      orders: true,
      production: true,
      cashbox: true,
      analytics: true,
      warehouse: true,
    },
  },
  {
    name: 'Менеджер',
    role: 'director',
    department: 'Продажи',
    phone: '+7 900 111-22-33',
    email: 'manager@pdcrm.local',
    workload: 3,
    code: '1111',
    permissions: {
      orders: true,
      production: false,
      cashbox: true,
      analytics: true,
      warehouse: true,
    },
  },
];

exports.seed = async function (knex) {
  await knex('user_permissions').del();
  await knex('users').del();

  const rows = [];
  const permissionsRows = [];

  for (const user of users) {
    const hash = await bcrypt.hash(user.code, 10);
    rows.push({
      name: user.name,
      role: user.role,
      access_code_hash: hash,
      is_active: true,
      department: user.department,
      phone: user.phone,
      email: user.email,
      workload: user.workload,
    });
  }

  const inserted = await knex('users').insert(rows).returning(['id']);
  const ids = inserted.map((row, index) => row.id || inserted[index]);

  ids.forEach((id, index) => {
    permissionsRows.push({ user_id: id, ...users[index].permissions });
  });

  await knex('user_permissions').insert(permissionsRows);
};
