import {TestBed} from '@angular/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {blankProgress} from '../models';
import {ProgressComponent} from './progress.component';

describe('ProgressComponent backup input', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({imports: [ProgressComponent], providers: [ContentService, ProgressService]});
  });
  afterEach(() => { vi.restoreAllMocks(); TestBed.resetTestingModule(); });

  it('clears a canceled selection so the same JSON can be selected and imported again', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const component = TestBed.createComponent(ProgressComponent).componentInstance;
    const progress = TestBed.inject(ProgressService), backup = blankProgress();
    backup.sessions = 7;
    const file = {size: 100, text: async () => JSON.stringify(backup)} as File;
    const input = {value: 'backup.json', files: [file]};
    const event = {target: input} as unknown as Event;
    await component.importFile(event);
    expect(input.value).toBe('');
    expect(progress.state().sessions).toBe(0);
    confirm.mockReturnValue(true);
    input.value = 'backup.json';
    await component.importFile(event);
    expect(input.value).toBe('');
    expect(progress.state().sessions).toBe(7);
    expect(confirm).toHaveBeenCalledTimes(2);
  });

  it('clears an invalid file while preserving the existing progress', async () => {
    const component = TestBed.createComponent(ProgressComponent).componentInstance;
    const progress = TestBed.inject(ProgressService);
    progress.setLevel('syntax', 2);
    const previous = progress.state();
    const input = {value: 'backup.json', files: [{size: 50, text: async () => '{invalid'} as File]};
    await component.importFile({target: input} as unknown as Event);
    expect(input.value).toBe('');
    expect(progress.state()).toBe(previous);
    expect(progress.level('syntax')).toBe(2);
  });
});
