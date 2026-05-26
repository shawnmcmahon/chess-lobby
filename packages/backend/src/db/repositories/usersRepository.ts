import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import type { User, UserId } from "../types/domain.js";
import { getDocClient } from "../client.js";
import { TABLES } from "../tables.js";

export class UsersRepository {
  async getById(userId: UserId): Promise<User | null> {
    const result = await getDocClient().send(
      new GetCommand({
        TableName: TABLES.users,
        Key: { userId },
      }),
    );
    return (result.Item as User | undefined) ?? null;
  }

  async upsert(user: User): Promise<void> {
    await getDocClient().send(
      new PutCommand({
        TableName: TABLES.users,
        Item: user,
      }),
    );
  }
}

export const usersRepository = new UsersRepository();
