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

  // Phase 1: Video upload + Frame Extraction + Blur Filter + Dedup Filter + Rank
  const run = useCallback(async (file: File, userId?: string) => {
    update({ ...INITIAL, status: 'uploading', error: null });

    try {
      // Step 1–2: Upload
      const uploadRes = await uploadVideo(file, analysisType, userId);
      update({ requestId: uploadRes.request_id, status: 'extracting' });

      // Step 3–5: Process (blur filter → dedup → rank)
      update({ status: 'filtering_blur' });
      const processRes = await processVideo(uploadRes.request_id, uploadRes.video_path, userId);

      // ✅ Frames are cleaned & uploaded to Supabase — show them to user FIRST
      update({
        status: 'frames_ready',
        requestId: uploadRes.request_id,
        framePaths: processRes.frame_paths,
        frameUrls: processRes.frame_urls ?? [],
        clarityScores: processRes.clarity_scores ?? [],
        processStats: {
          framesExtracted: processRes.frames_extracted,
          framesAfterBlur: processRes.frames_after_blur_filter,
          framesAfterDedup: processRes.frames_after_dedup,
          topFrames: processRes.top_frames_selected,
        },
      });
    } catch (err: any) {
      update({ status: 'error', error: err.message || 'An unexpected error occurred during video processing.' });
    }
  }, [analysisType, update]);

  // Phase 2: User triggers AI Analysis on the selected cleaned frames
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
      // Don't wipe framePaths or frameUrls on AI error — allow user to see frames and retry!
      update({
        status: 'error',
        error: err.message || 'AI analysis failed. You can retry with the button below.',
      });
    }
  }, [analysisType, state.requestId, state.framePaths, update]);


  return { state, run, startAnalysis, reset };
}
