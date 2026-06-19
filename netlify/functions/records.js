const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const store = getStore({ name: 'records', consistency: 'strong' });

    if (event.httpMethod === 'GET') {
      const data = await store.get('all', { type: 'json' });
      return { statusCode: 200, headers, body: JSON.stringify(data || []) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      let records = await store.get('all', { type: 'json' }) || [];

      if (body.action === 'add') {
        records.push(body.record);
      } else if (body.action === 'update') {
        const idx = records.findIndex(r => r._id === body.record._id);
        if (idx !== -1) records[idx] = body.record;
      } else if (body.action === 'delete') {
        records = records.filter(r => r._id !== body.id);
      } else if (body.action === 'bulk') {
        records = body.records;
      }

      await store.set('all', JSON.stringify(records));
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
