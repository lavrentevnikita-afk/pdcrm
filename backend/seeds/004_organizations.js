/**
 * Populate dedicated organizations table with reference records.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  await knex('organizations').del();

  const now = new Date().toISOString();

  const organizations = [
    {
      name: 'ООО «Полидатум»',
      inn: '7830001112',
      kpp: '781301001',
      ogrn: '1217800100001',
      legal_address: '191186, Санкт-Петербург, наб. Реки Фонтанки, 18',
      contact_person: 'Антон Смирнов',
      phone: '+7 (812) 555-18-18',
      email: 'office@polydatum.ru',
      payment_terms: 'Постоплата 7 дней',
      created_at: now,
      updated_at: now,
    },
  ];

  await knex('organizations').insert(organizations);
};
