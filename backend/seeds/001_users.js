const bcrypt = require('bcrypt');

const users = [
  { name: 'Александр', role: 'designer', code: '1001' },
  { name: 'Анастасия', role: 'designer', code: '1002' },
  { name: 'Ольга', role: 'designer', code: '1003' },
  { name: 'Валентина', role: 'designer', code: '1004' },
  { name: 'Юлия', role: 'designer', code: '1005' },

  { name: 'Никита', role: 'production', code: '2001' },
  { name: 'Виктор', role: 'production', code: '2002' },
  { name: 'Павел', role: 'production', code: '2003' },
  { name: 'Екатерина', role: 'production', code: '2004' },

  { name: 'Евгений', role: 'director', code: '4444' },
  { name: 'Администратор', role: 'admin', code: '3333' },
];


exports.seed = async function (knex) {
  await knex('users').del();

  const rows = [];

  for (const user of users) {
    const hash = await bcrypt.hash(user.code, 10);
    rows.push({
      name: user.name,
      role: user.role,
      access_code_hash: hash,
      is_active: true,
    });
  }

  await knex('users').insert(rows);
};
