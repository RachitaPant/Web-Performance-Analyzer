import { supabase } from './supabaseClient';

type Metrics = {
  domContentLoadedTime: number;
  jsExecutionTime: number;
  coreWebVitals: {
    LCP: number;
    CLS: number;
    FID: number;
  };
  totalDomNodes: number;
  thirdPartyRequestsCount: number;
};

export const saveAnalysisHistory = async (metrics: Metrics, url: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('search_history').insert([{
    user_id: user.id,
    url,
    dom_content_loaded_time: metrics.domContentLoadedTime,
    js_execution_time: metrics.jsExecutionTime,
    lcp: metrics.coreWebVitals.LCP,
    cls: metrics.coreWebVitals.CLS,
    fid: metrics.coreWebVitals.FID,
    total_dom_nodes: metrics.totalDomNodes,
    third_party_requests_count: metrics.thirdPartyRequestsCount,
  }]);

  if (error) console.error('Error saving:', error);
};

