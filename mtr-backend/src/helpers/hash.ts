import * as bcrypt from 'bcrypt';
import { SALT } from '../constants';

export const createHash = (data: string) => {
  return bcrypt.hash(data, SALT);
};

export const checkHash = (data: string, hash: string) => {
  return bcrypt.compare(data, hash);
};
