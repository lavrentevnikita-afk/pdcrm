const bcrypt = require('bcrypt');

const users = [
  {
    name: 'Александр',
    role: 'designer',
    department: 'Дизайн',
    phone: '+7 999 123-45-67',
    email: 'alexander@pdcrm.local',
    workload: 4,
    code: '1001',
    permissions: { orders: true, production: false, cashbox: false, analytics: true, warehouse: true },
  },
  {
    name: 'Анастасия',
    role: 'designer',
    department: 'Дизайн',
    phone: '+7 921 222-11-22',
    email: 'anastasia@pdcrm.local',
    workload: 5,
    code: '1002',
    permissions: { orders: true, production: false, cashbox: false, analytics: true, warehouse: true },
  },
  {
    name: 'Ольга',
    role: 'designer',
    department: 'Дизайн',
    phone: '+7 921 333-11-22',
    email: 'olga@pdcrm.local',
    workload: 3,
    code: '1003',
    permissions: { orders: true, production: false, cashbox: false, analytics: true, warehouse: true },
  },
  {
    name: 'Валентина',
    role: 'designer',
    department: 'Дизайн',
    phone: '+7 921 444-11-22',
    email: 'valentina@pdcrm.local',
    workload: 2,
    code: '1004',
    permissions: { orders: true, production: false, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Юлия',
    role: 'designer',
    department: 'Дизайн',
    phone: '+7 921 555-11-22',
    email: 'julia@pdcrm.local',
    workload: 6,
    code: '1005',
    permissions: { orders: true, production: false, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Никита',
    role: 'production',
    department: 'Цех',
    phone: '+7 912 111-22-33',
    email: 'nikita@pdcrm.local',
    workload: 7,
    code: '2001',
    permissions: { orders: true, production: true, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Виктор',
    role: 'production',
    department: 'Цех',
    phone: '+7 912 444-22-33',
    email: 'victor@pdcrm.local',
    workload: 5,
    code: '2002',
    permissions: { orders: true, production: true, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Павел',
    role: 'production',
    department: 'Цех',
    phone: '+7 912 555-22-33',
    email: 'pavel@pdcrm.local',
    workload: 6,
    code: '2003',
    permissions: { orders: true, production: true, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Екатерина',
    role: 'production',
    department: 'Цех',
    phone: '+7 912 666-22-33',
    email: 'ekaterina@pdcrm.local',
    workload: 4,
    code: '2004',
    permissions: { orders: true, production: true, cashbox: false, analytics: false, warehouse: true },
  },
  {
    name: 'Евгений',
    role: 'director',
    department: 'Отдел продаж',
    phone: '+7 921 777-88-99',
    email: 'evgeny@pdcrm.local',
    workload: 2,
    code: '4444',
    permissions: { orders: true, production: true, cashbox: true, analytics: true, warehouse: true },
  },
  {
    name: 'Администратор',
    role: 'admin',
    department: 'Администрирование',
    phone: '+7 911 000-00-00',
    email: 'admin@pdcrm.local',
    workload: 1,
    code: '3333',
    permissions: { orders: true, production: true, cashbox: true, analytics: true, warehouse: true },
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
