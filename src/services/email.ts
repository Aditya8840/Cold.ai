import { google, gmail_v1 } from "googleapis";
import { Queue } from "bullmq";
import { connection } from "../db/redis";
import logger from "../utils/logger";
import OpenaiService from "./openai";
import User from "../types/user";

type LabelCategory = "Interested" | "Not interested" | "More information";

class EmailService {
  private gmailClient: gmail_v1.Gmail | null = null;
  private emailQueue: Queue;
  private openaiService: OpenaiService;
  private user: User;

  private labelMapping = {
    Interested: "Label_3035777443514222121",
    "Not interested": "Label_5649682475137114370",
    "More information": "Label_5331249162142973886",
  };

  constructor(user: User, openaiService: OpenaiService) {
    this.user = user;
    this.openaiService = openaiService;
    this.emailQueue = new Queue("emailQueue", { connection });
    this.initializeGmailClient(user.accessToken);
    this.scheduleCheckUnreadEmails();
  }

  initializeGmailClient(accessToken: string) {
    const oAuth2Client = new google.auth.OAuth2();
    oAuth2Client.setCredentials({ access_token: accessToken });
    this.gmailClient = google.gmail({ version: "v1", auth: oAuth2Client });
    logger.info(`Initialized Gmail client for user: ${this.user.id}`);
  }

  private async scheduleCheckUnreadEmails() {
    await this.emailQueue.add(
      "checkUnreadEmails",
      { userId: this.user.id },
      { delay: 60000 }
    );
    logger.info(`Scheduled 'checkUnreadEmails' job for user: ${this.user.id}`);
  }

  async checkUnreadEmails() {
    const res = await this.gmailClient!.users.messages.list({
      userId: "me",
      q: "is:unread",
    });
    const messages = res.data.messages || [];
    logger.info(`User ${this.user.id} has ${messages.length} unread emails.`);

    for (const message of messages) {
      await this.emailQueue.add("processEmail", {
        userId: this.user.id,
        messageId: message.id,
      });
    }
  }

  async assignLabelToEmail(messageId: string, labelId: string) {
    await this.gmailClient!.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { addLabelIds: [labelId] },
    });
    logger.info(`Label ${labelId} assigned to email: ${messageId}`);
  }

  async getEmailData(messageId: string) {
    const res = await this.gmailClient!.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });
    const email = res.data;
    const headers = email.payload?.headers || [];
    const subject =
      headers.find((header) => header.name === "Subject")?.value ||
      "No Subject";
    const from = headers.find((header) => header.name === "From")?.value || "";
    const to = headers.find((header) => header.name === "To")?.value || "";
    const emailContent = email.snippet || "";

    return { from, to, subject, emailContent };
  }

  createReplyMessage(
    from: string,
    to: string,
    subject: string,
    text: string,
    messageId: string
  ): string {
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${messageId}`,
      `References: ${messageId}`,
      "",
      text,
    ];

    const message = messageParts.join("\n");
    return Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  async sendReplyEmail(
    messageId: string,
    emailData: { from: string; to: string; subject: string; text: string }
  ) {
    const { from, to, subject, text } = emailData;
    const message = this.createReplyMessage(to, from, subject, text, messageId);

    const res = await this.gmailClient!.users.messages.send({
      userId: "me",
      requestBody: { raw: message },
    });

    logger.info(`Reply sent to: ${from}, message ID: ${res.data.id}`);
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.gmailClient!.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { removeLabelIds: ["UNREAD"] },
    });
    logger.info(`Marked email ${messageId} as read for user ${this.user.id}`);
  }

  async processIncomingEmail(
    messageId: string,
    emailData: {
      from: string;
      to: string;
      subject: string;
      emailContent: string;
    }
  ) {
    const summary = await this.openaiService.analyzeEmailContext(
      emailData.emailContent
    );
    logger.info(`Email summary: ${summary}`);

    const category = await this.openaiService.categorizeEmailContent(
      emailData.emailContent
    );
    logger.info(`Email category: ${category}`);

    const labelId = this.labelMapping[category as LabelCategory] || null;
    if (labelId) {
      await this.assignLabelToEmail(messageId, labelId);
    } else {
      logger.warn(`No label found for category: ${category}`);
    }

    const reply = await this.openaiService.generateEmailReply(
      emailData.emailContent
    );
    logger.info(`Email reply: ${reply}`);

    await this.sendReplyEmail(messageId, {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      text: reply,
    });
    logger.info(
      `Email processed for messageId ${messageId}: Summary - ${summary}, Category - ${category}`
    );

    await this.markAsRead(messageId);
  }
}

export default EmailService;
