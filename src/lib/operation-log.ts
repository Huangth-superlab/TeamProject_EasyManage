import { getSupabaseClient } from '@/storage/database/supabase-client';

interface LogOperationParams {
  userId: number;
  userName: string;
  module: string;
  operationType: string;
  targetName: string;
  detail?: string;
}

export async function logOperation(params: LogOperationParams) {
  const client = getSupabaseClient();
  
  try {
    const { error } = await client.from('operation_logs').insert({
      user_id: params.userId,
      user_name: params.userName,
      module: params.module,
      operation_type: params.operationType,
      target_name: params.targetName,
      detail: params.detail,
      operation_time: new Date().toISOString(),
    });
    
    if (error) {
      console.error('Failed to log operation:', error);
    }
  } catch (error) {
    console.error('Failed to log operation:', error);
    // 不抛出错误，避免影响主流程
  }
}