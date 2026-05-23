/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as engine from "../engine.js";
import type * as games from "../games.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_chess from "../lib/chess.js";
import type * as lib_computerEngine from "../lib/computerEngine.js";
import type * as lib_games from "../lib/games.js";
import type * as lib_stats from "../lib/stats.js";
import type * as lib_timeControl from "../lib/timeControl.js";
import type * as migrations from "../migrations.js";
import type * as presence from "../presence.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  engine: typeof engine;
  games: typeof games;
  http: typeof http;
  invites: typeof invites;
  "lib/auth": typeof lib_auth;
  "lib/chess": typeof lib_chess;
  "lib/computerEngine": typeof lib_computerEngine;
  "lib/games": typeof lib_games;
  "lib/stats": typeof lib_stats;
  "lib/timeControl": typeof lib_timeControl;
  migrations: typeof migrations;
  presence: typeof presence;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  presence: import("@convex-dev/presence/_generated/component.js").ComponentApi<"presence">;
};
