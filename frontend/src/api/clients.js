import { api } from './index';

export function fetchClients(params = {}) {
  return api.get('/clients', { params }).then((res) => res.data);
}

export function createClient(payload) {
  return api.post('/clients', payload).then((res) => res.data);
}

export function updateClient(id, payload) {
  return api.put(`/clients/${id}`, payload).then((res) => res.data);
}

export function deleteClient(id) {
  return api.delete(`/clients/${id}`);
}
