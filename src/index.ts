import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

class Main {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;
  private users: { name: string; id: string; room: string }[] = [];

  constructor(port: number = 4000) {
    this.port = port;
    this.app = express();
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
      })
    );
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
        this.removeUser(socket.id);
        this.io.emit("user-disconnected", socket.id);
      });

      socket.on("join-room", (room, name) => {
        const existingUser = this.users.find((user) => user.id === socket.id);
        if (!existingUser) {
          socket.join(room);
          this.addUser(socket.id, room, name);
          socket.to(room).emit("user-connected", socket.id);
        }
      });

      socket.on("offer", (room, description, to) => {
        socket.to(to).emit("offer", socket.id, description);
      });

      socket.on("answer", (room, description, to) => {
        socket.to(to).emit("answer", socket.id, description);
      });

      socket.on("candidate", (room, candidate, to) => {
        socket.to(to).emit("candidate", socket.id, candidate);
      });

      socket.on("sendMessage", (room, msg) => {
        const user = this.users.find((user) => user.id === socket.id);
        this.io
          .to(room)
          .emit("receiveMessage", { message: msg, user: user?.name });

        console.log("users: ", this.users);

        console.log("socketsID", this.io.sockets.adapter.rooms.get(room));
      });
    });
  }

  private startServer(): void {
    this.server.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }

  private addUser(id: string, room: string, name: string) {
    this.users.push({
      id,
      room,
      name,
    });
  }

  private removeUser(id: string) {
    this.users = this.users.filter((user) => user.id !== id);
  }
}

new Main();
