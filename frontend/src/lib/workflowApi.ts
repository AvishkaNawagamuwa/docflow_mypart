const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

let csrfReady = false;

function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length < 2) return null;
    return decodeURIComponent(parts.pop()!.split(';').shift() || '');
}

async function ensureCsrfCookie() {
    if (csrfReady && getCookie('csrftoken')) {
        return;
    }

    await fetch(`${API_BASE_URL}/csrf/`, {
        credentials: 'include',
    });
    csrfReady = true;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const method = (init?.method || 'GET').toUpperCase();
    const isWrite = !['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method);

    if (isWrite) {
        await ensureCsrfCookie();
    }

    const csrfToken = getCookie('csrftoken');
    const isFormDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: {
            ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
            ...(isWrite && csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
            ...(init?.headers || {}),
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export interface WorkflowDefinitionPayload {
    workflowId: string;
    version: number;
    name: string;
    description?: string;
    documentCategory?: string;
    documentType?: string;
    status?: 'draft' | 'active' | 'archived' | 'disabled';
    trigger?: 'onedrive' | 'manual' | 'api';
    triggerPath?: string;
    allowedFileTypes?: string[];
    nodes: Array<Record<string, unknown>>;
    connections: Array<Record<string, unknown>>;
    conditions?: Array<Record<string, unknown>>;
    sla?: Array<Record<string, unknown>>;
    approvalRules?: Array<Record<string, unknown>>;
    escalationRules?: Array<Record<string, unknown>>;
}

export interface ApiTimelineEvent {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    comment?: string | null;
    attachments?: string[];
}

export interface ApiWorkflow {
    uuid: string;
    workflowId: string;
    name: string;
    description: string;
    documentCategory: string;
    documentType: string;
    status: string;
    version: number;
    trigger: 'onedrive' | 'manual' | 'api';
    triggerPath?: string;
    allowedFileTypes: string[];
    definition?: Record<string, unknown>;
    createdBy?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiWorkflowInstance {
    uuid: string;
    workflowId: string;
    workflowName: string;
    documentName: string;
    documentType: string;
    status: string;
    currentStep: string;
    currentAssignee?: string | null;
    startedAt: string;
    completedAt?: string | null;
    runtimeState?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    timeline: ApiTimelineEvent[];
}

export interface ApiTaskInstance {
    uuid: string;
    workflowId: string;
    workflowName: string;
    workflowInstance: string;
    nodeInstance: string;
    documentName: string;
    documentType: string;
    currentStep: string;
    nodeType: string;
    assignedUser?: string | null;
    assignedRole?: string | null;
    assignedRoleId?: string | null;
    status: string;
    action: string;
    comment: string;
    payload: Record<string, unknown>;
    requiresSubmission?: boolean;
    requiresApproval?: boolean;
    submissionData?: Record<string, unknown>;
    approvalData?: Record<string, unknown>;
    slaSeconds?: number;
    slaExceeded?: boolean;
    startedAt?: string | null;
    dueAt?: string | null;
    completedAt?: string | null;
}

export interface ApiDepartment {
    uuid: string;
    id: string;
    name: string;
}

export interface ApiRole {
    uuid: string;
    id: string;
    name: string;
    description: string;
    departmentId?: string | null;
    departmentName?: string | null;
}

export interface ApiUserProfile {
    id: string;
    userId: string;
    username: string;
    roleId?: string | null;
    roleName?: string | null;
    departmentId?: string | null;
    departmentName?: string | null;
}

export interface ApiNotification {
    id: string;
    roleId?: string | null;
    taskId?: string | null;
    workflowInstanceId: string;
    notification_type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
    isRead: boolean;
    created_at: string;
}

const listRequest = async <T>(path: string): Promise<T> => requestJson<T>(path);

export const workflowApi = {
    listWorkflows() {
        return listRequest<ApiWorkflow[]>('/workflows/');
    },

    getWorkflow(workflowUuid: string) {
        return requestJson<ApiWorkflow>(`/workflows/${workflowUuid}/`);
    },

    listWorkflowInstances() {
        return listRequest<ApiWorkflowInstance[]>('/workflow-instances/');
    },

    listTaskInstances(roleId?: string) {
        const suffix = roleId ? `?role_id=${encodeURIComponent(roleId)}` : '';
        return listRequest<ApiTaskInstance[]>(`/task-instances/${suffix}`);
    },

    listDepartments() {
        return listRequest<ApiDepartment[]>('/departments/');
    },

    listRoles(departmentId?: string) {
        const suffix = departmentId ? `?department_id=${encodeURIComponent(departmentId)}` : '';
        return listRequest<ApiRole[]>(`/roles/${suffix}`);
    },

    listProfiles() {
        return listRequest<ApiUserProfile[]>('/profiles/');
    },

    saveWorkflowDefinition(definition: WorkflowDefinitionPayload) {
        return requestJson<Record<string, unknown>>('/workflows/', {
            method: 'POST',
            body: JSON.stringify(definition),
        });
    },

    updateWorkflowDefinition(workflowUuid: string, definition: WorkflowDefinitionPayload) {
        return requestJson<Record<string, unknown>>(`/workflows/${workflowUuid}/`, {
            method: 'PUT',
            body: JSON.stringify(definition),
        });
    },

    startWorkflow(workflowUuid: string, payload: Record<string, unknown> = {}) {
        return requestJson<ApiWorkflowInstance>(`/workflows/${workflowUuid}/start/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    submitTask(taskUuid: string, payload: { action: 'approve' | 'reject' | 'complete'; comment?: string; payload?: Record<string, unknown> }) {
        return requestJson<Record<string, unknown>>(`/task-instances/${taskUuid}/submit/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    submitTaskFiles(taskUuid: string, files: File[], payload: { action?: 'complete'; comment?: string; payload?: Record<string, unknown> } = {}) {
        const formData = new FormData();
        formData.append('action', payload.action || 'complete');
        formData.append('comment', payload.comment || '');
        formData.append('payload', JSON.stringify(payload.payload || {}));
        files.forEach((file) => formData.append('files', file));

        return requestJson<Record<string, unknown>>(`/task-instances/${taskUuid}/submit/`, {
            method: 'POST',
            body: formData,
        });
    },

    completeTask(taskUuid: string, payload: { action?: 'approve' | 'reject' | 'complete'; comment?: string; payload?: Record<string, unknown> } = {}) {
        return requestJson<Record<string, unknown>>(`/task-instances/${taskUuid}/complete/`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    listNotifications(roleId?: string) {
        const suffix = roleId ? `?role_id=${encodeURIComponent(roleId)}` : '';
        return listRequest<ApiNotification[]>(`/notifications/${suffix}`);
    },

    markNotificationRead(notificationId: string) {
        return requestJson<ApiNotification>(`/notifications/${notificationId}/mark-read/`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
    },

    getWorkflowStatus(instanceUuid: string) {
        return requestJson<Record<string, unknown>>(`/workflow-instances/${instanceUuid}/status/`);
    },
};