import express from "express";
import http from "http";
import { Server } from "socket.io";

class Main {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;
  private users: { name: string; id: string; rooms: string[] }[] = [];

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupSocketIO();

    this.startServer();
  }

  private setupMiddlewares(): void {
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get("/", (req, res) => {
      res.send("Hello World!");
    });
  }

  private setupSocketIO(): void {
    this.io.on("connection", (socket) => {
      console.log("a user connected");

      socket.on("disconnect", () => {
        console.log("user disconnected");
        const user = this.getUser(socket.id);
        if (user) {
          this.removeUser(socket.id);
          user.rooms.forEach((room) => {
            socket.to(room).emit("user-disconnected", socket.id);
          });
        }
      });

      socket.on("join-room", (name: string, room: string) => {
        socket.join(room);
        this.addUserToRoom(name, socket.id, room);
        socket.to(room).emit("user-joined", socket.id);
      });

      socket.on("offer", (id, description) => {
        const user = this.getUser(socket.id);
        if (user) {
          user.rooms.forEach((room) => {
            socket.to(room).emit("offer", id, description);
          });
        }
      });

      socket.on("answer", (id, description) => {
        const user = this.getUser(socket.id);
        if (user) {
          user.rooms.forEach((room) => {
            socket.to(room).emit("answer", id, description);
          });
        }
      });

      socket.on("candidate", (id, candidate) => {
        const user = this.getUser(socket.id);
        if (user) {
          if (
            candidate &&
            candidate.sdpMid !== null &&
            candidate.sdpMLineIndex !== null
          ) {
            user.rooms.forEach((room) => {
              socket.to(room).emit("candidate", id, candidate);
            });
          } else {
            console.error("Invalid ICE candidate", candidate);
          }
        }
      });

      socket.on("sendMessage", ({ room, msg }) => {
        const user = this.getUser(socket.id);
        if (user) {
          socket.to(room).emit("message", { user, msg });
          socket.emit("message", { user, msg }); // Emit the message to the sender
        }
      });
    });
  }

  private startServer(): void {
    this.server.listen(this.port, () => {
      console.log(`Example app listening on port ${this.port}`);
    });
  }

  private addUserToRoom(name: string, id: string, room: string) {
    let user = this.getUser(id);
    if (user) {
      if (!user.rooms.includes(room)) {
        user.rooms.push(room);
      }
    } else {
      this.users.push({ name, id, rooms: [room] });
    }
  }

  private removeUser(id: string) {
    this.users = this.users.filter((user) => user.id !== id);
  }

  private getUser(id: string) {
    return this.users.find((user) => user.id === id);
  }
}

new Main();
