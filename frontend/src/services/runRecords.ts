import api from '@/services/api'
import type {
  CreateRunRecordPayload,
  CreateRunRecordResponse,
  DeleteRunRecordResponse,
  GetRunRecordsParams,
  GetRunRecordsResponse,
  UpdateRunRecordPayload,
  UpdateRunRecordResponse,
  UploadRunRecordImageResponse,
} from '@/types/runRecord'

export const createRunRecord = async (
  payload: CreateRunRecordPayload,
) => {
  const response = await api.post<CreateRunRecordResponse>(
    '/run-records',
    payload,
  )

  return response.data
}

export const updateRunRecord = async (
  runRecordId: string,
  payload: UpdateRunRecordPayload,
) => {
  const response =
    await api.patch<UpdateRunRecordResponse>(
      `/run-records/${runRecordId}`,
      payload,
    )

  return response.data
}

export const deleteRunRecord = async (runRecordId: string) => {
  const response = await api.delete<DeleteRunRecordResponse>(
    `/run-records/${runRecordId}`,
  )

  return response.data
}

export const getRunRecords = async (
  params: GetRunRecordsParams,
) => {
  const response = await api.get<GetRunRecordsResponse>(
    '/run-records',
    {
      params,
    },
  )

  return response.data
}

export const uploadRunRecordImage = async (file: File) => {
  const formData = new FormData()

  formData.append('image', file)

  const response = await api.post<UploadRunRecordImageResponse>(
    '/run-record-uploads/image',
    formData,
  )

  return response.data
}
