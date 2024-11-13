import axios, { AxiosResponse } from "axios";
import { ImageModelResponse } from "@/modules/images/types/imageModel";


export async function fetchImageModels(): Promise<AxiosResponse<ImageModelResponse>> {
  return axios.get('/models/images', {
    params: {
      limit: 100,
    },
  });
}