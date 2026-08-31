export interface LockEntry {
	filePath: string;
	ownerTaskId: string;
	acquiredAt: number;
	status: 'active' | 'released';
}

export interface LockConflict {
	filePath: string;
	existingOwner: string;
	requestingTask: string;
}

export class LockRegistry {
	private locks = new Map<string, LockEntry>();

	acquire(filePath: string, taskId: string): LockConflict | null {
		const existing = this.locks.get(filePath);
		if (existing && existing.ownerTaskId !== taskId && existing.status === 'active') {
			return { filePath, existingOwner: existing.ownerTaskId, requestingTask: taskId };
		}
		this.locks.set(filePath, {
			filePath,
			ownerTaskId: taskId,
			acquiredAt: Date.now(),
			status: 'active',
		});
		return null;
	}

	acquireMany(filePaths: string[], taskId: string): LockConflict[] {
		const conflicts: LockConflict[] = [];
		const acquired: string[] = [];
		const newlyAcquired = new Set<string>();
		for (const fp of filePaths) {
			const wasAlreadyHeld =
				this.locks.has(fp) &&
				this.locks.get(fp)!.ownerTaskId === taskId &&
				this.locks.get(fp)!.status === 'active';

			const conflict = this.acquire(fp, taskId);
			if (conflict) {
				for (const name of newlyAcquired) {
					const entry = this.locks.get(name);
					if (entry && entry.ownerTaskId === taskId && entry.status === 'active') {
						entry.status = 'released';
					}
				}
				conflicts.push(conflict);
				return conflicts;
			}
			if (!wasAlreadyHeld) {
				newlyAcquired.add(fp);
			}
			acquired.push(fp);
		}
		return conflicts;
	}

	release(taskId: string): void {
		for (const [, entry] of this.locks) {
			if (entry.ownerTaskId === taskId) {
				entry.status = 'released';
			}
		}
	}

	getConflicts(taskId: string): LockConflict[] {
		const conflicts: LockConflict[] = [];
		const taskLocks = Array.from(this.locks.values()).filter(l => l.ownerTaskId === taskId && l.status === 'active');
		for (const lock of taskLocks) {
			const others = Array.from(this.locks.values()).filter(
				l => l.filePath === lock.filePath && l.ownerTaskId !== taskId && l.status === 'active'
			);
			for (const other of others) {
				conflicts.push({ filePath: lock.filePath, existingOwner: other.ownerTaskId, requestingTask: taskId });
			}
		}
		return conflicts;
	}

	getOwnedFiles(taskId: string): string[] {
		return Array.from(this.locks.values())
			.filter(l => l.ownerTaskId === taskId && l.status === 'active')
			.map(l => l.filePath);
	}

	clear(): void {
		this.locks.clear();
	}
}
