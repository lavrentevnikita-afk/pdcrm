import { api } from './index';

export function loginWithAccessCode(accessCode) {
  return api
    .post('/auth/login', { accessCode })
    .then((res) => res.data);
}

export function fetchCurrentUser() {
  return api
    .get('/auth/me')
    .then((res) => res.data);
}
