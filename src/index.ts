import express from "express";
import http from "http";
import { Server } from "socket.io";

class Main {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;
  private users: { name: string; id: string }[] = [];

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
        this.removeUser(socket.id);
      });

      socket.on("join-room", (name) => {
        this.addUser(name, socket.id);
        this.io.emit("user-joined", this.users);
      });

      socket.on("offer", (description) => {
        socket.broadcast.emit("offer", socket.id, description);
      });

      socket.on("answer", (id, description) => {
        socket.to(id).emit("answer", description);
      });

      socket.on("candidate", (candidate) => {
        socket.broadcast.emit("candidate", socket.id, candidate);
      });

      socket.on("sendMessage", (msg) => {
        this.io.emit("receiveMessage", msg);
      });
    });
  }

  private startServer(): void {
    this.server.listen(this.port, () => {
      console.log(`Example app listening on port ${this.port}`);
    });
  }

  private addUser(name: string, id: string) {
    this.users.push({ name, id });
  }

  private removeUser(id: string) {
    this.users = this.users.filter((user) => user.id !== id);
  }

  private getUser(id: string) {
    return this.users.find((user) => user.id === id);
  }
}

new Main();
