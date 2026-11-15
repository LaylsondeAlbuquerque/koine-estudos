import {afterEach, describe, expect, it, vi} from 'vitest';
import {WordFormsService, morphologyLabel} from './word-forms.service';
import {Word} from '../models';

describe('Lexical form consultation',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  const word = {id:'v-example',lemma:'δῶρον'} as Word;
  it('loads on demand, caches requests and retries after a failed fetch',async()=>{
    const entry={lemma:word.lemma,forms:[{spellings:['δῶρον'],count:2,analyses:[]}]};
    const fetcher=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue({ok:true,json:async()=>({version:1,words:{[word.id]:entry}})});
    vi.stubGlobal('fetch',fetcher);
    const service=new WordFormsService();
    expect(fetcher).not.toHaveBeenCalled();
    await expect(service.load(word)).rejects.toThrow();
    const [a,b]=await Promise.all([service.load(word),service.load(word)]);
    expect(a).toEqual(entry);expect(a).toBe(b);expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1][0])).toContain('/data/word-forms/');
    await expect(service.load({...word,lemma:'different'})).rejects.toThrow();
  });
  it('translates each morphological feature without conflating case alternatives',()=>{
    expect(morphologyLabel(['noun','','singular','neuter','nominative','','','','']))
      .toBe('Substantivo · nominativo · singular · neutro');
    expect(morphologyLabel(['verb','third','singular','','','aorist','active','indicative','']))
      .toBe('Verbo · indicativo · aoristo · voz ativa · 3ª pessoa · singular');
  });
});
