
import { User, UserRole, Audit, AuditStatus, Agent, Project, AppSettings, RubricItem, Theme, ProjectTargets, AuditType, Perception, UsageStats, ChatSession } from '../types';
import { cloudSync } from './supabaseClient';

const USERS_KEY = 'acpia_users';
const AUDITS_KEY = 'acpia_audits';
const AGENTS_KEY = 'acpia_agents';
const PROJECTS_KEY = 'acpia_projects';
const SETTINGS_KEY = 'acpia_settings';
const THEME_KEY = 'acpia_theme';
const RUBRIC_KEY = 'acpia_rubric';
const DRAFT_KEY = 'acpia_draft';
const CHAT_SESSIONS_KEY = 'acpia_chat_sessions';

export const SYSTEM_DEFAULT_LABELS: Record<string, string> = {
    cordiality: "Cordiality",
    pauses: "Adequate Pauses",
    activeListening: "Active Listening",
    empathy: "Empathy",
    scriptUsage: "Script Usage",
    solution: "Solution Provided",
    compliance: "Compliance Statement",
    emotionHandling: "Emotion Handling",
    grammar: "Grammar / Spelling",
    accessEase: "Ease of Access to Info"
};

export const getAppSettings = (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults: AppSettings = { 
        companyName: 'Rc506 | Gestion de Calidad',
        usage: { aiAuditsCount: 0, estimatedTokens: 0, estimatedCost: 0 }
    };
    if (!data) return defaults;
    const parsed = JSON.parse(data);
    return { ...defaults, ...parsed };
};

export const saveAppSettings = (settings: AppSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getTheme = (): Theme => (localStorage.getItem(THEME_KEY) as Theme) || 'dark';
export const saveTheme = (theme: Theme): void => localStorage.setItem(THEME_KEY, theme);

export const updateUsageStats = (tokens: number, isAudit: boolean = true) => {
    const settings = getAppSettings();
    const currentUsage = settings.usage || { aiAuditsCount: 0, estimatedTokens: 0, estimatedCost: 0 };
    const costPerToken = 0.00000015; 
    const updatedUsage: UsageStats = {
        aiAuditsCount: currentUsage.aiAuditsCount + (isAudit ? 1 : 0),
        estimatedTokens: currentUsage.estimatedTokens + tokens,
        estimatedCost: currentUsage.estimatedCost + (tokens * costPerToken)
    };
    saveAppSettings({ ...settings, usage: updatedUsage });
};

// --- AUDITS ---
export const getAudits = (): Audit[] => {
    const data = localStorage.getItem(AUDITS_KEY);
    const audits: Audit[] = data ? JSON.parse(data) : [];
    return audits.map(a => ({ ...a, status: a.status || AuditStatus.PENDING_REVIEW }));
};

export const saveAudit = (audit: Audit): void => {
    const audits = getAudits();
    const existingIndex = audits.findIndex(a => a.id === audit.id);
    const auditToSave = { ...audit, status: audit.status || AuditStatus.PENDING_REVIEW };
    if (existingIndex >= 0) audits[existingIndex] = auditToSave;
    else audits.push(auditToSave);
    localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
    cloudSync.push('audits', auditToSave);
};

export const deleteAudit = (id: string): void => {
    const audits = getAudits().filter(a => a.id !== id);
    localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
    cloudSync.delete('audits', id);
};

// --- AGENTS ---
export const getAgents = (): Agent[] => JSON.parse(localStorage.getItem(AGENTS_KEY) || '[]');
export const saveAgent = (name: string): void => {
    const agents = getAgents();
    if (!agents.find(a => a.name === name)) {
        const newAgent = { id: Date.now().toString(), name };
        agents.push(newAgent);
        localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
        cloudSync.push('agents', newAgent);
    }
};
export const deleteAgent = (id: string): void => {
    const agents = getAgents().filter(a => a.id !== id);
    localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
    cloudSync.delete('agents', id);
};

// --- PROJECTS ---
export const getProjects = (): Project[] => JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');

export const saveProject = (name: string, targets?: ProjectTargets, rubricIds?: string[]): void => {
    const projects = getProjects();
    const existingIdx = projects.findIndex(p => p.name === name || p.id === name);
    
    const projectToSave: Project = { 
        id: existingIdx >= 0 ? projects[existingIdx].id : Date.now().toString(), 
        name: name.trim(), 
        targets: targets || { score: 90, csat: 4.5 }, 
        rubricIds: rubricIds || [] 
    };
    
    if (existingIdx >= 0) projects[existingIdx] = projectToSave;
    else projects.push(projectToSave);
    
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    cloudSync.push('projects', projectToSave);
};

export const deleteProject = (id: string): void => {
    const projects = getProjects().filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    cloudSync.delete('projects', id);
};

// --- RUBRIC ---
export const getRubric = (): RubricItem[] => {
    const data = localStorage.getItem(RUBRIC_KEY);
    if (data) return JSON.parse(data);
    const defaults: RubricItem[] = Object.keys(SYSTEM_DEFAULT_LABELS).map(key => ({
        id: key,
        label: SYSTEM_DEFAULT_LABELS[key],
        category: (key === 'grammar' || key === 'compliance') ? 'hard' : 'soft',
        isActive: true,
        type: (key === 'grammar' || key === 'accessEase') ? AuditType.CHAT : (key === 'pauses') ? AuditType.VOICE : 'BOTH'
    }));
    localStorage.setItem(RUBRIC_KEY, JSON.stringify(defaults));
    return defaults;
};

export const saveRubricItem = (item: RubricItem): void => {
    const rubric = getRubric();
    const idx = rubric.findIndex(r => r.id === item.id);
    if (idx >= 0) rubric[idx] = item;
    else rubric.push(item);
    localStorage.setItem(RUBRIC_KEY, JSON.stringify(rubric));
};

export const toggleRubricItem = (id: string): void => {
    const rubric = getRubric();
    const item = rubric.find(r => r.id === id);
    if (item) {
        item.isActive = !item.isActive;
        localStorage.setItem(RUBRIC_KEY, JSON.stringify(rubric));
    }
};

export const deleteRubricItem = (id: string): void => {
    const rubric = getRubric().filter(r => r.id !== id);
    localStorage.setItem(RUBRIC_KEY, JSON.stringify(rubric));
};

// --- USERS ---
export const getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
export const saveUser = (user: User): void => {
    const users = getUsers();
    const existingIdx = users.findIndex(u => u.id === user.id);
    if (existingIdx >= 0) {
        users[existingIdx] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    cloudSync.push('users', user);
};

export const deleteUser = (id: string): void => {
    const users = getUsers().filter(u => u.id !== id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    cloudSync.delete('users', id);
};

export const authenticate = (id: string, pin: string): User | null => getUsers().find(u => u.id === id && u.pin === pin) || null;
export const initAuth = () => { if (getUsers().length === 0) saveUser({ id: 'admin', name: 'Admin', role: UserRole.ADMIN, pin: '1234' }); };
export const getOrgId = (user: User | null): string => user?.organizationId || 'acpia-default';

// --- CLOUD SYNC ---
export const fullCloudPull = async () => {
    try {
        const audits = await cloudSync.pull('audits');
        const agents = await cloudSync.pull('agents');
        const projects = await cloudSync.pull('projects');
        const users = await cloudSync.pull('users');

        if (audits && audits.length > 0) localStorage.setItem(AUDITS_KEY, JSON.stringify(audits));
        if (agents && agents.length > 0) localStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
        if (projects && projects.length > 0) localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        if (users && users.length > 0) localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Cloud Pull failed", e);
    }
};

// --- HELPERS ---
export const downloadCSV = (audits: Audit[]): void => {
    const headers = ['Date', 'ID', 'Agent', 'Project', 'Status', 'CSAT', 'Score'];
    const rows = audits.map(a => [a.date, a.readableId || a.id, a.agentName, a.project, a.status, a.csat, (a.qualityScore || 0) + '%']);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `audits_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportData = () => {
    const data = { audits: getAudits(), agents: getAgents(), projects: getProjects(), rubric: getRubric(), settings: getAppSettings(), users: getUsers() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acpia_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
};

export const importData = (jsonData: string) => {
    try {
        const data = JSON.parse(jsonData);
        if (data.audits) localStorage.setItem(AUDITS_KEY, JSON.stringify(data.audits));
        if (data.agents) localStorage.setItem(AGENTS_KEY, JSON.stringify(data.agents));
        if (data.projects) localStorage.setItem(PROJECTS_KEY, JSON.stringify(data.projects));
        if (data.rubric) localStorage.setItem(RUBRIC_KEY, JSON.stringify(data.rubric));
        if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
        if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
        return true;
    } catch (e) { return false; }
};

export const clearAllData = () => localStorage.clear();
export const getChatSessions = (): ChatSession[] => JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY) || '[]');
export const saveChatSession = (session: ChatSession): void => {
    const sessions = getChatSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session;
    else sessions.unshift(session);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};
export const deleteChatSession = (id: string): void => {
    const sessions = getChatSessions().filter(s => s.id !== id);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
};
export const createNewSession = (): ChatSession => ({ id: Date.now().toString(), title: 'New Chat', date: Date.now(), messages: [] });
