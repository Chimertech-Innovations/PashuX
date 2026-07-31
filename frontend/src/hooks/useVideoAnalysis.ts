import { useState, useCallback } from 'react';
import { uploadVideo, processVideo, analyseBCS, analyseDisease, analyseCombined } from '@/lib/api';
import type { AnalysisType, AnalysisState } from '@/types';

const INITIAL: AnalysisState = {
  requestId: null,
  status: 'idle',
  framePaths: [],
  frameUrls: [],
  clarityScores: [],
  processStats: null,
  bcsResult: null,
  diseaseResult: null,
  error: null,
};

export function useVideoAnalysis(analysisType: AnalysisType) {
  const [state, setState] = useState<AnalysisState>(INITIAL);

  const update = useCallback((patch: Partial<AnalysisState>) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const reset = useCallback(() => setState(INITIAL), []);

  // End-to-end automated pipeline: Upload -> Extract/Process -> Direct AI Analysis (Fast & Continuous)
  const run = useCallback(async (file: File, userId?: string) => {
    update({ ...INITIAL, status: 'uploading', error: null });

    try {
      // Step 1: Upload media
      const uploadRes = await uploadVideo(file, analysisType, userId);
      update({ requestId: uploadRes.request_id, status: 'extracting' });

      // Step 2: Extract & clean frames
      const processRes = await processVideo(uploadRes.request_id, uploadRes.video_path, userId);

      const framePaths = processRes.frame_paths || [];
      if (!framePaths.length) {
        throw new Error('No clean frames could be extracted from the uploaded video.');
      }

      // Step 3: Fast Automatic AI Analysis (No waiting for user button click!)
      update({
        status: 'sending_ai',
        requestId: uploadRes.request_id,
        framePaths,
        frameUrls: processRes.frame_urls ?? [],
        clarityScores: processRes.clarity_scores ?? [],
        processStats: {
          framesExtracted: processRes.frames_extracted,
          framesAfterBlur: processRes.frames_after_blur_filter,
          framesAfterDedup: processRes.frames_after_dedup,
          topFrames: processRes.top_frames_selected,
        },
      });

      if (analysisType === 'combined') {
        const res = await analyseCombined(uploadRes.request_id, framePaths, userId);
        update({
          bcsResult: res.bcs_result,
          diseaseResult: res.disease_result,
          status: 'completed',
        });
      } else if (analysisType === 'bcs') {
        const res = await analyseBCS(uploadRes.request_id, framePaths, userId);
        update({ bcsResult: res.result as any, status: 'completed' });
      } else {
        const res = await analyseDisease(uploadRes.request_id, framePaths, userId);
        update({ diseaseResult: res.result as any, status: 'completed' });
      }
    } catch (err: any) {
      update({
        status: 'error',
        error: err.message || 'An unexpected error occurred during processing & analysis.',
      });
    }
  }, [analysisType, update]);

  // Retry trigger if needed
  const startAnalysis = useCallback(async (userId?: string) => {
    if (!state.requestId || !state.framePaths.length) return;

    update({ status: 'sending_ai', error: null });

    try {
      if (analysisType === 'combined') {
        const res = await analyseCombined(state.requestId, state.framePaths, userId);
        update({
          bcsResult: res.bcs_result,
          diseaseResult: res.disease_result,
          status: 'completed',
        });
      } else if (analysisType === 'bcs') {
        const res = await analyseBCS(state.requestId, state.framePaths, userId);
        update({ bcsResult: res.result as any, status: 'completed' });
      } else {
        const res = await analyseDisease(state.requestId, state.framePaths, userId);
        update({ diseaseResult: res.result as any, status: 'completed' });
      }
    } catch (err: any) {
      update({
        status: 'error',
        error: err.message || 'AI analysis failed. You can retry with the button below.',
      });
    }
  }, [analysisType, state.requestId, state.framePaths, update]);

  return { state, run, startAnalysis, reset };
}
