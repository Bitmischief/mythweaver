import axios from 'axios';
import { Image } from '../types/image';

export const getConjurationImageHistory = async (conjurationId: number) => {
  const response = await axios.get<Image[]>(`/images/conjurations/${conjurationId}/history`);
  return response.data;
};
