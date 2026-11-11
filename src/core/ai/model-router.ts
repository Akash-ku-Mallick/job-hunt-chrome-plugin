import { GROQ_MODELS } from '../../shared/constants';

export type TaskType = 'JD_EXTRACTION' | 'FIELD_CLASSIFICATION' | 'ESSAY_ANSWER';

export function selectModelForTask(task: TaskType, userPreferred?: string): string {
  if (userPreferred && task === 'ESSAY_ANSWER') {
    return userPreferred;
  }

  switch (task) {
    case 'JD_EXTRACTION':
    case 'FIELD_CLASSIFICATION':
      return GROQ_MODELS.DEV_FAST_EXTRACT;
    case 'ESSAY_ANSWER':
    default:
      return GROQ_MODELS.DEV_ESSAY_PRIMARY;
  }
}

