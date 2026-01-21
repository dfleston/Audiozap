'use client';

type LogType = 'info' | 'error' | 'success' | 'warn' | 'protocol';

export interface LogEntry {
    timestamp: string;
    message: string;
    type: LogType;
    isCritical?: boolean;
}

type LogHandler = (entry: LogEntry) => void;

class Logger {
    private handlers: LogHandler[] = [];
    private history: LogEntry[] = [];

    subscribe(handler: LogHandler) {
        this.handlers.push(handler);
        // Provide existing history to new subscribers
        this.history.forEach(handler);
        return () => {
            this.handlers = this.handlers.filter(h => h !== handler);
        };
    }

    log(message: string, type: LogType = 'info', isCritical: boolean = false) {
        const entry: LogEntry = {
            timestamp: new Date().toLocaleTimeString(),
            message,
            type,
            isCritical: isCritical || type === 'error' || type === 'protocol'
        };
        this.history.push(entry);
        this.handlers.forEach(h => h(entry));
        console.log(`[${entry.type.toUpperCase()}] ${message}`);
    }

    info(msg: string, isCritical: boolean = false) { this.log(msg, 'info', isCritical); }
    error(msg: string) { this.log(msg, 'error', true); }
    success(msg: string, isCritical: boolean = false) { this.log(msg, 'success', isCritical); }
    warn(msg: string) { this.log(msg, 'warn', true); }
    protocol(msg: string) { this.log(msg, 'protocol', true); }

    getHistory() {
        return this.history;
    }
}

export const studioLogger = new Logger();
