import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const parseCookies = (cookieHeader: string = ""): Record<string, string> => {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0]?.trim();
    const val = parts.slice(1).join("=").trim();
    if (key) {
      list[decodeURIComponent(key)] = decodeURIComponent(val || "");
    }
  });

  return list;
};

const setUpSocket = (io: Server) => {
  const userSocketMap = new Map<string, string>();

  io.on("connection", (socket) => {
    const cookies = parseCookies(socket.handshake.headers?.cookie || "");
    const token = cookies.accessToken || socket.handshake.auth?.token;

    let userId: string | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as { _id: string };
        userId = decoded._id;
        userSocketMap.set(userId, socket.id);
        console.log(`✅ Authenticated user connected: ${userId}`);
      } catch (_err) {
        // Continue as guest listener
      }
    }

    // Join public incident stream room
    socket.join("public-incidents");

    socket.on("disconnect", () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`❌ User disconnected: ${userId}`);
      }
    });
  });
};

export default setUpSocket;
