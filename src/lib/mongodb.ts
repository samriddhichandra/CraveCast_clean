import { MongoClient, type MongoClientOptions } from 'mongodb';
import mongoose from 'mongoose';

const envNumber = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const envBool = (value: string | undefined): boolean =>
    (value ?? '').toLowerCase() === 'true';

const commonMongoTuningFromEnv = () => {
    const serverSelectionTimeoutMS = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS ?? 5000);
    const connectTimeoutMS = Number(process.env.MONGO_CONNECT_TIMEOUT_MS ?? 10000);
    const socketTimeoutMS = Number(process.env.MONGO_SOCKET_TIMEOUT_MS ?? 45000);
    const maxPoolSize = Number(process.env.MONGO_MAX_POOL_SIZE ?? 10);

    const tlsAllowInvalidCertificates = envBool(process.env.MONGO_TLS_ALLOW_INVALID_CERTS);
    const tlsAllowInvalidHostnames = envBool(process.env.MONGO_TLS_ALLOW_INVALID_HOSTNAMES);

    return {
        serverSelectionTimeoutMS,
        connectTimeoutMS,
        socketTimeoutMS,
        maxPoolSize,
        tlsAllowInvalidCertificates,
        tlsAllowInvalidHostnames,
    } as const;
};

const mongoClientOptionsFromEnv = (): MongoClientOptions => {
    const tuning = commonMongoTuningFromEnv();
    return {
        serverSelectionTimeoutMS: envNumber(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, tuning.serverSelectionTimeoutMS),
        connectTimeoutMS: envNumber(process.env.MONGO_CONNECT_TIMEOUT_MS, tuning.connectTimeoutMS),
        socketTimeoutMS: envNumber(process.env.MONGO_SOCKET_TIMEOUT_MS, tuning.socketTimeoutMS),
        maxPoolSize: envNumber(process.env.MONGO_MAX_POOL_SIZE, tuning.maxPoolSize),
        ...(tuning.tlsAllowInvalidCertificates ? { tlsAllowInvalidCertificates: true } : {}),
        ...(tuning.tlsAllowInvalidHostnames ? { tlsAllowInvalidHostnames: true } : {}),
    };
};

const mongooseOptionsFromEnv = (): mongoose.ConnectOptions => {
    const tuning = commonMongoTuningFromEnv();
    return {
        serverSelectionTimeoutMS: envNumber(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, tuning.serverSelectionTimeoutMS),
        connectTimeoutMS: envNumber(process.env.MONGO_CONNECT_TIMEOUT_MS, tuning.connectTimeoutMS),
        socketTimeoutMS: envNumber(process.env.MONGO_SOCKET_TIMEOUT_MS, tuning.socketTimeoutMS),
        maxPoolSize: envNumber(process.env.MONGO_MAX_POOL_SIZE, tuning.maxPoolSize),
        ...(tuning.tlsAllowInvalidCertificates ? { tlsAllowInvalidCertificates: true } : {}),
        ...(tuning.tlsAllowInvalidHostnames ? { tlsAllowInvalidHostnames: true } : {}),
    } as mongoose.ConnectOptions;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const getMongoClientPromise = (): Promise<MongoClient> => {
    const uri = process.env.MONGO_URI;
    const options = mongoClientOptionsFromEnv();

    if (!uri) {
        throw new Error('Please add your Mongo URI to .env.local');
    }

    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable so the client is not constantly reinitialized.
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect() as Promise<MongoClient>;
        }
        return global._mongoClientPromise as Promise<MongoClient>;
    } else {
        // In production mode, it's best to not use a global variable.
        if (!clientPromise) {
            client = new MongoClient(uri, options);
            clientPromise = client.connect();
        }
        return clientPromise;
    }
};

// Function to connect to MongoDB using Mongoose
const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    const options = mongooseOptionsFromEnv();
    
    if (!uri) {
        throw new Error('Please add your Mongo URI to .env.local');
    }

    if (mongoose.connections[0].readyState) return;

    try {
        await mongoose.connect(uri, options);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error('MongoDB connection failed');
    }
};

// Export a module-scoped MongoClient promise. By doing this in a separate
// module, the client can be shared across functions.
export { getMongoClientPromise, connectDB };
