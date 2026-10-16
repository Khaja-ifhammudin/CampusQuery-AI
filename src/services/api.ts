import {
  ConversationSummary,
  Conversation,
  KnowledgeDocumentSummary,
  KnowledgeDocumentDetail,
  AnalyticsStats,
  SystemStatus,
  UserRole,
} from '../types';

export class CampusApi {
  // Pure in-memory credential storage (cleared on page reload or explicit logout)
  private static adminKey: string = '';

  static sanitizeToken(raw: string): string {
    if (!raw) return '';
    return raw
      .trim()
      .replace(/^ADMIN_API_KEY\s*=\s*/i, '')
      .replace(/^Bearer\s+/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();
  }

  static setAdminKey(key: string): void {
    this.adminKey = this.sanitizeToken(key);
  }

  static getAdminKey(): string {
    return this.adminKey;
  }

  static clearAdminKey(): void {
    this.adminKey = '';
  }

  static hasAdminKey(): boolean {
    return Boolean(this.adminKey);
  }

  static async verifyAdminKey(key: string): Promise<boolean> {
    const cleaned = this.sanitizeToken(key);
    if (!cleaned) return false;
    try {
      const res = await fetch('/api/admin/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleaned}`,
          'x-admin-key': cleaned,
        },
        body: JSON.stringify({ adminKey: cleaned }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private static getHeaders(role: UserRole = 'student'): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': role,
    };
    if (role === 'admin' && this.adminKey) {
      headers['Authorization'] = `Bearer ${this.adminKey}`;
      headers['x-admin-key'] = this.adminKey;
    }
    return headers;
  }

  private static async handleResponseError(res: Response, fallbackMessage: string): Promise<never> {
    let errorMessage = `HTTP ${res.status}: ${res.statusText || fallbackMessage}`;
    try {
      const err = await res.json();
      errorMessage = err.message || err.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text && text.trim().length > 0 && text.length < 250) {
        errorMessage = `HTTP ${res.status}: ${text.trim()}`;
      }
    }
    throw new Error(errorMessage);
  }

  // System status
  static async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) await this.handleResponseError(res, 'Failed to fetch system status');
    return res.json();
  }

  // Conversations
  static async getConversations(): Promise<ConversationSummary[]> {
    const res = await fetch('/api/conversations');
    if (!res.ok) await this.handleResponseError(res, 'Failed to fetch conversations');
    return res.json();
  }

  static async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) await this.handleResponseError(res, 'Failed to fetch conversation');
    return res.json();
  }

  static async createConversation(title?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title }),
    });
    if (!res.ok) await this.handleResponseError(res, 'Failed to create conversation');
    return res.json();
  }

  static async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) await this.handleResponseError(res, 'Failed to delete conversation');
  }

  static async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{
    conversationId: string;
    userMessage: any;
    assistantMessage: any;
    metadata: {
      category: string;
      isFallback: boolean;
      responseTimeMs: number;
    };
  }> {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to send message');
    }
    return res.json();
  }

  static async sendFeedback(
    conversationId: string,
    messageId: string,
    feedback: 'helpful' | 'unhelpful'
  ): Promise<void> {
    const res = await fetch(`/api/conversations/${conversationId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messageId, feedback }),
    });
    if (!res.ok) await this.handleResponseError(res, 'Failed to submit feedback');
  }

  // Documents (Admin)
  static async getDocuments(): Promise<KnowledgeDocumentSummary[]> {
    const res = await fetch('/api/documents');
    if (!res.ok) await this.handleResponseError(res, 'Failed to fetch documents');
    return res.json();
  }

  static async getDocumentDetail(id: string): Promise<KnowledgeDocumentDetail> {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) await this.handleResponseError(res, 'Failed to fetch document detail');
    return res.json();
  }

  static async uploadDocument(
    payload: {
      title: string;
      category: string;
      filename?: string;
      content?: string;
      base64Data?: string;
      mimeType?: string;
    },
    role: UserRole
  ): Promise<any> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getHeaders(role),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to upload document');
    }
    return res.json();
  }

  static async toggleDocument(id: string, role: UserRole): Promise<any> {
    const res = await fetch(`/api/documents/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to toggle document');
    }
    return res.json();
  }

  static async deleteDocument(id: string, role: UserRole): Promise<void> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to delete document');
    }
  }

  static async resetDemoDocuments(role: UserRole): Promise<any> {
    const res = await fetch('/api/documents/reset-demo', {
      method: 'POST',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to reset demo documents');
    }
    return res.json();
  }

  // Analytics (Admin)
  static async getAnalytics(role: UserRole): Promise<AnalyticsStats> {
    const res = await fetch('/api/admin/analytics', {
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to load analytics');
    }
    return res.json();
  }

  static async resolveUnansweredQuery(id: string, role: UserRole): Promise<void> {
    const res = await fetch(`/api/admin/unanswered/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(role),
    });
    if (!res.ok) {
      await this.handleResponseError(res, 'Failed to resolve query');
    }
  }
}
