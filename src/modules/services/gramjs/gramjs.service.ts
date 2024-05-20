import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import bigInt from "big-integer";
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

@Injectable()
export class GramjsService implements OnModuleInit{
    private client:TelegramClient
    constructor(
        private readonly config:ConfigService,
    ){}
    async onModuleInit() {
        this.client = await this.connect()
    }
    private async connect(): Promise<TelegramClient> {
        const sessionString = new StringSession(this.config.get("SESSION_STRING"))
        const apiId = this.config.getOrThrow("API_ID")
        const apiHash= this.config.getOrThrow("API_HASH")
        const token= this.config.getOrThrow("BOT_TOKEN")
        const client = new TelegramClient(
            sessionString,
            Number(apiId),
            apiHash,
            { connectionRetries: 5 }
        );
        await client.start({
            botAuthToken: token,
        })
        
        this.config.set("SESSION_STRING",client.session.save())
        return client
    }
    public async getChatMembers(chatId: string): Promise<string[]> {
        
        const chatInfo: any = await this.client.invoke(
            new Api.channels.GetParticipants({
                channel: chatId,
                filter: new Api.ChannelParticipantsRecent(),
                offset: 0,
                limit: 100,
                hash: bigInt(chatId),
              })
        )
        const res:string[] = []
        for (let u of chatInfo["users"]){
            if (u["botInfoVersion"] === null){
                res.push("@"+u["username"])
            }
        }
        return res
    }
}
    