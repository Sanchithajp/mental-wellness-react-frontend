// Use relative paths for Next.js API routes (same server)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ChatMessage {
  sender: 'user' | 'bot' | 'assistant';
  text: string;
  id?: string;
  timestamp?: Date;
}

export interface ChatResponse {
  response: string;
  success: boolean;
  error?: string;
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map((msg) => ({
          sender: msg.sender,
          text: msg.text,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
