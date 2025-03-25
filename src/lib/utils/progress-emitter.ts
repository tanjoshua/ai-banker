type ProgressEvent = {
    type: 'start' | 'progress' | 'complete';
    filename?: string;
    currentFile?: number;
    totalFiles?: number;
    chunks?: number;
};

class ProgressEmitter {
    private static instance: ProgressEmitter;
    private listeners: Set<(event: ProgressEvent) => void>;

    private constructor() {
        this.listeners = new Set();
    }

    static getInstance() {
        if (!ProgressEmitter.instance) {
            ProgressEmitter.instance = new ProgressEmitter();
        }
        return ProgressEmitter.instance;
    }

    addListener(callback: (event: ProgressEvent) => void) {
        this.listeners.add(callback);
    }

    removeListener(callback: (event: ProgressEvent) => void) {
        this.listeners.delete(callback);
    }

    emit(event: ProgressEvent) {
        this.listeners.forEach(listener => listener(event));
    }
}

export const progressEmitter = ProgressEmitter.getInstance(); 