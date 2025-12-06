/**
 * Seed basic clients into the generic directories storage.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('directories').where({ type: 'clients' }).del();

  const now = new Date().toISOString();
  const clients = [
    {
      name: 'Coffee&Co',
      contact: 'Антон',
      phone: '+7 (912) 555-21-21',
      email: 'hello@coffee-co.local',
    },
    {
      name: 'ООО «СеверСтрой»',
      contact: 'Виктор',
      phone: '+7 (921) 333-22-11',
      email: 'sales@severstroy.local',
    },
    {
      name: 'Театр света',
      contact: 'Алексей',
      phone: '+7 (900) 555-44-33',
      email: 'info@lighttheatre.local',
    },
  ];

  for (const client of clients) {
    await knex('directories').insert({
      type: 'clients',
      data: JSON.stringify(client),
      created_at: now,
      updated_at: now,
    });
  }
};
