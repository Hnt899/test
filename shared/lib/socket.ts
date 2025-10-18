"use client";
import { io, Socket } from "socket.io-client";

const URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
export const socket: Socket = io(URL, { transports: ["websocket"] });

// Временные логи
socket.on("connect", () => console.log("WS connected:", socket.id));
socket.on("connect_error", (e) => console.error("WS error:", e.message));
