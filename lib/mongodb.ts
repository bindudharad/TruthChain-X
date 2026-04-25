import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI missing");
}

mongoose.set("bufferCommands", false);

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

const cached = global.mongoose;

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.log("Connecting to Mongo...");
    cached.promise = mongoose.connect(MONGODB_URI as string, { dbName: "truthchain" }).then((connection) => {
      console.log("Mongo connected");
      console.log("MongoDB Connected");
      return connection;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;

  return cached.conn;
}
