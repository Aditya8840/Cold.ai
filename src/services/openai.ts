import OpenAI from 'openai';
import config from '../config';

class OpenaiService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
        });
    }

    async analyzeEmailContext(emailContent: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: 'system', content: 'Analyze the following email and give a summary.' },
                    { role: 'user', content: emailContent }
                ],
                max_tokens: 150,
            });
            return response.choices?.[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('Error analyzing email context:', error);
            throw error;
        }
    }

    async categorizeEmailContent(emailContent: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: 'system',
                        content: 'Categorize this email content into one of the following categories: Interested, Not Interested, More information. Please answer using only these words.'
                    },
                    { role: 'user', content: emailContent }
                ],
                max_tokens: 20,
            });
            return response.choices?.[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('Error categorizing email content:', error);
            throw error;
        }
    }

    async generateEmailReply(emailContent: string): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: 'system',
                        content: 'Generate an appropriate reply for the following email content. Return only the reply message.'
                    },
                    { role: 'user', content: emailContent }
                ],
                max_tokens: 150,
            });
            return response.choices?.[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('Error generating email reply:', error);
            throw error;
        }
    }
}

export default OpenaiService;