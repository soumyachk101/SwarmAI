import type { ModelSize, TranscriptionResult, TranscriptionSegment } from '../types.js';
import type { STTEngine } from './index.js';
import fs from 'node:fs';
import path from 'node:path';
import { platform } from 'node:os';
import { invoke } from '@tauri-apps/api/core';

import {
 getModelInfo,
 getModelPath,
 getBinaryInfo,
 getBinaryPath,
 resolveCacheDir,
 ensureDirectory,
 downloadFile,
 extractArchive,
} from './model-cache.js';

interface WhisperSpawnRequest {
 binary_path: string;
 args: string[];
 working_dir?: string;
 timeout_secs: number;
}

interface WhisperSpawnResponse {
 pid: number;
 exit_code: number;
 stdout: string;
}

function parseWhisperOutput(text: string): { fullText: string; segments: TranscriptionSegment[] } {
 const segments: TranscriptionSegment[] = [];
 const lines = text.trim().split('\n');
 const segmentLines: string[] = [];

 for (const line of lines) {
 const trimmed = line.trim();
 if (!trimmed) continue;

 const match = trimmed.match(/^\[(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2})\.(\d{3})\]\s*(.+)$/);
 if (match) {
 const startMin = parseInt(match[1], 10);
 const startSec = parseInt(match[2], 10);
 const startMs = parseInt(match[3], 10);
 const endMin = parseInt(match[4], 10);
 const endSec = parseInt(match[5], 10);
 const endMs = parseInt(match[6], 10);
 const text = match[7].trim();

 segments.push({
 start: startMin * 60 + startSec + startMs / 1000,
 end: endMin * 60 + endSec + endMs / 1000,
 text,
 });
 segmentLines.push(text);
 } else {
 segmentLines.push(trimmed);
 }
 }

 return {
 fullText: segmentLines.join(' ').replace(/\s+/g, ' ').trim(),
 segments,
 };
}

export class WhisperCppEngine implements STTEngine {
 private cacheDir: string;
 private binaryPath: string;
 private binaryReady = false;

 constructor(cacheDir?: string) {
 this.cacheDir = resolveCacheDir(cacheDir);
 this.binaryPath = getBinaryPath(this.cacheDir);
 }

 private async ensureBinary(): Promise<void> {
 if (this.binaryReady) return;
 if (fs.existsSync(this.binaryPath)) {
 this.binaryReady = true;
 return;
 }

 const binDir = path.dirname(this.binaryPath);
 ensureDirectory(binDir);

 const info = getBinaryInfo();
 const archivePath = path.join(binDir, info.filename);

 if (!fs.existsSync(archivePath)) {
 await downloadFile(info.url, archivePath);
 }

 const extractDir = path.join(binDir, 'extracted');
 await extractArchive(archivePath, extractDir);

 const extractedFiles = fs.readdirSync(extractDir);
 const binaryFile = extractedFiles.find((f) => f.startsWith('whisper-cli'));
 if (!binaryFile) {
 throw new Error(`whisper-cli binary not found in extracted archive at ${extractDir}`);
 }

 const extractedPath = path.join(extractDir, binaryFile);
 fs.renameSync(extractedPath, this.binaryPath);

 try {
 fs.rmSync(extractDir, { recursive: true, force: true });
 } catch (err) { console.warn('[whisper-cpp] failed to remove temp extract dir:', err); }
 try {
 fs.unlinkSync(archivePath);
 } catch (err) { console.warn('[whisper-cpp] failed to remove archive:', err); }

 if (platform() !== 'win32') {
 fs.chmodSync(this.binaryPath, 0o755);
 }

 this.binaryReady = true;
 }

 async ensureModel(modelSize: ModelSize): Promise<void> {
 const modelPath = getModelPath(this.cacheDir, modelSize);
 if (fs.existsSync(modelPath)) return;

 const modelDir = path.dirname(modelPath);
 ensureDirectory(modelDir);

 const info = getModelInfo(modelSize);
 await downloadFile(info.url, modelPath);
 }

 async isModelDownloaded(modelSize: ModelSize): Promise<boolean> {
 return fs.existsSync(getModelPath(this.cacheDir, modelSize));
 }

 async getAvailableModels(): Promise<ModelSize[]> {
 const sizes: ModelSize[] = ['tiny.en', 'base.en', 'small.en', 'medium.en'];
 return sizes;
 }

 async transcribe(audioPath: string, modelSize: ModelSize = 'small.en'): Promise<TranscriptionResult> {
 if (!fs.existsSync(audioPath)) {
 throw new Error(`Audio file not found: ${audioPath}`);
 }

 await this.ensureBinary();
 await this.ensureModel(modelSize);

 const modelPath = getModelPath(this.cacheDir, modelSize);
 const args = [
 '-f', audioPath,
 '-m', modelPath,
 '--output-txt',
 ];

 const startTime = Date.now();

 // Route process spawning through Tauri backend commands instead of
 // node:child_process (which is blocked in the renderer).
 try {
 const response = await invoke<WhisperSpawnResponse>('spawn_whisper_process', {
 req: {
 binary_path: this.binaryPath,
 args,
 working_dir: this.cacheDir,
 timeout_secs: 120,
 } as WhisperSpawnRequest,
 });

 const durationMs = Date.now() - startTime;

 const outputTxtPath = audioPath.replace(/\.[^.]+$/, '') + '.txt';
 let transcript = '';

 if (fs.existsSync(outputTxtPath)) {
 transcript = fs.readFileSync(outputTxtPath, 'utf-8');
 try { fs.unlinkSync(outputTxtPath); } catch { /* ignore cleanup errors */ }
 } else {
 transcript = response.stdout;
 }

 const { fullText, segments } = parseWhisperOutput(transcript);

 return {
 text: fullText,
 durationMs,
 modelSize,
 segments,
 cleaned: false,
 };
 } catch (error) {
 throw new Error(`Failed to run whisper-cpp via Tauri: ${error}`);
 }
 }
}
