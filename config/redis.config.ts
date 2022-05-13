import { createClient, RedisClientType } from "redis";

export let redis: RedisClientType;
export let subClient: RedisClientType;

export const connectRedis = async () => {
    redis = createClient({
        url: process.env.REDIS_URL,
    });
    subClient = redis.duplicate();

    redis.on("connect", () => {
        console.log(" [ REDIS ] - connecting...".yellow.dim);
        redis.flushAll();
    });

    redis.on("ready", () => {
        console.log(" [ REDIS ] - connected".green);
    });

    redis.on("end", () => {
        console.log(" [ REDIS ] - disconnected".red.dim);
    });

    redis.on("error", (err) => {
        console.log(" [ REDIS ] - error".red);
    });

    redis.on("reconnecting", () => {
        console.log(" [ REDIS ] - reconnecting".green.dim);
    });

    await Promise.all([redis.connect(), subClient.connect()]);
};
