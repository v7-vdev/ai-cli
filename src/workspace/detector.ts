import { FrameworkDetection } from './metadata.js';

export function detectFrameworks(packageJson: any, rootFiles: string[]): FrameworkDetection[] {
    const frameworks: FrameworkDetection[] = [];
    const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };

    if (deps['typescript'] || rootFiles.includes('tsconfig.json')) {
        frameworks.push({ name: 'TypeScript', type: 'language' });
    }
    if (deps['react']) {
        frameworks.push({ name: 'React', type: 'frontend' });
    }
    if (deps['next'] || rootFiles.includes('next.config.js') || rootFiles.includes('next.config.mjs')) {
        frameworks.push({ name: 'Next.js', type: 'fullstack' });
    }
    if (deps['vite'] || rootFiles.includes('vite.config.ts') || rootFiles.includes('vite.config.js')) {
        frameworks.push({ name: 'Vite', type: 'tooling' });
    }
    if (deps['express']) {
        frameworks.push({ name: 'Express', type: 'backend' });
    }
    if (deps['prisma'] || rootFiles.includes('prisma')) {
        frameworks.push({ name: 'Prisma', type: 'database' });
    }
    if (deps['mongoose'] || deps['mongodb']) {
        frameworks.push({ name: 'MongoDB', type: 'database' });
    }
    if (deps['pg'] || deps['postgres']) {
        frameworks.push({ name: 'PostgreSQL', type: 'database' });
    }

    return frameworks;
}

export function detectPackageManager(rootFiles: string[]): 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown' {
    if (rootFiles.includes('package-lock.json')) return 'npm';
    if (rootFiles.includes('yarn.lock')) return 'yarn';
    if (rootFiles.includes('pnpm-lock.yaml')) return 'pnpm';
    if (rootFiles.includes('bun.lockb')) return 'bun';
    return 'unknown';
}
