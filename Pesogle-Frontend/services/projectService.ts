import apiClient from './api';

export interface Project {
  _id: string;
  title: string;
  description: string;
  abstract: string;
  status: 'DRAFT' | 'ABSTRACT_SUBMITTED' | 'ABSTRACT_APPROVED' | 'IMPLEMENTATION' | 'MID_REVIEW' | 'FINAL_REPORT_SUBMITTED' | 'COMPLETED' | 'ARCHIVED';
  domain: string[];
  tech_stack: string[];
  progress: number;
  created_at: string;
  created_by: string;
  locked: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Task {
  _id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  assigned_to: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  comments?: Comment[];
  created_at: string;
}

export interface Member {
  _id: string;
  project_id: string;
  user_id: string;
  role: 'student_member' | 'student_lead' | 'faculty_guide' | 'faculty_reviewer';
}

export interface DocumentInfo {
  _id: string;
  project_id: string;
  title: string;
  phase: string;
  file_url?: string;
  feedback?: string | null;
  approved?: boolean | null;
  uploaded_at: string;
  file_name: string;
}

export const projectService = {
  getMyProjects: async (status?: string): Promise<Project[]> => {
    console.log('[ProjectService] Fetching my projects...');
    const url = status ? `/project-room/projects/me?status=${status}` : '/project-room/projects/me';
    const response = await apiClient.get<Project[]>(url);
    return response.data;
  },

  createProject: async (project: { title: string; abstract: string; domain: string[]; tech_stack: string[] }): Promise<{ project_id: string }> => {
    console.log('[ProjectService] Creating project...');
    const response = await apiClient.post('/project-room/projects', project);
    return response.data;
  },

  getExploreProjects: async (query?: string): Promise<Project[]> => {
    console.log('[ProjectService] Exploring projects...');
    const url = query ? `/project-room/projects/explore?query=${encodeURIComponent(query)}` : '/project-room/projects/explore';
    const response = await apiClient.get<Project[]>(url);
    return response.data;
  },

  getProjectById: async (id: string): Promise<Project> => {
    console.log('[ProjectService] Fetching project info for id:', id);
    const response = await apiClient.get<Project>(`/project-room/projects/${id}`);
    return response.data;
  },

  getProjectMembers: async (id: string): Promise<Member[]> => {
    console.log('[ProjectService] Fetching project members...');
    const response = await apiClient.get<Member[]>(`/project-room/projects/${id}/members`);
    return response.data;
  },

  getProjectTasks: async (id: string): Promise<Task[]> => {
    console.log('[ProjectService] Fetching project tasks...');
    const response = await apiClient.get<Task[]>(`/project-room/projects/${id}/tasks`);
    return response.data;
  },

  createTask: async (id: string, task: Partial<Task>): Promise<{ task_id: string; message: string }> => {
    console.log('[ProjectService] Creating task...');
    const response = await apiClient.post(`/project-room/projects/${id}/tasks`, task);
    return response.data;
  },

  updateTask: async (projectId: string, taskId: string, task: Partial<Task>): Promise<{ message: string }> => {
    console.log('[ProjectService] Updating task...');
    const response = await apiClient.put(`/project-room/projects/${projectId}/tasks/${taskId}`, task);
    return response.data;
  },

  addTaskComment: async (projectId: string, taskId: string, content: string): Promise<{ message: string }> => {
    console.log('[ProjectService] Adding task comment...');
    const response = await apiClient.post(`/project-room/projects/${projectId}/tasks/${taskId}/comments`, { content });
    return response.data;
  },
  
  deleteTaskComment: async (projectId: string, taskId: string, commentId: string): Promise<{ message: string }> => {
    console.log('[ProjectService] Deleting task comment...');
    const response = await apiClient.delete(`/project-room/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<{ message: string }> => {
    console.log('[ProjectService] Updating project...');
    const response = await apiClient.put(`/project-room/projects/${id}`, data);
    return response.data;
  },

  getProjectDocuments: async (id: string): Promise<DocumentInfo[]> => {
    console.log('[ProjectService] Fetching project documents...');
    const response = await apiClient.get<DocumentInfo[]>(`/project-room/projects/${id}/documents`);
    return response.data;
  },

  getDocumentDetails: async (projectId: string, documentId: string): Promise<{ file_url: string }> => {
    console.log(`[ProjectService] Fetching document details for ${documentId}...`);
    const response = await apiClient.get(`/project-room/projects/${projectId}/documents/${documentId}`);
    return response.data;
  },

  uploadDocument: async (id: string, formData: FormData): Promise<{ message: string; document_id: string }> => {
    console.log('[ProjectService] Uploading document...');
    const response = await apiClient.post(`/project-room/projects/${id}/documents`, formData);
    return response.data;
  },

  updateDocument: async (projectId: string, documentId: string, formData: FormData): Promise<{ message: string }> => {
    console.log(`[ProjectService] Updating document ${documentId}...`);
    const response = await apiClient.put(`/project-room/projects/${projectId}/documents/${documentId}`, formData);
    return response.data;
  },

  deleteDocument: async (projectId: string, documentId: string): Promise<{ message: string }> => {
    console.log(`[ProjectService] Deleting document ${documentId}...`);
    const response = await apiClient.delete(`/project-room/projects/${projectId}/documents/${documentId}`);
    return response.data;
  },
  
  addMember: async (projectId: string, userId: string, role: Member['role']): Promise<{ message: string }> => {
    console.log(`[ProjectService] Adding member ${userId} with role ${role}...`);
    const response = await apiClient.post(`/project-room/projects/${projectId}/members`, {
      user_id: userId,
      role: role
    });
    return response.data;
  },

  removeMember: async (projectId: string, userId: string): Promise<{ message: string }> => {
    console.log(`[ProjectService] Removing member ${userId} from project ${projectId}...`);
    const response = await apiClient.delete(`/project-room/projects/${projectId}/members/${userId}`);
    return response.data;
  }
};
