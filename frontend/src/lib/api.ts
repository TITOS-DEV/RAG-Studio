import axios from 'axios';
import type { CreateRagPayload, CreateRagResponse, ChatPayload, ChatResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

export async function createRag(payload: CreateRagPayload): Promise<CreateRagResponse> {
  const { data } = await api.post<CreateRagResponse>('/create-rag', payload);
  return data;
}

export async function uploadRag(name: string, files: File[]): Promise<CreateRagResponse> {
  const form = new FormData();
  form.append('name', name);
  form.append('sourceType', 'documents');
  files.forEach((file) => form.append('files', file));

  const { data } = await axios.post<CreateRagResponse>('/api/upload-rag', form, {
    timeout: 120000,
  });
  return data;
}

export async function chat(payload: ChatPayload): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/chat', payload);
  return data;
}
