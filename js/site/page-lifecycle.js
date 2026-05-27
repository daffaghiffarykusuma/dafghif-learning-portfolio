const toTask = (task) => typeof task === 'function' ? { name: task.name || 'anonymous initializer', init: task } : task;

export function createPageLifecycle({ optional = [], critical = [], warn = console.warn } = {}) {
    const cleanupTasks = [];
    let pageHandle = null;

    const rememberCleanup = (handle) => {
        if (handle?.destroy) {
            cleanupTasks.push(() => handle.destroy());
        }
    };

    const runCritical = (taskInput) => {
        const task = toTask(taskInput);
        const handle = task.init();
        rememberCleanup(handle);
        pageHandle = handle || pageHandle;
        return handle;
    };

    const runOptional = (taskInput) => {
        const task = toTask(taskInput);
        try {
            const handle = task.init();
            rememberCleanup(handle);
            return handle;
        } catch (error) {
            warn(`Optional page initializer failed: ${task.name}`, error);
            return null;
        }
    };

    const init = () => {
        optional.forEach(runOptional);
        critical.forEach(runCritical);
        return pageHandle;
    };

    const destroy = () => {
        while (cleanupTasks.length) {
            cleanupTasks.pop()();
        }
        pageHandle = null;
    };

    return { init, destroy };
}
