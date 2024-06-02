import express from "express";
import http from "http";
import { Server } from "socket.io";

class Main {
  private app: express.Application;
  private server: http.Server;
  private io: Server;
  private port: number;

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
}

new Main();
